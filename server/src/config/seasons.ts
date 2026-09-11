export function getCurrentSeasonYears(): {
  startYear: number;
  endYear: number;
} {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month >= 7) {
    return { startYear: year, endYear: year + 1 };
  } else {
    return { startYear: year - 1, endYear: year };
  }
}

export function formatSeasonName(
  startYear: number,
  endYear: number,
): string {
  return `${startYear}–${endYear}`;
}

export function formatSeasonPageTitle(
  startYear: number,
  endYear: number,
  leaguePage: string,
): string {
  return `${startYear}–${endYear} ${leaguePage}`;
}
