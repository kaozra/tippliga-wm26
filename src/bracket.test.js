import assert from "node:assert/strict";
import test from "node:test";
import { resolveBracketMatch } from "./bracket.js";

const matches = [
  { id: "R32_7", home: "Mexiko", away: "Ecuador", date: "01.07.2026", time: "03:00" },
  { id: "R32_8", home: "England", away: "DR Kongo", date: "01.07.2026", time: "18:00" },
  { id: "R16_4", home: "Sieger R32_7", away: "Sieger R32_8", date: "06.07.2026", time: "02:00" },
];
const knownTeams = new Set(["Mexiko", "Ecuador", "England", "DR Kongo"]);
const isKnownTeam = (team) => knownTeams.has(team);

test("replaces a stale API placeholder with the known previous-round winner", () => {
  const results = {
    R32_7: { homeGoals: 2, awayGoals: 0, status: "FT" },
    R16_4: { koHome: "MEX/ECU", koAway: "ENG/COD", status: "SCHEDULED" },
  };
  const resolved = resolveBracketMatch(
    matches[2],
    results,
    matches,
    isKnownTeam,
  );
  assert.equal(resolved.home, "Mexiko");
  assert.equal(resolved.away, "Sieger R32_8");
});

test("propagates a penalty shootout winner", () => {
  const results = {
    R32_7: {
      homeGoals: 1,
      awayGoals: 1,
      penaltyWinner: "away",
      status: "FT",
    },
  };
  const resolved = resolveBracketMatch(
    matches[2],
    results,
    matches,
    isKnownTeam,
  );
  assert.equal(resolved.home, "Ecuador");
});
