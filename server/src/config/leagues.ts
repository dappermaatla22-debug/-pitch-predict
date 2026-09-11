export interface LeagueConfig {
  name: string;
  country: string;
  confederation: string;
  tier: number;
  slug: string;
  wikipediaPage: string;
  scraperType: "teamSeason" | "leagueMatrix" | "european";
  seasonPattern: string;
  teamArticleSeasonKey?: string;
  wikidataAliases?: string[];
  subpages?: string[];
}

export const LEAGUE_REGISTRY: LeagueConfig[] = [
  {
    name: "Premier League",
    country: "England",
    confederation: "UEFA",
    tier: 1,
    slug: "premier-league",
    wikipediaPage: "Premier League",
    scraperType: "leagueMatrix",
    seasonPattern: "{startYear}–{endYear}",
    teamArticleSeasonKey: "Premier League",
    wikidataAliases: ["Premier League"],
  },
  {
    name: "La Liga",
    country: "Spain",
    confederation: "UEFA",
    tier: 1,
    slug: "la-liga",
    wikipediaPage: "La Liga",
    scraperType: "leagueMatrix",
    seasonPattern: "{startYear}–{endYear}",
    teamArticleSeasonKey: "La Liga",
    wikidataAliases: ["La Liga", "Liga de Fútbol Profesional"],
  },
  {
    name: "Serie A",
    country: "Italy",
    confederation: "UEFA",
    tier: 1,
    slug: "serie-a",
    wikipediaPage: "Serie A",
    scraperType: "leagueMatrix",
    seasonPattern: "{startYear}–{endYear}",
    teamArticleSeasonKey: "Serie A",
    wikidataAliases: ["Serie A", "Lega Serie A"],
  },
  {
    name: "Bundesliga",
    country: "Germany",
    confederation: "UEFA",
    tier: 1,
    slug: "bundesliga",
    wikipediaPage: "Bundesliga",
    scraperType: "leagueMatrix",
    seasonPattern: "{startYear}–{endYear}",
    teamArticleSeasonKey: "Bundesliga",
    wikidataAliases: ["Bundesliga"],
  },
  {
    name: "Ligue 1",
    country: "France",
    confederation: "UEFA",
    tier: 1,
    slug: "ligue-1",
    wikipediaPage: "Ligue 1",
    scraperType: "leagueMatrix",
    seasonPattern: "{startYear}–{endYear}",
    teamArticleSeasonKey: "Ligue 1",
    wikidataAliases: ["Ligue 1", "Ligue 1 Uber Eats", "Ligue 1 McDonald's"],
  },
  {
    name: "Eredivisie",
    country: "Netherlands",
    confederation: "UEFA",
    tier: 2,
    slug: "eredivisie",
    wikipediaPage: "Eredivisie",
    scraperType: "leagueMatrix",
    seasonPattern: "{startYear}–{endYear}",
    teamArticleSeasonKey: "Eredivisie",
    wikidataAliases: ["Eredivisie"],
  },
  {
    name: "Primeira Liga",
    country: "Portugal",
    confederation: "UEFA",
    tier: 2,
    slug: "primeira-liga",
    wikipediaPage: "Primeira Liga",
    scraperType: "leagueMatrix",
    seasonPattern: "{startYear}–{endYear}",
    teamArticleSeasonKey: "Primeira Liga",
    wikidataAliases: ["Liga Portugal", "Primeira Liga", "Liga NOS", "Liga Portugal Bwin", "Liga Portugal Placard"],
  },
  {
    name: "Scottish Premiership",
    country: "Scotland",
    confederation: "UEFA",
    tier: 2,
    slug: "scottish-premiership",
    wikipediaPage: "Scottish Premiership",
    scraperType: "leagueMatrix",
    seasonPattern: "{startYear}–{endYear}",
    teamArticleSeasonKey: "Scottish Premiership",
    wikidataAliases: ["Scottish Premiership", "Scottish Professional Football League"],
  },
  {
    name: "UEFA Champions League",
    country: "Europe",
    confederation: "UEFA",
    tier: 1,
    slug: "champions-league",
    wikipediaPage: "UEFA Champions League",
    scraperType: "european",
    seasonPattern: "{startYear}–{endYear}",
    subpages: ["league phase", "knockout phase"],
  },
  {
    name: "UEFA Europa League",
    country: "Europe",
    confederation: "UEFA",
    tier: 2,
    slug: "europa-league",
    wikipediaPage: "UEFA Europa League",
    scraperType: "european",
    seasonPattern: "{startYear}–{endYear}",
    subpages: ["league phase", "knockout phase"],
  },
];
