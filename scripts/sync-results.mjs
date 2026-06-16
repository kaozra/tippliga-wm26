import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Datenquelle: OpenLigaDB (gratis, kein Key). API-Football scheidet aus:
// dessen Gratis-Plan sperrt Season 2026 → liefert 0 Spiele.
// Nur Gruppenspiele werden automatisch gemappt; die KO-Phase bleibt manuell,
// weil die App dort Platzhalter-Teams (1A, "Sieger R32_1") nutzt.

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.warn('[sync] ⚠️  FIREBASE_SERVICE_ACCOUNT secret not set — skipping.')
  process.exit(0)
}

let db
try {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
  }
  db = getFirestore()
} catch (err) {
  console.error('[sync] ❌ Firebase init failed:', err.message)
  process.exit(0)
}

const LEAGUE = 'wm26', SEASON = '2026'
// OpenLigaDB-Teamnamen, die von unseren App-Namen abweichen
const TEAM_FIX = {
  'Bosnien und Herzegowina': 'Bosnien-Herzegowina',
  'Saudi Arabien': 'Saudi-Arabien',
}
const fixTeam = t => TEAM_FIX[t] || t || ''

// Gruppenspiele: Home|Away → matchId
const MATCHES = [
  {id:'A1',home:'Mexiko',away:'Südafrika'},{id:'A2',home:'Südkorea',away:'Tschechien'},
  {id:'A3',home:'Tschechien',away:'Südafrika'},{id:'A4',home:'Mexiko',away:'Südkorea'},
  {id:'A5',home:'Tschechien',away:'Mexiko'},{id:'A6',home:'Südafrika',away:'Südkorea'},
  {id:'B1',home:'Kanada',away:'Bosnien-Herzegowina'},{id:'B2',home:'Katar',away:'Schweiz'},
  {id:'B3',home:'Schweiz',away:'Bosnien-Herzegowina'},{id:'B4',home:'Kanada',away:'Katar'},
  {id:'B5',home:'Schweiz',away:'Kanada'},{id:'B6',home:'Bosnien-Herzegowina',away:'Katar'},
  {id:'C1',home:'Brasilien',away:'Marokko'},{id:'C2',home:'Haiti',away:'Schottland'},
  {id:'C3',home:'Schottland',away:'Marokko'},{id:'C4',home:'Brasilien',away:'Haiti'},
  {id:'C5',home:'Schottland',away:'Brasilien'},{id:'C6',home:'Marokko',away:'Haiti'},
  {id:'D1',home:'USA',away:'Paraguay'},{id:'D2',home:'Australien',away:'Türkei'},
  {id:'D3',home:'USA',away:'Australien'},{id:'D4',home:'Türkei',away:'Paraguay'},
  {id:'D5',home:'Türkei',away:'USA'},{id:'D6',home:'Paraguay',away:'Australien'},
  {id:'E1',home:'Deutschland',away:'Curaçao'},{id:'E2',home:'Elfenbeinküste',away:'Ecuador'},
  {id:'E3',home:'Deutschland',away:'Elfenbeinküste'},{id:'E4',home:'Ecuador',away:'Curaçao'},
  {id:'E5',home:'Ecuador',away:'Deutschland'},{id:'E6',home:'Curaçao',away:'Elfenbeinküste'},
  {id:'F1',home:'Niederlande',away:'Japan'},{id:'F2',home:'Schweden',away:'Tunesien'},
  {id:'F3',home:'Niederlande',away:'Schweden'},{id:'F4',home:'Tunesien',away:'Japan'},
  {id:'F5',home:'Japan',away:'Schweden'},{id:'F6',home:'Tunesien',away:'Niederlande'},
  {id:'G1',home:'Belgien',away:'Ägypten'},{id:'G2',home:'Iran',away:'Neuseeland'},
  {id:'G3',home:'Belgien',away:'Iran'},{id:'G4',home:'Neuseeland',away:'Ägypten'},
  {id:'G5',home:'Ägypten',away:'Iran'},{id:'G6',home:'Neuseeland',away:'Belgien'},
  {id:'H1',home:'Spanien',away:'Kap Verde'},{id:'H2',home:'Saudi-Arabien',away:'Uruguay'},
  {id:'H3',home:'Spanien',away:'Saudi-Arabien'},{id:'H4',home:'Uruguay',away:'Kap Verde'},
  {id:'H5',home:'Kap Verde',away:'Saudi-Arabien'},{id:'H6',home:'Uruguay',away:'Spanien'},
  {id:'I1',home:'Frankreich',away:'Senegal'},{id:'I2',home:'Irak',away:'Norwegen'},
  {id:'I3',home:'Frankreich',away:'Irak'},{id:'I4',home:'Norwegen',away:'Senegal'},
  {id:'I5',home:'Norwegen',away:'Frankreich'},{id:'I6',home:'Senegal',away:'Irak'},
  {id:'J1',home:'Argentinien',away:'Algerien'},{id:'J2',home:'Österreich',away:'Jordanien'},
  {id:'J3',home:'Argentinien',away:'Österreich'},{id:'J4',home:'Jordanien',away:'Algerien'},
  {id:'J5',home:'Algerien',away:'Österreich'},{id:'J6',home:'Jordanien',away:'Argentinien'},
  {id:'K1',home:'Portugal',away:'DR Kongo'},{id:'K2',home:'Usbekistan',away:'Kolumbien'},
  {id:'K3',home:'Portugal',away:'Usbekistan'},{id:'K4',home:'Kolumbien',away:'DR Kongo'},
  {id:'K5',home:'Kolumbien',away:'Portugal'},{id:'K6',home:'DR Kongo',away:'Usbekistan'},
  {id:'L1',home:'England',away:'Kroatien'},{id:'L2',home:'Ghana',away:'Panama'},
  {id:'L3',home:'England',away:'Ghana'},{id:'L4',home:'Panama',away:'Kroatien'},
  {id:'L5',home:'Panama',away:'England'},{id:'L6',home:'Kroatien',away:'Ghana'},
]
const LOOKUP = {}
MATCHES.forEach(m => { LOOKUP[`${m.home}|${m.away}`] = m.id })

async function get(path) {
  const r = await fetch(`https://api.openligadb.de/${path}`)
  if (!r.ok) throw new Error(`OpenLigaDB ${path} → HTTP ${r.status}`)
  return r.json()
}

// Endergebnis aus matchResults (resultTypeID 2 = Endstand)
function finalResult(m) {
  const res = m.matchResults || []
  const fin = res.find(r => r.resultTypeID === 2) || res[res.length - 1]
  return fin ? { h: fin.pointsTeam1, a: fin.pointsTeam2 } : null
}

// Tor-Events (für die Match-Detail-Anzeige); Team über den Tor-Verlauf
function goalEvents(m, t1, t2) {
  const goals = [...(m.goals || [])].sort((a, b) => (a.matchMinute || 0) - (b.matchMinute || 0))
  let s1 = 0, s2 = 0
  const out = []
  for (const g of goals) {
    const d1 = (g.scoreTeam1 ?? s1) - s1
    s1 = g.scoreTeam1 ?? s1; s2 = g.scoreTeam2 ?? s2
    const team = g.isOwnGoal ? (d1 > 0 ? t2 : t1) : (d1 > 0 ? t1 : t2)
    out.push({
      time: g.matchMinute || 0, extra: null, type: 'Goal',
      detail: g.isOwnGoal ? 'Own Goal' : g.isPenalty ? 'Penalty' : 'Normal Goal',
      player: (g.goalGetterName || '').trim() || '—', assist: null, teamName: team,
    })
  }
  return out
}

async function sync() {
  const matches = await get(`getmatchdata/${LEAGUE}/${SEASON}`)
  console.log(`[sync] OpenLigaDB: ${matches.length} Spiele, beendet: ${matches.filter(m=>m.matchIsFinished).length}`)
  let updated = 0, skipped = 0

  for (const x of matches) {
    if (!x.matchIsFinished) { skipped++; continue }
    const t1 = fixTeam(x.team1?.teamName), t2 = fixTeam(x.team2?.teamName)
    let matchId = LOOKUP[`${t1}|${t2}`], swap = false
    if (!matchId) { matchId = LOOKUP[`${t2}|${t1}`]; swap = true }   // Heim/Auswärts ggf. vertauscht
    if (!matchId) { skipped++; continue }                            // KO o. Ä. → manuell

    const r = finalResult(x)
    if (!r || r.h == null || r.a == null) { skipped++; continue }
    const homeGoals = swap ? r.a : r.h
    const awayGoals = swap ? r.h : r.a

    await db.collection('results').doc(matchId).set({
      homeGoals, awayGoals, matchId, status: 'FT',
      updatedAt: FieldValue.serverTimestamp(), source: 'openligadb',
    }, { merge: true })

    const events = goalEvents(x, t1, t2)
    await db.collection('events').doc(matchId).set({ matchId, events, updatedAt: FieldValue.serverTimestamp() })

    console.log(`[sync] ✅ ${matchId}: ${t1} ${r.h}:${r.a} ${t2}${swap?' (swap)':''}`)
    updated++
  }
  console.log(`[sync] Done — updated: ${updated}, skipped: ${skipped}`)
}

sync().catch(err => { console.error('[sync] ERROR:', err.message || err); process.exit(0) })
