import { prisma } from "../../lib/prisma.js";

const ALIASES: Record<string, string[]> = {
  "manchester united": ["man utd", "man united", "manchester united fc"],
  "manchester city": ["man city", "manchester city fc"],
  "tottenham hotspur": ["tottenham", "spurs", "tottenham hotspur fc"],
  "newcastle united": ["newcastle", "newcastle utd"],
  "west ham united": ["west ham", "west ham utd"],
  "wolverhampton wanderers": ["wolves", "wolverhampton", "wolves fc"],
  "brighton and hove albion": ["brighton", "brighton & hove albion"],
  "real madrid": ["real madrid cf", "real madrid club de fútbol", "real madrid c.f."],
  "fc barcelona": ["barcelona", "barça", "fc barcelona", "barca"],
  "atlético madrid": ["atletico madrid", "atlético de madrid", "atletico de madrid"],
  "athletic bilbao": ["athletic club", "athletic de bilbao", "athletic club de bilbao"],
  "bayern munich": ["bayern", "fc bayern munich", "fc bayern münchen", "bayern münchen"],
  "borussia dortmund": ["dortmund", "bvb", "bvb 09"],
  "paris saint-germain": ["psg", "paris saint germain", "paris saint-germain fc"],
  "olympique lyonnais": ["lyon", "ol", "olympique lyon"],
  "juventus": ["juventus fc", "juve", "juventus turin"],
  "ac milan": ["milan", "ac milan", "associazione calcio milan"],
  "inter milan": ["inter", "inter milan", "internazionale", "fc internazionale milano"],
  "as roma": ["roma", "as roma", "associazione sportiva roma"],
  "ssc napoli": ["napoli", "ssc napoli", "napoli fc"],
  "sl benfica": ["benfica", "sl benfica", "sport lisboa e benfica"],
  "sporting cp": ["sporting", "sporting lisbon", "sporting clube de portugal"],
  "fc porto": ["porto", "fc porto", "futebol clube do porto"],
  "celtic": ["celtic fc", "celtic football club"],
  "rangers": ["rangers fc", "glasgow rangers"],
  "ajax": ["ajax amsterdam", "afc ajax"],
  "feyenoord": ["feyenoord rotterdam", "feijenoord"],
  "galatasaray": ["galatasaray sk", "galatasaray s.k."],
  "fenerbahçe": ["fenerbahce", "fenerbahçe sk", "fenerbahce sk"],
  "besiktas": ["beşiktaş", "beşiktaş jk", "besiktas jk"],
  "river plate": ["club atlético river plate", "river plate"],
  "boca juniors": ["club atlético boca juniors", "boca juniors"],
  "seleção brasileira": ["brazil national team"],
  "orlando pirates": ["orlando pirates fc"],
  "kaizer chiefs": ["kaizer chiefs fc"],
  "mamelodi sundowns": ["mamelodi sundowns fc"],
};

const NORMALIZATIONS: [RegExp, string][] = [
  [/\bF\.?C\.?\b/gi, "FC"],
  [/\bS\.?C\.?\b/gi, "SC"],
  [/\bA\.?C\.?\b/gi, "AC"],
  [/\bA\.?S\.?\b/gi, "AS"],
  [/\bS\.?S\.?C\.?\b/gi, "SSC"],
  [/\bU\.?S\.?\b/gi, "US"],
  [/\bV\.?f\.?B\.?\b/gi, "VfB"],
  [/\bB\.?V\.?\b/gi, "BV"],
  [/\bH\.?B\.?\b/gi, "HB"],
  [/\bS\.?K\.?\b/gi, "SK"],
  [/\bF\.?K\.?\b/gi, "FK"],
  [/\bO\.?K\.?\b/gi, "OK"],
  [/\bR\.?C\.?\b/gi, "RC"],
  [/\bR\.?S\.?\b/gi, "RS"],
  [/\bS\.?A\.?\b/gi, "SA"],
  [/\bC\.?A\.?\b/gi, "CA"],
  [/\bC\.?F\.?\b/gi, "CF"],
  [/\s+/g, " "],
];

export function normalizeTeamName(name: string): string {
  let normalized = name.trim();
  for (const [pattern, replacement] of NORMALIZATIONS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

export function getAliasVariants(name: string): string[] {
  const lower = name.toLowerCase();
  const variants = ALIASES[lower] || [];
  return [name, ...variants];
}

export async function findTeamByName(input: string): Promise<{ id: number } | null> {
  const normalized = normalizeTeamName(input);
  const variants = getAliasVariants(normalized);

  for (const variant of variants) {
    const team = await prisma.$queryRawUnsafe<{ id: number }[]>(
      `SELECT id FROM Team WHERE LOWER(name) = LOWER(?) OR LOWER(shortName) = LOWER(?) LIMIT 1`,
      variant, variant,
    );
    if (team.length > 0) return { id: team[0].id };
  }

  // Fallback: LIKE search
  const fuzzy = await prisma.team.findFirst({
    where: {
      name: { contains: normalized },
    },
    select: { id: true },
  });

  return fuzzy;
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export function similarityScore(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - dist / maxLen;
}
