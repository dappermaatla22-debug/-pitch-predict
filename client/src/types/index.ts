export interface League {
  id: number;
  wikidataId: string | null;
  name: string;
  country: string;
  confederation: string;
  tier: number;
  slug: string;
  logoUrl: string | null;
  wikipediaPage: string | null;
  scraperType: string;
  active: boolean;
  _count?: { teams: number; fixtures: number };
}

export interface Team {
  id: number;
  wikidataId: string | null;
  name: string;
  shortName: string | null;
  slug: string;
  country: string;
  logoUrl: string | null;
  founded: number | null;
  leagueId: number | null;
  wikipediaName: string | null;
  attackRating: number;
  defenseRating: number;
  homeAdvantage: number;
  league?: League;
}

export interface Season {
  id: number;
  leagueId: number;
  name: string;
  startYear: number;
  endYear: number;
  wikipediaPage: string | null;
  lastScraped: string | null;
  fixtureCount: number;
  resultCount: number;
}

export interface Fixture {
  id: number;
  seasonId: number;
  leagueId: number;
  homeTeamId: number;
  awayTeamId: number;
  matchday: number | null;
  date: string;
  time: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  venue: string | null;
  attendance: number | null;
  referee: string | null;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  predictions: Prediction[];
  season?: Season;
}

export interface Prediction {
  id: number;
  fixtureId: number;
  market: string;
  probabilities: Record<string, number>;
  topPick: string;
  confidence: number;
  modelVersion: string | null;
  createdAt: string;
  fixture?: Fixture;
}

export interface PredictionResult {
  id: number;
  predictionId: number;
  actualOutcome: string;
  wasCorrect: boolean;
  checkedAt: string;
}
