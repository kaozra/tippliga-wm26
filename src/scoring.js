export function hasMatchScore(result) {
  return (
    result?.homeGoals != null &&
    result?.awayGoals != null &&
    result?.status !== "LIVE"
  );
}

export function calcPoints(tip, result) {
  if (!tip || !hasMatchScore(result)) return null;

  const tipHome = Number(tip.homeGoals);
  const tipAway = Number(tip.awayGoals);
  const resultHome = Number(result.homeGoals);
  const resultAway = Number(result.awayGoals);

  const exact = tipHome === resultHome && tipAway === resultAway;
  if (exact) {
    if (!result.penaltyWinner) return 5;
    return tip.penaltyWinner === result.penaltyWinner ? 6 : 4;
  }

  const tipDifference = tipHome - tipAway;
  const resultDifference = resultHome - resultAway;
  const correctOutcome =
    Math.sign(tipDifference) === Math.sign(resultDifference);
  if (!correctOutcome) return 0;

  // A non-exact draw is scored as an exact goal difference. The extra
  // shootout point is reserved for an otherwise exact prediction.
  if (result.penaltyWinner) {
    return 3;
  }

  const correctDifference = tipDifference === resultDifference;
  const oneScoreExact =
    tipHome === resultHome || tipAway === resultAway;
  if (correctDifference) return 3;
  if (oneScoreExact) return 2;

  return 1;
}

export function maxPointsForResult(result) {
  return result?.penaltyWinner ? 6 : 5;
}
