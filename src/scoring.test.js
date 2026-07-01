import assert from "node:assert/strict";
import test from "node:test";
import { calcPoints } from "./scoring.js";

test("awards five points for an exact score and correct shootout winner", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 1, awayGoals: 1, penaltyWinner: "away" },
      { homeGoals: 1, awayGoals: 1, penaltyWinner: "away" },
    ),
    5,
  );
});

test("awards three points for an exact score but wrong shootout winner", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 1, awayGoals: 1, penaltyWinner: "home" },
      { homeGoals: 1, awayGoals: 1, penaltyWinner: "away" },
    ),
    3,
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

test("keeps three points when one score and the outcome are correct", () => {
  assert.equal(
    calcPoints(
      { homeGoals: 0, awayGoals: 2 },
      { homeGoals: 1, awayGoals: 2 },
    ),
    3,
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

test("uses the shootout winner only for non-exact draw predictions", () => {
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
    1,
  );
});
