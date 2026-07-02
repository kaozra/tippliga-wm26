export const FIFA_RESULTS_URL =
  "https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=285023&language=en&count=500";

const FIFA_CODE_TO_TEAM = {
  MEX: "Mexiko",
  RSA: "Südafrika",
  KOR: "Südkorea",
  CZE: "Tschechien",
  CAN: "Kanada",
  BIH: "Bosnien-Herzegowina",
  QAT: "Katar",
  SUI: "Schweiz",
  BRA: "Brasilien",
  MAR: "Marokko",
  HAI: "Haiti",
  SCO: "Schottland",
  USA: "USA",
  PAR: "Paraguay",
  AUS: "Australien",
  TUR: "Türkei",
  GER: "Deutschland",
  CUW: "Curaçao",
  CIV: "Elfenbeinküste",
  ECU: "Ecuador",
  NED: "Niederlande",
  JPN: "Japan",
  SWE: "Schweden",
  TUN: "Tunesien",
  BEL: "Belgien",
  EGY: "Ägypten",
  IRN: "Iran",
  NZL: "Neuseeland",
  ESP: "Spanien",
  CPV: "Kap Verde",
  KSA: "Saudi-Arabien",
  URU: "Uruguay",
  FRA: "Frankreich",
  SEN: "Senegal",
  IRQ: "Irak",
  NOR: "Norwegen",
  ARG: "Argentinien",
  ALG: "Algerien",
  AUT: "Österreich",
  JOR: "Jordanien",
  POR: "Portugal",
  COD: "DR Kongo",
  UZB: "Usbekistan",
  COL: "Kolumbien",
  ENG: "England",
  CRO: "Kroatien",
  GHA: "Ghana",
  PAN: "Panama",
};

const FIFA_NAME_TO_TEAM = {
  mexico: "Mexiko",
  "south africa": "Südafrika",
  "korea republic": "Südkorea",
  czechia: "Tschechien",
  canada: "Kanada",
  "bosnia and herzegovina": "Bosnien-Herzegowina",
  qatar: "Katar",
  switzerland: "Schweiz",
  brazil: "Brasilien",
  morocco: "Marokko",
  haiti: "Haiti",
  scotland: "Schottland",
  usa: "USA",
  paraguay: "Paraguay",
  australia: "Australien",
  turkiye: "Türkei",
  germany: "Deutschland",
  curacao: "Curaçao",
  "cote d ivoire": "Elfenbeinküste",
  ecuador: "Ecuador",
  netherlands: "Niederlande",
  japan: "Japan",
  sweden: "Schweden",
  tunisia: "Tunesien",
  belgium: "Belgien",
  egypt: "Ägypten",
  "ir iran": "Iran",
  "new zealand": "Neuseeland",
  spain: "Spanien",
  "cabo verde": "Kap Verde",
  "saudi arabia": "Saudi-Arabien",
  uruguay: "Uruguay",
  france: "Frankreich",
  senegal: "Senegal",
  iraq: "Irak",
  norway: "Norwegen",
  argentina: "Argentinien",
  algeria: "Algerien",
  austria: "Österreich",
  jordan: "Jordanien",
  portugal: "Portugal",
  "congo dr": "DR Kongo",
  uzbekistan: "Usbekistan",
  colombia: "Kolumbien",
  england: "England",
  croatia: "Kroatien",
  ghana: "Ghana",
  panama: "Panama",
};

const KO_ROUNDS = [
  { from: 73, to: 88, round: "R32", id: (index) => `R32_${index + 1}` },
  { from: 89, to: 96, round: "R16", id: (index) => `R16_${index + 1}` },
  { from: 97, to: 100, round: "QF", id: (index) => `QF${index + 1}` },
  { from: 101, to: 102, round: "SF", id: (index) => `SF${index + 1}` },
  { from: 103, to: 103, round: "P3", id: () => "P3" },
  { from: 104, to: 104, round: "FIN", id: () => "FIN" },
];

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function fifaTeamName(side) {
  if (!side) return "";
  const code = String(side.Abbreviation || side.IdCountry || "").toUpperCase();
  if (FIFA_CODE_TO_TEAM[code]) return FIFA_CODE_TO_TEAM[code];
  return FIFA_NAME_TO_TEAM[normalizeName(side.ShortClubName)] || "";
}

function matchTime(match) {
  return new Date(match.Date || 0).getTime();
}

export function validateFifaFeed(matches) {
  if (!Array.isArray(matches) || matches.length < 104) {
    throw new Error(`FIFA lieferte nur ${matches?.length ?? 0} von 104 Spielen`);
  }
  const numbers = new Set(matches.map((match) => Number(match.MatchNumber)));
  for (let number = 1; number <= 104; number += 1) {
    if (!numbers.has(number)) throw new Error(`FIFA-Spiel ${number} fehlt`);
  }
  return matches;
}

export async function fetchFifaMatches({ fetchImpl = fetch } = {}) {
  const response = await fetchImpl(FIFA_RESULTS_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`FIFA API antwortete mit HTTP ${response.status}`);
  const payload = await response.json();
  return validateFifaFeed(payload?.Results);
}

export function buildFifaMatchMap(matches, resolveGroupMatch) {
  const mapping = new Map();

  for (const match of matches) {
    const number = Number(match.MatchNumber);
    if (number > 72) continue;
    const home = fifaTeamName(match.Home);
    const away = fifaTeamName(match.Away);
    const resolved = resolveGroupMatch?.(home, away);
    if (!resolved) continue;
    mapping.set(String(match.IdMatch), {
      matchId: typeof resolved === "string" ? resolved : resolved.matchId,
      swap: typeof resolved === "string" ? false : Boolean(resolved.swap),
      round: typeof resolved === "string" ? resolved[0] : resolved.round,
    });
  }

  for (const config of KO_ROUNDS) {
    const roundMatches = matches
      .filter((match) => {
        const number = Number(match.MatchNumber);
        return number >= config.from && number <= config.to;
      })
      .sort((left, right) => matchTime(left) - matchTime(right));
    roundMatches.forEach((match, index) => {
      mapping.set(String(match.IdMatch), {
        matchId: config.id(index),
        swap: false,
        round: config.round,
      });
    });
  }
  return mapping;
}

function numberOrNull(value) {
  return value == null || value === "" ? null : Number(value);
}

export function extractFifaMatchState(match, swap = false, now = Date.now()) {
  let homeGoals = numberOrNull(match.HomeTeamScore ?? match.Home?.Score);
  let awayGoals = numberOrNull(match.AwayTeamScore ?? match.Away?.Score);
  let penaltyHomeGoals = numberOrNull(match.HomeTeamPenaltyScore);
  let penaltyAwayGoals = numberOrNull(match.AwayTeamPenaltyScore);
  if (swap) {
    [homeGoals, awayGoals] = [awayGoals, homeGoals];
    [penaltyHomeGoals, penaltyAwayGoals] = [penaltyAwayGoals, penaltyHomeGoals];
  }

  const kickoff = matchTime(match);
  const officialStatus = Number(match.MatchStatus);
  const started = Number.isFinite(kickoff) && now >= kickoff;
  const scoreAvailable = homeGoals != null && awayGoals != null;
  let status = officialStatus === 0 ? "FT" : started ? "LIVE" : "SCHEDULED";
  if (status === "LIVE" && scoreAvailable && now >= kickoff + 5 * 60 * 60 * 1000) {
    status = "FT";
  }

  if (status === "SCHEDULED" && !scoreAvailable) {
    homeGoals = null;
    awayGoals = null;
  }

  let penaltyWinner = null;
  if (
    penaltyHomeGoals != null &&
    penaltyAwayGoals != null &&
    penaltyHomeGoals !== penaltyAwayGoals &&
    homeGoals === awayGoals
  ) {
    penaltyWinner = penaltyHomeGoals > penaltyAwayGoals ? "home" : "away";
  } else {
    penaltyHomeGoals = null;
    penaltyAwayGoals = null;
  }

  if (status === "FT" && !scoreAvailable) {
    throw new Error(`FIFA-Endstand ohne Resultat bei Spiel ${match.MatchNumber}`);
  }

  return {
    ...(homeGoals != null && awayGoals != null ? { homeGoals, awayGoals } : {}),
    status,
    penaltyWinner,
    penaltyHomeGoals,
    penaltyAwayGoals,
  };
}

export function fifaDateParts(match, timeZone = "Europe/Zurich") {
  const date = new Date(match.Date);
  if (!Number.isFinite(date.getTime())) return { date: null, time: null };
  const parts = new Intl.DateTimeFormat("de-CH", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return {
    date: `${get("day")}.${get("month")}.${get("year")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export function isLiveSyncCandidate(match, now = Date.now()) {
  const kickoff = matchTime(match);
  const status = Number(match.MatchStatus);
  return (
    (status !== 0 && status !== 1) ||
    (Number.isFinite(kickoff) &&
      now >= kickoff - 10 * 60 * 1000 &&
      now <= kickoff + 12 * 60 * 60 * 1000)
  );
}
