const BASE = import.meta.env.VITE_API_URL || "/api";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  leagues: {
    list: () => fetchJSON<import("../types/index.js").League[]>("/leagues"),
    get: (slug: string) =>
      fetchJSON<import("../types/index.js").League>(`/leagues/${slug}`),
  },
  fixtures: {
    list: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return fetchJSON<
        | import("../types/index.js").Fixture[]
        | { fixtures: import("../types/index.js").Fixture[]; total: number }
      >(`/fixtures${qs}`);
    },
    get: (id: number) =>
      fetchJSON<import("../types/index.js").Fixture>(`/fixtures/${id}`),
  },
  teams: {
    search: (q: string) =>
      fetchJSON<import("../types/index.js").Team[]>(
        `/teams/search?q=${encodeURIComponent(q)}`,
      ),
    get: (id: number) =>
      fetchJSON<import("../types/index.js").Team>(`/teams/${id}`),
    form: (id: number, limit?: number) =>
      fetchJSON<import("../types/index.js").Fixture[]>(
        `/teams/${id}/form${limit ? `?limit=${limit}` : ""}`,
      ),
    fixtures: (id: number) =>
      fetchJSON<import("../types/index.js").Fixture[]>(
        `/teams/${id}/fixtures`,
      ),
    h2h: (id: number, opponentId: number) =>
      fetchJSON<import("../types/index.js").Fixture[]>(
        `/teams/${id}/h2h/${opponentId}`,
      ),
  },
  predictions: {
    top: (params?: Record<string, string>) => {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return fetchJSON<import("../types/index.js").Prediction[]>(
        `/predictions/top${qs}`,
      );
    },
    byFixture: (fixtureId: number) =>
      fetchJSON<import("../types/index.js").Prediction[]>(
        `/predictions/fixture/${fixtureId}`,
      ),
    performance: () =>
      fetchJSON<{
        overall: { wasCorrect: boolean; _count: number }[];
        byMarket: { market: string; _count: number }[];
      }>("/predictions/performance"),
  },
};
