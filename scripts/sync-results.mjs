import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
}
const db = getFirestore()
const API_KEY = process.env.API_FOOTBALL_KEY

// API-Football English team names → our German names
const TEAM_MAP = {
  'Mexico':                   'Mexiko',
  'South Africa':             'Südafrika',
  'Korea Republic':           'Südkorea',
  'Czech Republic':           'Tschechien',
  'Czechia':                  'Tschechien',
  'Canada':                   'Kanada',
  'Bosnia and Herzegovina':   'Bosnien-Herzegowina',
  'Bosnia':                   'Bosnien-Herzegowina',
  'Qatar':                    'Katar',
  'Switzerland':              'Schweiz',
  'Brazil':                   'Brasilien',
  'Morocco':                  'Marokko',
  'Haiti':                    'Haiti',
  'Scotland':                 'Schottland',
  'United States':            'USA',
  'USA':                      'USA',
  'Paraguay':                 'Paraguay',
  'Australia':                'Australien',
  'Turkey':                   'Türkei',
  'Turkiye':                  'Türkei',
  'Germany':                  'Deutschland',
  'Curacao':                  'Curaçao',
  "Cote d'Ivoire":            'Elfenbeinküste',
  'Ivory Coast':              'Elfenbeinküste',
  'Ecuador':                  'Ecuador',
  'Netherlands':              'Niederlande',
  'Japan':                    'Japan',
  'Sweden':                   'Schweden',
  'Tunisia':                  'Tunesien',
  'Belgium':                  'Belgien',
  'Egypt':                    'Ägypten',
  'Iran':                     'Iran',
  'New Zealand':              'Neuseeland',
  'Spain':                    'Spanien',
  'Cape Verde':               'Kap Verde',
  'Saudi Arabia':             'Saudi-Arabien',
  'Uruguay':                  'Uruguay',
  'France':                   'Frankreich',
  'Senegal':                  'Senegal',
  'Iraq':                     'Irak',
  'Norway':                   'Norwegen',
  'Argentina':                'Argentinien',
  'Algeria':                  'Algerien',
  'Austria':                  'Österreich',
  'Jordan':                   'Jordanien',
  'Portugal':                 'Portugal',
  'DR Congo':                 'DR Kongo',
  'Congo DR':                 'DR Kongo',
  'Uzbekistan':               'Usbekistan',
  'Colombia':                 'Kolumbien',
  'England':                  'England',
  'Croatia':                  'Kroatien',
  'Ghana':                    'Ghana',
  'Panama':                   'Panama',
}

// All group stage matches: matchId → { home, away }
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

// Build fast lookup: "Home|Away" → matchId
const LOOKUP = {}
MATCHES.forEach(m => { LOOKUP[`${m.home}|${m.away}`] = m.id })

// Live statuses worth syncing
const SYNC_STATUSES = new Set(['1H','HT','2H','ET','BT','P','FT','AET','PEN'])

async function sync() {
  const today = new Date().toISOString().split('T')[0]
  console.log(`[sync] Fetching WM 2026 fixtures for ${today}`)

  const url = `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${today}`
  const resp = await fetch(url, { headers: { 'x-apisports-key': API_KEY } })
  const data = await resp.json()

  const fixtures = data.response || []
  console.log(`[sync] ${fixtures.length} fixture(s) found`)

  let updated = 0, skipped = 0

  for (const f of fixtures) {
    const status = f.fixture.status.short
    if (!SYNC_STATUSES.has(status)) { skipped++; continue }

    const homeEn = f.teams.home.name
    const awayEn = f.teams.away.name
    const homeDE = TEAM_MAP[homeEn]
    const awayDE = TEAM_MAP[awayEn]

    if (!homeDE || !awayDE) {
      console.warn(`[sync] No mapping: "${homeEn}" | "${awayEn}"`)
      skipped++
      continue
    }

    const matchId = LOOKUP[`${homeDE}|${awayDE}`]
    if (!matchId) {
      console.warn(`[sync] No matchId for: ${homeDE} vs ${awayDE}`)
      skipped++
      continue
    }

    const homeGoals = f.goals.home ?? null
    const awayGoals = f.goals.away ?? null
    if (homeGoals === null || awayGoals === null) { skipped++; continue }

    await db.collection('results').doc(matchId).set({
      homeGoals, awayGoals, matchId, status,
      updatedAt: FieldValue.serverTimestamp(),
      source: 'api-football',
    }, { merge: true })

    console.log(`[sync] ✅ ${matchId}: ${homeDE} ${homeGoals}:${awayGoals} ${awayDE} (${status})`)
    updated++
  }

  console.log(`[sync] Done — updated: ${updated}, skipped: ${skipped}`)
}

sync().catch(err => { console.error('[sync] ERROR:', err); process.exit(1) })
