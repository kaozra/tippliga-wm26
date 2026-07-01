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
    return tip.penaltyWinner === result.penaltyWinner ? 5 : 3;
  }

  const tipDifference = tipHome - tipAway;
  const resultDifference = resultHome - resultAway;
  const correctOutcome =
    Math.sign(tipDifference) === Math.sign(resultDifference);
  if (!correctOutcome) return 0;

  // For a non-exact shootout prediction, the selected shootout winner
  // differentiates a strong prediction from merely predicting the draw.
  if (result.penaltyWinner) {
    return tip.penaltyWinner === result.penaltyWinner ? 3 : 1;
  }

  const correctDifference = tipDifference === resultDifference;
  const oneScoreExact =
    tipHome === resultHome || tipAway === resultAway;
  if (correctDifference || oneScoreExact) return 3;

  return 1;
}
