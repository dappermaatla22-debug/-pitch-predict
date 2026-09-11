export interface TeamFixture {
  round: number | null;
  date: string;
  time: string | null;
  homeTeam: string;
  awayTeam: string;
  score: string | null;
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
  attendance: number | null;
  referee: string | null;
  result: string | null;
}

export interface LeagueResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamRating {
  teamId: number;
  attackRating: number;
  defenseRating: number;
  homeAdvantage: number;
}

export interface MatchProbabilities {
  home: number;
  draw: number;
  away: number;
}

export interface GoalDistribution {
  homeGoals: number;
  awayGoals: number;
  probability: number;
}
