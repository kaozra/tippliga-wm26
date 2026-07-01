export function hasMatchScore(result) {
  return result?.homeGoals != null && result?.awayGoals != null;
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
    return tip.penaltyWinner === result.penaltyWinner ? 5 : 4;
  }

  const tipDifference = tipHome - tipAway;
  const resultDifference = resultHome - resultAway;
  const correctOutcome =
    Math.sign(tipDifference) === Math.sign(resultDifference);
  if (!correctOutcome) return 0;

  // A non-exact draw already has the correct goal difference. Selecting the
  // correct shootout winner raises it by one tier.
  if (result.penaltyWinner) {
    return tip.penaltyWinner === result.penaltyWinner ? 4 : 3;
  }

  const correctDifference = tipDifference === resultDifference;
  const oneScoreExact =
    tipHome === resultHome || tipAway === resultAway;
  if (correctDifference) return 3;
  if (oneScoreExact) return 2;

  return 1;
}
