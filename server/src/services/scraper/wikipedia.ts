import axios from "axios";
import { prisma } from "../../lib/prisma.js";

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  process.env.WIKI_USER_AGENT || "PitchPredict/1.0 (contact: dappermaatla22@gmail.com)";

interface ParsedMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchday?: number;
  date?: Date;
}

interface ParsedTeam {
  code: string;
  name: string;
}

const httpAgent = new (require("http").Agent)({ family: 4 });
const httpsAgent = new (require("https").Agent)({ family: 4 });

async function fetchWikitext(title: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(WIKI_API, {
        params: {
          action: "parse",
          page: title,
          prop: "wikitext",
          format: "json",
          formatversion: 2,
        },
        headers: { "User-Agent": USER_AGENT },
        timeout: 60000,
        httpAgent,
        httpsAgent,
      });

      if (!response.data.parse) {
        throw new Error(`Page not found: ${title}`);
      }

      return response.data.parse.wikitext;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isTimeout = msg.includes("ETIMEDOUT") || msg.includes("ENETUNREACH");
      const delay = isTimeout ? attempt * 5000 : attempt * 2000;

      if (attempt < retries) {
        console.log(`    Retry ${attempt}/${retries} for "${title}" (waiting ${delay / 1000}s)...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed to fetch wikitext");
}

function parseSportsResults(wikitext: string): {
  teams: ParsedTeam[];
  matches: ParsedMatch[];
} {
  const teams: ParsedTeam[] = [];
  const matches: ParsedMatch[] = [];

  const teamCodeRegex = /team(\d+)=([A-Z]{3})\s/g;
  let match;
  while ((match = teamCodeRegex.exec(wikitext)) !== null) {
    const code = match[2];
    const nameRegex = new RegExp(`name_${code}\\s*=\\s*(?:\\{\\{[^}]*\\|)?\\[\\[([^\\]|]+)(?:\\|([^\\]]+))?\\]\\]`);
    const nameMatch = wikitext.match(nameRegex);
    const name = nameMatch ? (nameMatch[2] || nameMatch[1]).trim() : code;
    teams.push({ code, name });
  }

  const teamOrderRegex = /team_order\s*=\s*([A-Z,\s]+)/;
  const orderMatch = wikitext.match(teamOrderRegex);
  if (orderMatch && teams.length === 0) {
    const codes = orderMatch[1].split(/[,\s]+/).filter(Boolean);
    for (const code of codes) {
      const nameRegex = new RegExp(`name_${code}\\s*=\\s*(?:\\{\\{[^}]*\\|)?\\[\\[([^\\]|]+)(?:\\|([^\\]]+))?\\]\\]`);
      const nameMatch = wikitext.match(nameRegex);
      const name = nameMatch ? (nameMatch[2] || nameMatch[1]).trim() : code;
      teams.push({ code, name });
    }
  }

  const matchRegex = /match_([A-Z]{2,4})_([A-Z]{2,4})\s*=\s*(?:\[\[[^\]]*\|)?(?:\{\{[^}]*\|)?(\d+)\s*[-–]\s*(\d+)(?:\]\])?(?:\}\})?/g;
  while ((match = matchRegex.exec(wikitext)) !== null) {
    const homeCode = match[1];
    const awayCode = match[2];
    const homeScore = parseInt(match[3], 10);
    const awayScore = parseInt(match[4], 10);
    const homeTeam = teams.find((t) => t.code === homeCode)?.name || homeCode;
    const awayTeam = teams.find((t) => t.code === awayCode)?.name || awayCode;
    matches.push({ homeTeam, awayTeam, homeScore, awayScore });
  }

  return { teams, matches };
}

function parseDate(dateStr: string): Date | undefined {
  const startDateMatch = dateStr.match(/\{\{[Ss]tart date\|(\d{4})\|(\d{1,2})\|(\d{1,2})/);
  if (startDateMatch) {
    return new Date(parseInt(startDateMatch[1]), parseInt(startDateMatch[2]) - 1, parseInt(startDateMatch[3]));
  }

  const plainMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (plainMatch) {
    const d = new Date(`${plainMatch[1]} ${plainMatch[2]} ${plainMatch[3]}`);
    if (!isNaN(d.getTime())) return d;
  }

  return undefined;
}

function cleanWikiLinks(text: string): string {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\{\{#invoke:[^}]+\}\}/g, "")
    .replace(/\{\{(?:fbaicon|fbicon|flagicon|flag)[^}]*\}\}/g, "")
    .replace(/\{\{[^}]*\|([^}]+)\}\}/g, "$1")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/<ref[^>]*>.*?<\/ref>/g, "")
    .replace(/<ref[^/]\/>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract the full content of a template by matching nested {{ }}, not just the first }}
function extractTemplateContent(wikitext: string, startIndex: number): string {
  let depth = 0;
  let i = startIndex;
  while (i < wikitext.length) {
    if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
      depth++;
      i += 2;
    } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
      if (depth === 0) {
        return wikitext.substring(startIndex, i);
      }
      depth--;
      i += 2;
    } else {
      i++;
    }
  }
  return wikitext.substring(startIndex);
}

// Parse {{#invoke:Football box|main ... }} and {{Football box ... }} templates
function parseFootballBox(wikitext: string): ParsedMatch[] {
  const matches: ParsedMatch[] = [];

  const boxStartRegex = /\{\{(?:#invoke:[Ff]ootball box\|main|Football box)\s*\n/g;
  let startMatch;
  while ((startMatch = boxStartRegex.exec(wikitext)) !== null) {
    const contentStart = startMatch.index + startMatch[0].length;
    const content = extractTemplateContent(wikitext, contentStart);

    const getParam = (name: string): string => {
      const re = new RegExp(`^\\|\\s*${name}\\s*=\\s*(.*)$`, "im");
      const m = content.match(re);
      return m ? m[1].trim() : "";
    };

    const team1Raw = getParam("team1");
    const team2Raw = getParam("team2");
    const scoreRaw = getParam("score");
    const dateRaw = getParam("date");
    const matchdayRaw = getParam("matchday") || getParam("round");

    if (!team1Raw || !team2Raw || !scoreRaw) continue;

    const scoreMatch = scoreRaw.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (!scoreMatch) continue;

    const homeScore = parseInt(scoreMatch[1], 10);
    const awayScore = parseInt(scoreMatch[2], 10);
    const homeTeam = cleanWikiLinks(team1Raw);
    const awayTeam = cleanWikiLinks(team2Raw);

    if (!homeTeam || !awayTeam) continue;

    const date = dateRaw ? parseDate(dateRaw) : undefined;
    const matchday = matchdayRaw ? parseInt(matchdayRaw.replace(/\D/g, ""), 10) || undefined : undefined;

    matches.push({ homeTeam, awayTeam, homeScore, awayScore, date, matchday });
  }

  return matches;
}

// Parse {{#invoke:Sports series|main|legs=0|h_a=y|...|caption=Matchday N ... }}
// Format: |[[Team A]]|Country|1–2|[[Team B]]|Country
function parseSportsSeries(wikitext: string): ParsedMatch[] {
  const matches: ParsedMatch[] = [];

  const seriesStartRegex = /\{\{#invoke:[Ss]ports series\|main([\s\S]*?)\}\}/g;
  let seriesMatch;

  while ((seriesMatch = seriesStartRegex.exec(wikitext)) !== null) {
    const header = seriesMatch[1];

    let matchday: number | undefined;
    const captionMatch = header.match(/caption.*?[Mm]atchday\s+(\d+)/);
    if (captionMatch) {
      matchday = parseInt(captionMatch[1], 10);
    }

    const body = seriesMatch[0].substring(seriesMatch[0].indexOf(header));
    const rows = body.split("\n");

    for (const row of rows) {
      const trimmed = row.trim();
      if (!trimmed.startsWith("|") || !trimmed.includes("[[")) continue;

      // Protect pipe characters inside [[wiki links]] before splitting
      const protectedRow = trimmed.replace(/\[\[[^\]]+\]\]/g, (m) => m.replace(/\|/g, "\x00"));

      const cells = protectedRow.split("|").map(c => c.trim().replace(/\x00/g, "|")).filter(Boolean);
      if (cells.length < 4) continue;

      // Find the score cell (pattern: X–Y or X-Y)
      let scoreIdx = -1;
      for (let i = 0; i < cells.length; i++) {
        if (/^\d+\s*[\u2013\-]\s*\d+$/.test(cells[i])) {
          scoreIdx = i;
          break;
        }
      }
      if (scoreIdx < 1 || scoreIdx >= cells.length - 1) continue;

      // Find team names: look for cells with [[ ]] for the closest team on each side
      let homeTeam = "";
      let awayTeam = "";

      for (let i = scoreIdx - 1; i >= 0; i--) {
        if (cells[i].includes("[[")) {
          homeTeam = cleanWikiLinks(cells[i]);
          break;
        }
      }
      for (let i = scoreIdx + 1; i < cells.length; i++) {
        if (cells[i].includes("[[")) {
          awayTeam = cleanWikiLinks(cells[i]);
          break;
        }
      }

      const scoreMatch = cells[scoreIdx].match(/(\d+)\s*[\u2013\-]\s*(\d+)/);
      if (!homeTeam || !awayTeam || !scoreMatch) continue;

      matches.push({
        homeTeam,
        awayTeam,
        homeScore: parseInt(scoreMatch[1], 10),
        awayScore: parseInt(scoreMatch[2], 10),
        matchday,
      });
    }
  }

  return matches;
}

async function findTeamId(name: string): Promise<number | null> {
  const aliases: Record<string, string> = {
    // England - PL
    "Brighton & Hove Albion": "Brighton & Hove Albion",
    // La Liga
    "Celta Vigo": "RC Celta de Vigo",
    // Serie A
    "AC Milan": "AC Milan",
    // Bundesliga
    "TSG Hoffenheim": "TSG 1899 Hoffenheim",
    "Bayer Leverkusen": "Bayer 04 Leverkusen",
    "Mainz 05": "1. FSV Mainz 05",
    "Stuttgart": "VfB Stuttgart",
    // Ligue 1
    "Paris SG": "Paris Saint-Germain",
    "Rennes": "Stade Rennais F.C.",
    "Lille": "LOSC Lille",
    "Lyon": "Olympique Lyonnais",
    "Marseille": "Olympique de Marseille",
    "Brest": "Stade Brestois 29",
    // Eredivisie
    "AZ": "AZ Alkmaar",
    "NEC": "NEC FC",
    "Ajax": "AFC Ajax",
    "Twente": "FC Twente",
    "Utrecht": "FC Utrecht",
    "Heerenveen": "SC Heerenveen",
    "Groningen": "FC Groningen",
    // Primeira Liga
    "Benfica": "S.L. Benfica",
    "Porto": "F.C. Porto",
    "Braga": "S.C. Braga",
    "Nacional": "C.D. Nacional",
    "Vitória de Guimarães": "Vitória S.C.",
    "Boavista": "Boavista FC",
    "Santa Clara": "C.D. Santa Clara",
    // Scotland
    "St Mirren": "St. Mirren F.C.",
    "St Johnstone": "St Johnstone F.C.",
    "Heart of Midlothian": "Heart of Midlothian F.C.",
    "Dundee United": "Dundee United F.C.",
    // European
    "Young Boys": "BSC Young Boys",
    "Sturm Graz": "SK Sturm Graz",
    "Red Star Belgrade": "Red Star F.C.",
    "Dinamo Zagreb": "GNK Dinamo Zagreb",
    "Salzburg": "FC Red Bull Salzburg",
  };

  const searchName = aliases[name] || name;

  let result = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM Team WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    searchName,
  );
  if (result.length > 0) return result[0].id;

  result = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM Team WHERE LOWER(shortName) = LOWER(?) LIMIT 1`,
    searchName,
  );
  if (result.length > 0) return result[0].id;

  if (searchName !== name) {
    result = await prisma.$queryRawUnsafe<{ id: number }[]>(
      `SELECT id FROM Team WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      name,
    );
    if (result.length > 0) return result[0].id;
  }

  result = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM Team WHERE name LIKE ? LIMIT 1`,
    `%${searchName}%`,
  );
  return result.length > 0 ? result[0].id : null;
}

export async function scrapeLeagueResults(
  wikiPage: string,
  seasonId: number,
  leagueId: number,
  scraperType: "teamSeason" | "leagueMatrix" | "european",
  subpages?: string[],
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  const pagesToFetch = subpages
    ? subpages.map((sp) => `${wikiPage} ${sp}`)
    : [wikiPage];

  let allMatches: ParsedMatch[] = [];

  for (const page of pagesToFetch) {
    console.log(`  Fetching: ${page}`);

    let wikitext: string;
    try {
      wikitext = await fetchWikitext(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Page not found")) {
        console.log(`    Page not found, skipping...`);
        continue;
      }
      errors.push(`Failed to fetch ${page}: ${msg}`);
      continue;
    }

    let matches: ParsedMatch[] = [];

    if (scraperType === "leagueMatrix") {
      const result = parseSportsResults(wikitext);
      matches = result.matches;
      console.log(`    Found ${matches.length} matches (league matrix)`);
    } else {
      // European competitions: parse both Football box AND Sports series templates
      const boxMatches = parseFootballBox(wikitext);
      const seriesMatches = parseSportsSeries(wikitext);
      matches = boxMatches.concat(seriesMatches);
      console.log(`    Found ${matches.length} matches (${boxMatches.length} football box + ${seriesMatches.length} sports series)`);
    }

    allMatches = allMatches.concat(matches);
  }

  console.log(`  Total matches found: ${allMatches.length}`);

  // Get existing fixtures to avoid duplicates
  const existingFixtures = await prisma.fixture.findMany({
    where: { seasonId },
    select: { homeTeamId: true, awayTeamId: true },
  });
  const existingSet = new Set(
    existingFixtures.map((f) => `${f.homeTeamId}-${f.awayTeamId}`),
  );

  for (const match of allMatches) {
    const homeTeamId = await findTeamId(match.homeTeam);
    const awayTeamId = await findTeamId(match.awayTeam);

    if (!homeTeamId || !awayTeamId) {
      errors.push(`Team not found: ${!homeTeamId ? match.homeTeam : match.awayTeam}`);
      skipped++;
      continue;
    }

    const key = `${homeTeamId}-${awayTeamId}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }

    try {
      await prisma.fixture.create({
        data: {
          seasonId,
          leagueId,
          homeTeamId,
          awayTeamId,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          date: match.date || new Date(),
          status: "finished",
          matchday: match.matchday || null,
        },
      });
      existingSet.add(key);
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Unique constraint")) {
        skipped++;
      } else {
        errors.push(`Error creating fixture ${match.homeTeam} vs ${match.awayTeam}: ${msg}`);
        skipped++;
      }
    }
  }

  return { created, skipped, errors };
}

export async function scrapeSeason(
  leagueId: number,
  seasonId: number,
  wikiPage: string,
  scraperType: "teamSeason" | "leagueMatrix" | "european",
  subpages?: string[],
): Promise<void> {
  console.log(`\nScraping: ${wikiPage}`);

  const result = await scrapeLeagueResults(wikiPage, seasonId, leagueId, scraperType, subpages);

  console.log(`  Created: ${result.created}, Skipped: ${result.skipped}`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.length}`);
    result.errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      lastScraped: new Date(),
      fixtureCount: await prisma.fixture.count({ where: { seasonId } }),
      resultCount: await prisma.fixture.count({
        where: { seasonId, status: "finished" },
      }),
    },
  });
}
