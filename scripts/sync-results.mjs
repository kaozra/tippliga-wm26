import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { pathToFileURL } from "node:url";

export const LEAGUE = "wm26";
export const SEASON = "2026";
export const MAX_MATCH_DURATION_MS = 4 * 60 * 60 * 1000;

export class OpenLigaDbUnavailableError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "OpenLigaDbUnavailableError";
  }
}

const TEAM_FIX = {
  "Bosnien und Herzegowina": "Bosnien-Herzegowina",
  "Saudi Arabien": "Saudi-Arabien",
};

export const fixTeam = (team) => TEAM_FIX[team] || team || "";

// The group-stage IDs are stable in the app. Knockout IDs are assigned below
// from each OpenLigaDB round in chronological order.
const GROUP_MATCHES = [
  { id: "A1", home: "Mexiko", away: "Südafrika" },
  { id: "A2", home: "Südkorea", away: "Tschechien" },
  { id: "A3", home: "Tschechien", away: "Südafrika" },
  { id: "A4", home: "Mexiko", away: "Südkorea" },
  { id: "A5", home: "Tschechien", away: "Mexiko" },
  { id: "A6", home: "Südafrika", away: "Südkorea" },
  { id: "B1", home: "Kanada", away: "Bosnien-Herzegowina" },
  { id: "B2", home: "Katar", away: "Schweiz" },
  { id: "B3", home: "Schweiz", away: "Bosnien-Herzegowina" },
  { id: "B4", home: "Kanada", away: "Katar" },
  { id: "B5", home: "Schweiz", away: "Kanada" },
  { id: "B6", home: "Bosnien-Herzegowina", away: "Katar" },
  { id: "C1", home: "Brasilien", away: "Marokko" },
  { id: "C2", home: "Haiti", away: "Schottland" },
  { id: "C3", home: "Schottland", away: "Marokko" },
  { id: "C4", home: "Brasilien", away: "Haiti" },
  { id: "C5", home: "Schottland", away: "Brasilien" },
  { id: "C6", home: "Marokko", away: "Haiti" },
  { id: "D1", home: "USA", away: "Paraguay" },
  { id: "D2", home: "Australien", away: "Türkei" },
  { id: "D3", home: "USA", away: "Australien" },
  { id: "D4", home: "Türkei", away: "Paraguay" },
  { id: "D5", home: "Türkei", away: "USA" },
  { id: "D6", home: "Paraguay", away: "Australien" },
  { id: "E1", home: "Deutschland", away: "Curaçao" },
  { id: "E2", home: "Elfenbeinküste", away: "Ecuador" },
  { id: "E3", home: "Deutschland", away: "Elfenbeinküste" },
  { id: "E4", home: "Ecuador", away: "Curaçao" },
  { id: "E5", home: "Ecuador", away: "Deutschland" },
  { id: "E6", home: "Curaçao", away: "Elfenbeinküste" },
  { id: "F1", home: "Niederlande", away: "Japan" },
  { id: "F2", home: "Schweden", away: "Tunesien" },
  { id: "F3", home: "Niederlande", away: "Schweden" },
  { id: "F4", home: "Tunesien", away: "Japan" },
  { id: "F5", home: "Japan", away: "Schweden" },
  { id: "F6", home: "Tunesien", away: "Niederlande" },
  { id: "G1", home: "Belgien", away: "Ägypten" },
  { id: "G2", home: "Iran", away: "Neuseeland" },
  { id: "G3", home: "Belgien", away: "Iran" },
  { id: "G4", home: "Neuseeland", away: "Ägypten" },
  { id: "G5", home: "Ägypten", away: "Iran" },
  { id: "G6", home: "Neuseeland", away: "Belgien" },
  { id: "H1", home: "Spanien", away: "Kap Verde" },
  { id: "H2", home: "Saudi-Arabien", away: "Uruguay" },
  { id: "H3", home: "Spanien", away: "Saudi-Arabien" },
  { id: "H4", home: "Uruguay", away: "Kap Verde" },
  { id: "H5", home: "Kap Verde", away: "Saudi-Arabien" },
  { id: "H6", home: "Uruguay", away: "Spanien" },
  { id: "I1", home: "Frankreich", away: "Senegal" },
  { id: "I2", home: "Irak", away: "Norwegen" },
  { id: "I3", home: "Frankreich", away: "Irak" },
  { id: "I4", home: "Norwegen", away: "Senegal" },
  { id: "I5", home: "Norwegen", away: "Frankreich" },
  { id: "I6", home: "Senegal", away: "Irak" },
  { id: "J1", home: "Argentinien", away: "Algerien" },
  { id: "J2", home: "Österreich", away: "Jordanien" },
  { id: "J3", home: "Argentinien", away: "Österreich" },
  { id: "J4", home: "Jordanien", away: "Algerien" },
  { id: "J5", home: "Algerien", away: "Österreich" },
  { id: "J6", home: "Jordanien", away: "Argentinien" },
  { id: "K1", home: "Portugal", away: "DR Kongo" },
  { id: "K2", home: "Usbekistan", away: "Kolumbien" },
  { id: "K3", home: "Portugal", away: "Usbekistan" },
  { id: "K4", home: "Kolumbien", away: "DR Kongo" },
  { id: "K5", home: "Kolumbien", away: "Portugal" },
  { id: "K6", home: "DR Kongo", away: "Usbekistan" },
  { id: "L1", home: "England", away: "Kroatien" },
  { id: "L2", home: "Ghana", away: "Panama" },
  { id: "L3", home: "England", away: "Ghana" },
  { id: "L4", home: "Panama", away: "Kroatien" },
  { id: "L5", home: "Panama", away: "England" },
  { id: "L6", home: "Kroatien", away: "Ghana" },
];

const KNOWN_TEAMS = new Set(
  GROUP_MATCHES.flatMap((match) => [match.home, match.away]),
);

const ROUND_CONFIG = {
  4: { round: "R32", id: (index) => `R32_${index + 1}` },
  5: { round: "R16", id: (index) => `R16_${index + 1}` },
  6: { round: "QF", id: (index) => `QF${index + 1}` },
  7: { round: "SF", id: (index) => `SF${index + 1}` },
  8: { round: "P3", id: () => "P3" },
  9: { round: "FIN", id: () => "FIN" },
};

const GROUP_LOOKUP = new Map();
for (const match of GROUP_MATCHES) {
  GROUP_LOOKUP.set(`${match.home}|${match.away}`, {
    matchId: match.id,
    swap: false,
    round: match.id[0],
  });
  GROUP_LOOKUP.set(`${match.away}|${match.home}`, {
    matchId: match.id,
    swap: true,
    round: match.id[0],
  });
}

function apiTime(match) {
  return new Date(match.matchDateTimeUTC || match.matchDateTime || 0).getTime();
}

export function buildMatchMap(apiMatches) {
  const mapping = new Map();
  const knockoutRounds = new Map();

  for (const match of apiMatches) {
    const groupOrder = Number(match.group?.groupOrderID);
    if (ROUND_CONFIG[groupOrder]) {
      if (!knockoutRounds.has(groupOrder)) knockoutRounds.set(groupOrder, []);
      knockoutRounds.get(groupOrder).push(match);
      continue;
    }

    const home = fixTeam(match.team1?.teamName);
    const away = fixTeam(match.team2?.teamName);
    const groupMatch = GROUP_LOOKUP.get(`${home}|${away}`);
    if (groupMatch) mapping.set(match.matchID, groupMatch);
  }

  for (const [groupOrder, matches] of knockoutRounds) {
    const config = ROUND_CONFIG[groupOrder];
    matches.sort((a, b) => apiTime(a) - apiTime(b));
    matches.forEach((match, index) => {
      mapping.set(match.matchID, {
        matchId: config.id(index),
        swap: false,
        round: config.round,
      });
    });
  }

  return mapping;
}

function resultOfType(match, type) {
  return (match.matchResults || []).find(
    (result) => Number(result.resultTypeID) === type,
  );
}

function latestResult(match) {
  return [...(match.matchResults || [])].sort(
    (a, b) => Number(b.resultOrderID || 0) - Number(a.resultOrderID || 0),
  )[0];
}

function scoreOf(result, swap) {
  if (!result || result.pointsTeam1 == null || result.pointsTeam2 == null)
    return null;
  return swap
    ? { homeGoals: result.pointsTeam2, awayGoals: result.pointsTeam1 }
    : { homeGoals: result.pointsTeam1, awayGoals: result.pointsTeam2 };
}

function lastGoalScore(match, swap) {
  const goal = [...(match.goals || [])]
    .filter((item) => item.scoreTeam1 != null && item.scoreTeam2 != null)
    .sort((a, b) => Number(b.matchMinute || 0) - Number(a.matchMinute || 0))[0];
  if (!goal) return null;
  return swap
    ? { homeGoals: goal.scoreTeam2, awayGoals: goal.scoreTeam1 }
    : { homeGoals: goal.scoreTeam1, awayGoals: goal.scoreTeam2 };
}

export function extractMatchState(match, swap = false, now = Date.now()) {
  const official = resultOfType(match, 2);
  const extraTime = resultOfType(match, 4);
  const shootout = resultOfType(match, 5);
  const latest = latestResult(match);
  const kickoff = apiTime(match);
  const started = Number.isFinite(kickoff) && now >= kickoff;
  const hasResultEvidence =
    (match.goals || []).length > 0 || (match.matchResults || []).length > 0;
  const timedOut =
    started &&
    hasResultEvidence &&
    now >= kickoff + MAX_MATCH_DURATION_MS;
  const finished = Boolean(match.matchIsFinished || timedOut);

  let score = null;
  if (match.matchIsFinished) {
    // The app stores the football score before penalties and the shootout
    // winner separately. Prefer the cumulative goal score because OpenLigaDB
    // can expose a non-cumulative or stale extra-time result.
    score =
      lastGoalScore(match, swap) ||
      scoreOf(extraTime || official || latest, swap);
  } else if (timedOut) {
    // OpenLigaDB occasionally leaves matchIsFinished=false long after a game.
    // The cumulative goal score is safer here than a stale period result.
    score =
      lastGoalScore(match, swap) ||
      scoreOf(extraTime || official || latest, swap);
  } else if (started) {
    score = lastGoalScore(match, swap) || scoreOf(latest, swap) || {
      homeGoals: 0,
      awayGoals: 0,
    };
  }

  const penaltyScore = scoreOf(shootout, swap);
  let penaltyWinner = null;
  if (penaltyScore && penaltyScore.homeGoals !== penaltyScore.awayGoals) {
    penaltyWinner =
      penaltyScore.homeGoals > penaltyScore.awayGoals ? "home" : "away";
  }

  return {
    ...(score || {}),
    status: finished ? "FT" : started ? "LIVE" : "SCHEDULED",
    penaltyWinner,
    penaltyHomeGoals: penaltyScore?.homeGoals ?? null,
    penaltyAwayGoals: penaltyScore?.awayGoals ?? null,
  };
}

export function goalEvents(match) {
  const team1 = fixTeam(match.team1?.teamName);
  const team2 = fixTeam(match.team2?.teamName);
  const goals = [...(match.goals || [])].sort(
    (a, b) => Number(a.matchMinute || 0) - Number(b.matchMinute || 0),
  );
  let score1 = 0;
  let score2 = 0;

  return goals.map((goal) => {
    const team1Delta = Number(goal.scoreTeam1 ?? score1) - score1;
    score1 = Number(goal.scoreTeam1 ?? score1);
    score2 = Number(goal.scoreTeam2 ?? score2);
    const scoringTeam = team1Delta > 0 ? team1 : team2;
    const playerTeam = goal.isOwnGoal
      ? scoringTeam === team1
        ? team2
        : team1
      : scoringTeam;

    return {
      time: Number(goal.matchMinute || 0),
      extra: goal.matchMinuteExtraTime ?? null,
      type: "Goal",
      detail: goal.isOwnGoal
        ? "Own Goal"
        : goal.isPenalty
          ? "Penalty"
          : "Normal Goal",
      player: (goal.goalGetterName || "").trim() || "—",
      assist: goal.goalGetterAssistName?.trim() || null,
      teamName: playerTeam,
      scoringTeam,
    };
  });
}

export function getEventsVersion(events) {
  const payload = JSON.stringify(events);
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${events.length}-${(hash >>> 0).toString(36)}`;
}

function apiDateParts(match) {
  const [date = "", timeWithSeconds = ""] = String(
    match.matchDateTime || "",
  ).split("T");
  const [year, month, day] = date.split("-");
  return {
    date: year && month && day ? `${day}.${month}.${year}` : null,
    time: timeWithSeconds ? timeWithSeconds.slice(0, 5) : null,
  };
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function meaningfulChanges(existing, patch) {
  return Object.entries(patch).some(
    ([key, value]) => !sameValue(existing?.[key], value),
  );
}

export async function fetchMatches({ fetchImpl = fetch } = {}) {
  const url = `https://api.openligadb.de/getmatchdata/${LEAGUE}/${SEASON}`;
  try {
    const response = await fetchImpl(url, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      throw new OpenLigaDbUnavailableError(
        `OpenLigaDB returned HTTP ${response.status}`,
      );
    }
    const matches = await response.json();
    if (!Array.isArray(matches)) {
      throw new OpenLigaDbUnavailableError(
        "OpenLigaDB returned an invalid response",
      );
    }
    return matches;
  } catch (error) {
    if (error instanceof OpenLigaDbUnavailableError) throw error;
    throw new OpenLigaDbUnavailableError(
      `OpenLigaDB request failed: ${error.message || error}`,
      { cause: error },
    );
  }
}

function initializeFirebase() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT secret is not configured");
  }
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  }
  return getFirestore();
}

export async function sync({ db = initializeFirebase(), matches } = {}) {
  const apiMatches = matches || (await fetchMatches());
  const mapping = buildMatchMap(apiMatches);
  const [resultSnapshot, eventSnapshot] = await Promise.all([
    db.collection("results").get(),
    db.collection("events").get(),
  ]);
  const existingResults = new Map(
    resultSnapshot.docs.map((document) => [document.id, document.data()]),
  );
  const existingEvents = new Map(
    eventSnapshot.docs.map((document) => [document.id, document.data()]),
  );

  const batch = db.batch();
  let resultWrites = 0;
  let eventWrites = 0;
  let skipped = 0;

  for (const apiMatch of apiMatches) {
    const mapped = mapping.get(apiMatch.matchID);
    if (!mapped) {
      skipped += 1;
      continue;
    }

    const { matchId, swap, round } = mapped;
    const existing = existingResults.get(matchId) || {};
    const state = extractMatchState(apiMatch, swap);
    const home = fixTeam(apiMatch.team1?.teamName);
    const away = fixTeam(apiMatch.team2?.teamName);
    const { date, time } = apiDateParts(apiMatch);
    const patch = {
      matchId,
      source: "openligadb",
      sourceMatchId: apiMatch.matchID,
      status: state.status,
    };

    if (state.homeGoals != null && state.awayGoals != null) {
      patch.homeGoals = state.homeGoals;
      patch.awayGoals = state.awayGoals;
    }
    if (state.penaltyWinner) {
      patch.penaltyWinner = state.penaltyWinner;
      patch.penaltyHomeGoals = state.penaltyHomeGoals;
      patch.penaltyAwayGoals = state.penaltyAwayGoals;
    }
    if (ROUND_CONFIG[Number(apiMatch.group?.groupOrderID)]) {
      if (KNOWN_TEAMS.has(home)) patch.koHome = home;
      if (KNOWN_TEAMS.has(away)) patch.koAway = away;
      if (date) patch.koDate = date;
      if (time) patch.koTime = time;
      patch.koRound = round;
    }

    const events = goalEvents(apiMatch);
    if (events.length > 0) patch.eventsVersion = getEventsVersion(events);

    const resultChanged = meaningfulChanges(existing, patch);

    if (resultChanged) {
      batch.set(
        db.collection("results").doc(matchId),
        { ...patch, updatedAt: FieldValue.serverTimestamp() },
        { merge: true },
      );
      resultWrites += 1;
    }

    const existingEventList = existingEvents.get(matchId)?.events || [];
    if (events.length > 0 && !sameValue(existingEventList, events)) {
      batch.set(
        db.collection("events").doc(matchId),
        {
          matchId,
          events,
          source: "openligadb",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      eventWrites += 1;
    }
  }

  if (resultWrites + eventWrites > 0) await batch.commit();
  return {
    apiMatches: apiMatches.length,
    mapped: mapping.size,
    resultWrites,
    eventWrites,
    skipped,
  };
}

export async function main() {
  try {
    const summary = await sync();
    console.log(`[sync] ${JSON.stringify(summary)}`);
  } catch (error) {
    const message = String(error.message || error)
      .replaceAll("%", "%25")
      .replaceAll("\r", "%0D")
      .replaceAll("\n", "%0A");
    if (error instanceof OpenLigaDbUnavailableError) {
      console.warn(`::warning title=OpenLigaDB temporarily unavailable::${message}`);
      console.warn(`[sync] skipped: ${error.message}`);
      return;
    }
    console.error(`::error title=WM 2026 result sync failed::${message}`);
    throw error;
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((error) => {
    console.error(`[sync] ${error.stack || error.message || error}`);
    process.exitCode = 1;
  });
}
