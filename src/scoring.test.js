import assert from "node:assert/strict";
import test from "node:test";
import { calcPoints, maxPointsForResult } from "./scoring.js";

test("awards six points for an exact score and correct shootout winner", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 1, awayGoals: 1, penaltyWinner: "away" },
      { homeGoals: 1, awayGoals: 1, penaltyWinner: "away" },
    ),
    6,
  );
});

test("awards four points for an exact score but wrong shootout winner", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 1, awayGoals: 1, penaltyWinner: "home" },
      { homeGoals: 1, awayGoals: 1, penaltyWinner: "away" },
    ),
    4,
  );
});

test("awards three points for the correct goal difference", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 1, awayGoals: 2 },
      { homeGoals: 0, awayGoals: 1 },
    ),
    3,
  );
});

test("awards two points when the winner and one score are correct", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 3, awayGoals: 2 },
      { homeGoals: 3, awayGoals: 0 },
    ),
    2,
  );
});

test("awards one point for only the correct winner", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 0, awayGoals: 4 },
      { homeGoals: 1, awayGoals: 3 },
    ),
    1,
  );
});

test("awards zero points for the wrong outcome", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 3, awayGoals: 0 },
      { homeGoals: 1, awayGoals: 1 },
    ),
    0,
  );
});

test("awards three points for a non-exact draw", () => {
  const result = {
    homeGoals: 1,
    awayGoals: 1,
    penaltyWinner: "away",
  };
  assert.equal(
    calcPoints(
      { homeGoals: 2, awayGoals: 2, penaltyWinner: "away" },
      result,
    ),
    3,
  );
  assert.equal(
    calcPoints(
      { homeGoals: 2, awayGoals: 2, penaltyWinner: "home" },
      result,
    ),
    3,
  );
});

test("uses six as the maximum only for matches decided by shootout", () => {
  assert.equal(maxPointsForResult({ penaltyWinner: "home" }), 6);
  assert.equal(maxPointsForResult({ homeGoals: 2, awayGoals: 1 }), 5);
});
