import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMatchMap,
  extractMatchState,
  fixTeam,
  goalEvents,
  sync,
} from "./sync-results.mjs";

function apiMatch(overrides = {}) {
  return {
    matchID: 1,
    matchDateTime: "2026-06-28T21:00:00",
    matchDateTimeUTC: "2026-06-28T19:00:00Z",
    matchIsFinished: false,
    matchResults: [],
    goals: [],
    group: { groupOrderID: 4 },
    team1: { teamName: "Südafrika" },
    team2: { teamName: "Kanada" },
    ...overrides,
  };
}

test("normalizes team names used by the app", () => {
  assert.equal(fixTeam("Bosnien und Herzegowina"), "Bosnien-Herzegowina");
  assert.equal(fixTeam("Saudi Arabien"), "Saudi-Arabien");
});

test("maps group matches by teams and knockout matches by round order", () => {
  const group = apiMatch({
    matchID: 10,
    group: { groupOrderID: 1 },
    team1: { teamName: "Südafrika" },
    team2: { teamName: "Mexiko" },
  });
  const laterR16 = apiMatch({
    matchID: 12,
    group: { groupOrderID: 5 },
    matchDateTimeUTC: "2026-07-05T01:00:00Z",
  });
  const earlierR16 = apiMatch({
    matchID: 11,
    group: { groupOrderID: 5 },
    matchDateTimeUTC: "2026-07-04T19:00:00Z",
  });

  const mapping = buildMatchMap([group, laterR16, earlierR16]);
  assert.deepEqual(mapping.get(10), {
    matchId: "A1",
    swap: true,
    round: "A",
  });
  assert.equal(mapping.get(11).matchId, "R16_1");
  assert.equal(mapping.get(12).matchId, "R16_2");
});

test("uses the current goal score while a match is live", () => {
  const match = apiMatch({
    goals: [
      { matchMinute: 12, scoreTeam1: 1, scoreTeam2: 0 },
      { matchMinute: 44, scoreTeam1: 1, scoreTeam2: 1 },
    ],
  });
  const state = extractMatchState(match, false, Date.parse("2026-06-28T20:00:00Z"));
  assert.deepEqual(
    { homeGoals: state.homeGoals, awayGoals: state.awayGoals, status: state.status },
    { homeGoals: 1, awayGoals: 1, status: "LIVE" },
  );
});

test("stores the football score before penalties and the shootout winner separately", () => {
  const match = apiMatch({
    matchIsFinished: true,
    matchResults: [
      { resultTypeID: 2, resultOrderID: 2, pointsTeam1: 1, pointsTeam2: 1 },
      { resultTypeID: 4, resultOrderID: 3, pointsTeam1: 2, pointsTeam2: 2 },
      { resultTypeID: 5, resultOrderID: 4, pointsTeam1: 5, pointsTeam2: 4 },
    ],
  });
  const state = extractMatchState(match);
  assert.deepEqual(state, {
    homeGoals: 2,
    awayGoals: 2,
    status: "FT",
    penaltyWinner: "home",
    penaltyHomeGoals: 5,
    penaltyAwayGoals: 4,
  });
});

test("keeps penalty winner orientation when a group fixture is reversed", () => {
  const match = apiMatch({
    matchIsFinished: true,
    matchResults: [
      { resultTypeID: 2, resultOrderID: 2, pointsTeam1: 1, pointsTeam2: 1 },
      { resultTypeID: 5, resultOrderID: 4, pointsTeam1: 3, pointsTeam2: 4 },
    ],
  });
  const state = extractMatchState(match, true);
  assert.equal(state.penaltyWinner, "home");
  assert.equal(state.penaltyHomeGoals, 4);
  assert.equal(state.penaltyAwayGoals, 3);
});

test("preserves goal metadata for live and completed match views", () => {
  const events = goalEvents(
    apiMatch({
      goals: [
        {
          matchMinute: 18,
          matchMinuteExtraTime: 1,
          scoreTeam1: 1,
          scoreTeam2: 0,
          goalGetterName: "Example Player",
          goalGetterAssistName: "Example Assist",
          isPenalty: false,
          isOwnGoal: false,
        },
      ],
    }),
  );
  assert.deepEqual(events[0], {
    time: 18,
    extra: 1,
    type: "Goal",
    detail: "Normal Goal",
    player: "Example Player",
    assist: "Example Assist",
    teamName: "Südafrika",
    scoringTeam: "Südafrika",
  });
});

function fakeFirestore(existingResults = {}, existingEvents = {}) {
  const writes = [];
  const collections = {
    results: existingResults,
    events: existingEvents,
  };
  const db = {
    collection(name) {
      return {
        async get() {
          return {
            docs: Object.entries(collections[name] || {}).map(([id, data]) => ({
              id,
              data: () => data,
            })),
          };
        },
        doc(id) {
          return { id, path: `${name}/${id}` };
        },
      };
    },
    batch() {
      return {
        set(reference, data, options) {
          writes.push({ reference, data, options });
        },
        async commit() {},
      };
    },
  };
  return { db, writes };
}

test("sync writes knockout metadata, final score, penalties and events atomically", async () => {
  const match = apiMatch({
    matchIsFinished: true,
    matchResults: [
      { resultTypeID: 2, resultOrderID: 2, pointsTeam1: 1, pointsTeam2: 1 },
      { resultTypeID: 5, resultOrderID: 4, pointsTeam1: 4, pointsTeam2: 3 },
    ],
    goals: [
      {
        matchMinute: 27,
        scoreTeam1: 1,
        scoreTeam2: 0,
        goalGetterName: "Example Player",
      },
      {
        matchMinute: 73,
        scoreTeam1: 1,
        scoreTeam2: 1,
        goalGetterName: "Other Player",
      },
    ],
  });
  const { db, writes } = fakeFirestore();
  const summary = await sync({ db, matches: [match] });

  assert.equal(summary.mapped, 1);
  assert.equal(summary.resultWrites, 1);
  assert.equal(summary.eventWrites, 1);
  assert.equal(writes.length, 2);

  const resultWrite = writes.find(
    (write) => write.reference.path === "results/R32_1",
  );
  assert.equal(resultWrite.data.homeGoals, 1);
  assert.equal(resultWrite.data.awayGoals, 1);
  assert.equal(resultWrite.data.penaltyWinner, "home");
  assert.equal(resultWrite.data.koHome, "Südafrika");
  assert.equal(resultWrite.data.koAway, "Kanada");
  assert.match(resultWrite.data.eventsVersion, /^2-/);

  const eventWrite = writes.find(
    (write) => write.reference.path === "events/R32_1",
  );
  assert.equal(eventWrite.data.events.length, 2);
});
