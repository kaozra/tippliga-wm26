export function resolveBracketMatch(
  match,
  results,
  matches,
  isKnownTeam,
  resolving = new Set(),
) {
  const result = results[match.id] || {};
  const nextResolving = new Set(resolving);
  nextResolving.add(match.id);

  function hasScore(candidate) {
    return candidate?.homeGoals != null && candidate?.awayGoals != null;
  }

  function resolveSlot(slot) {
    if (isKnownTeam(slot)) return slot;
    const reference = /^(Sieger|Verlierer) (.+)$/.exec(slot || "");
    if (!reference) return slot;
    const [, mode, sourceId] = reference;
    if (nextResolving.has(sourceId)) return slot;
    const sourceMatch = matches.find((candidate) => candidate.id === sourceId);
    const sourceResult = results[sourceId];
    if (!sourceMatch || !hasScore(sourceResult) || sourceResult.status === "LIVE") {
      return slot;
    }
    const source = resolveBracketMatch(
      sourceMatch,
      results,
      matches,
      isKnownTeam,
      nextResolving,
    );
    const draw = sourceResult.homeGoals === sourceResult.awayGoals;
    const homeWon =
      sourceResult.homeGoals > sourceResult.awayGoals ||
      (draw && sourceResult.penaltyWinner === "home");
    const awayWon =
      sourceResult.awayGoals > sourceResult.homeGoals ||
      (draw && sourceResult.penaltyWinner === "away");
    if (!homeWon && !awayWon) return slot;
    if (mode === "Sieger") return homeWon ? source.home : source.away;
    return homeWon ? source.away : source.home;
  }

  const apiHome = isKnownTeam(result.koHome) ? result.koHome : null;
  const apiAway = isKnownTeam(result.koAway) ? result.koAway : null;
  return {
    ...match,
    home: apiHome || resolveSlot(match.home),
    away: apiAway || resolveSlot(match.away),
    date: result.koDate || match.date,
    time: result.koTime || match.time,
  };
}
