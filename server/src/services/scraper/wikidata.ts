import axios from "axios";
import { prisma } from "../../lib/prisma.js";
import { LEAGUE_REGISTRY } from "../../config/leagues.js";

const WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql";
const USER_AGENT =
  process.env.WIKI_USER_AGENT || "PitchPredict/1.0 (personal football prediction tool)";

interface SparqlTeam {
  team: { value: string };
  teamLabel: { value: string; "xml:lang"?: string };
  teamDescription?: { value: string; "xml:lang"?: string };
  leagueLabel: { value: string; "xml:lang"?: string };
  countryLabel: { value: string; "xml:lang"?: string };
  logo?: { value: string };
  founded?: { value: string };
}

interface SparqlResponse {
  results: { bindings: SparqlTeam[] };
}

const SPARQL_QUERY = `
SELECT ?team ?teamLabel ?teamDescription ?leagueLabel ?countryLabel ?logo ?founded WHERE {
  ?team wdt:P31/wdt:P279* wd:Q476028 .
  ?team wdt:P118 ?league .
  ?team wdt:P17 ?country .
  OPTIONAL { ?team wdt:P154 ?logo . }
  OPTIONAL { ?team wdt:P571 ?founded . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
`;

function extractIdFromUri(uri: string): string {
  const match = uri.match(/\/entity\/(Q\d+)/);
  return match ? match[1] : uri;
}

function cleanLogoUrl(url: string): string {
  if (url.includes("Special:FilePath/")) {
    const file = url.split("Special:FilePath/")[1];
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${decodeURIComponent(file)}`;
  }
  return url;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

function isFootballLeague(leagueLabel: string): boolean {
  const lower = leagueLabel.toLowerCase();
  const nonFootball = [
    "volleyball",
    "basketball",
    "handball",
    "rugby",
    "hockey",
    "baseball",
    "futsal",
    "water polo",
    "eSports",
    "esports",
    "cricket",
    "tennis",
    "golf",
    "athletics",
    "swimming",
    "cycling",
    "boxing",
    "wrestling",
    "martial arts",
    "judo",
    "karate",
  ];
  return !nonFootball.some((nf) => lower.includes(nf));
}

export async function fetchAllTeams(retries = 3): Promise<Map<string, SparqlTeam[]>> {
  console.log("Fetching all football clubs from Wikidata...");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get<SparqlResponse>(WIKIDATA_ENDPOINT, {
        params: {
          query: SPARQL_QUERY,
          format: "json",
        },
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/sparql-results+json",
        },
        timeout: 120000,
      });

      const bindings = response.data.results.bindings;
      console.log(`  Raw results: ${bindings.length} rows`);

      const teamMap = new Map<string, SparqlTeam[]>();

      for (const row of bindings) {
        const qid = extractIdFromUri(row.team.value);
        const league = row.leagueLabel.value;

        if (!isFootballLeague(league)) continue;

        if (!teamMap.has(qid)) {
          teamMap.set(qid, []);
        }
        teamMap.get(qid)!.push(row);
      }

      console.log(`  Unique teams (football only): ${teamMap.size}`);
      return teamMap;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  Attempt ${attempt}/${retries} failed: ${msg}`);
      if (attempt < retries) {
        const delay = attempt * 10000;
        console.log(`  Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to fetch from Wikidata after ${retries} attempts`);
}

export async function ingestTeams(
  teamMap: Map<string, SparqlTeam[]>,
): Promise<{ created: number; updated: number; skipped: number }> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const existingLeagues = await prisma.league.findMany();

  // Build lookup by name and by aliases
  const leagueByName = new Map(existingLeagues.map((l) => [l.name.toLowerCase(), l]));
  const leagueByAlias = new Map<string, typeof existingLeagues[0]>();
  for (const league of existingLeagues) {
    const config = LEAGUE_REGISTRY.find((c) => c.name === league.name);
    if (config?.wikidataAliases) {
      for (const alias of config.wikidataAliases) {
        leagueByAlias.set(alias.toLowerCase(), league);
      }
    }
  }

  // Check which qids already exist
  const allQids = Array.from(teamMap.keys());
  const existing = await prisma.team.findMany({
    where: { wikidataId: { in: allQids } },
    select: { wikidataId: true },
  });
  const existingQids = new Set(existing.map((t) => t.wikidataId));
  console.log(`  Already in DB: ${existingQids.size}, new to insert: ${allQids.length - existingQids.size}`);

  const BATCH_SIZE = 500;
  const entries = Array.from(teamMap.entries());

  function matchLeague(leagueLabel: string): number | null {
    const lower = leagueLabel.toLowerCase();
    const direct = leagueByName.get(lower);
    if (direct) return direct.id;
    const alias = leagueByAlias.get(lower);
    if (alias) return alias.id;
    return null;
  }

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    const toCreate: typeof batch = [];
    const toUpdate: typeof batch = [];

    for (const [qid, rows] of batch) {
      if (existingQids.has(qid)) {
        toUpdate.push([qid, rows]);
      } else {
        toCreate.push([qid, rows]);
      }
    }

    // Batch create new teams in a transaction
    if (toCreate.length > 0) {
      const createData = toCreate.map(([qid, rows]) => {
        const primary = rows[0];
        const name = primary.teamLabel.value;
        const shortName = name
          .replace(/\s+(F\.C\.|FC|CF|AC|AS|SC|SSC|SK|BK|FK|OK|SFC|U\.S\.|A\.S\.|R\.C\.|R\.S\.|S\.A\.|C\.A\.|C\.F\.|V\.f\.B\.|B\.V\.|H\.B\.|1\. FC|1\. FC|FC)$/i, "")
          .trim();
        let matchedLeagueId: number | null = null;
        for (const row of rows) {
          matchedLeagueId = matchLeague(row.leagueLabel.value);
          if (matchedLeagueId) break;
        }
        return {
          wikidataId: qid,
          name,
          shortName: shortName !== name ? shortName : null,
          slug: slugify(name),
          country: primary.countryLabel.value,
          logoUrl: primary.logo ? cleanLogoUrl(primary.logo.value) : null,
          founded: primary.founded ? new Date(primary.founded.value).getFullYear() : null,
          leagueId: matchedLeagueId,
          wikipediaName: name,
        };
      });

      try {
        const result = await prisma.team.createMany({ data: createData });
        created += result.count;
      } catch {
        // Fallback: insert one by one for this batch
        for (const data of createData) {
          try {
            await prisma.team.create({ data });
            created++;
          } catch {
            skipped++;
          }
        }
      }
    }

    // Update existing teams
    for (const [qid, rows] of toUpdate) {
      const primary = rows[0];
      const name = primary.teamLabel.value;
      const logoUrl = primary.logo ? cleanLogoUrl(primary.logo.value) : null;
      const foundedYear = primary.founded ? new Date(primary.founded.value).getFullYear() : null;
      let matchedLeagueId: number | null = null;
      for (const row of rows) {
        matchedLeagueId = matchLeague(row.leagueLabel.value);
        if (matchedLeagueId) break;
      }
      try {
        await prisma.team.updateMany({
          where: { wikidataId: qid },
          data: {
            name,
            country: primary.countryLabel.value,
            logoUrl,
            founded: foundedYear,
            leagueId: matchedLeagueId,
          },
        });
        updated++;
      } catch {
        skipped++;
      }
    }

    console.log(
      `  Progress: ${Math.min(i + BATCH_SIZE, entries.length)}/${entries.length} ` +
      `(created: ${created}, updated: ${updated}, skipped: ${skipped})`,
    );
  }

  return { created, updated, skipped };
}

export async function runWikidataIngestion(teamMap?: Map<string, SparqlTeam[]>): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  console.log("=== Wikidata Team Ingestion ===\n");

  if (!teamMap) {
    teamMap = await fetchAllTeams();
  }
  const result = await ingestTeams(teamMap);

  console.log("\n=== Ingestion Complete ===");
  console.log(`  Created: ${result.created}`);
  console.log(`  Updated: ${result.updated}`);
  console.log(`  Skipped: ${result.skipped}`);

  return result;
}
