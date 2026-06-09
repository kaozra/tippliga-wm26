import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.warn('[playerstats] ⚠️  FIREBASE_SERVICE_ACCOUNT not set — skipping.')
  process.exit(0)
}
if (!process.env.API_FOOTBALL_KEY) {
  console.warn('[playerstats] ⚠️  API_FOOTBALL_KEY not set — skipping.')
  process.exit(0)
}

let db
try {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
  }
  db = getFirestore()
} catch (err) {
  console.error('[playerstats] ❌ Firebase init failed:', err.message)
  process.exit(0)
}

const API_KEY = process.env.API_FOOTBALL_KEY
const LEAGUE = 1
const SEASON = 2026

const TEAM_MAP = {
  'Mexico':'Mexiko','South Africa':'Südafrika','Korea Republic':'Südkorea','Czech Republic':'Tschechien','Czechia':'Tschechien','Canada':'Kanada','Bosnia and Herzegovina':'Bosnien-Herzegowina','Qatar':'Katar','Switzerland':'Schweiz','Brazil':'Brasilien','Morocco':'Marokko','Haiti':'Haiti','Scotland':'Schottland','United States':'USA','USA':'USA','Paraguay':'Paraguay','Australia':'Australien','Turkey':'Türkei','Turkiye':'Türkei','Germany':'Deutschland','Curacao':'Curaçao',"Cote d'Ivoire":'Elfenbeinküste','Ivory Coast':'Elfenbeinküste','Ecuador':'Ecuador','Netherlands':'Niederlande','Japan':'Japan','Sweden':'Schweden','Tunisia':'Tunesien','Belgium':'Belgien','Egypt':'Ägypten','Iran':'Iran','New Zealand':'Neuseeland','Spain':'Spanien','Cape Verde':'Kap Verde','Saudi Arabia':'Saudi-Arabien','Uruguay':'Uruguay','France':'Frankreich','Senegal':'Senegal','Iraq':'Irak','Norway':'Norwegen','Argentina':'Argentinien','Algeria':'Algerien','Austria':'Österreich','Jordan':'Jordanien','Portugal':'Portugal','DR Congo':'DR Kongo','Congo DR':'DR Kongo','Uzbekistan':'Usbekistan','Colombia':'Kolumbien','England':'England','Croatia':'Kroatien','Ghana':'Ghana','Panama':'Panama'
}

async function fetchStat(endpoint) {
  const resp = await fetch(`https://v3.football.api-sports.io/${endpoint}?league=${LEAGUE}&season=${SEASON}`, {
    headers: { 'x-apisports-key': API_KEY }
  })
  const data = await resp.json()
  return data.response || []
}

async function syncPlayerStats() {
  console.log('[playerstats] Syncing player statistics...')

  const [scorers, assists, yellowCards, redCards, goalkeepers] = await Promise.all([
    fetchStat('players/topscorers'),
    fetchStat('players/topassists'),
    fetchStat('players/topyellowcards'),
    fetchStat('players/topredcards'),
    fetchStat('players/topgoalkeepers'),
  ])

  function mapPlayer(p, statKey) {
    return {
      name: p.player.name,
      photo: p.player.photo || null,
      team: TEAM_MAP[p.statistics[0]?.team?.name] || p.statistics[0]?.team?.name || '',
      teamNameEN: p.statistics[0]?.team?.name || '',
      value: p.statistics[0]?.[statKey] ?? 0,
    }
  }

  const stats = {
    topscorers: scorers.slice(0,10).map(p => ({
      name: p.player.name,
      team: TEAM_MAP[p.statistics[0]?.team?.name] || p.statistics[0]?.team?.name || '',
      goals: p.statistics[0]?.goals?.total || 0,
      assists: p.statistics[0]?.goals?.assists || 0,
      games: p.statistics[0]?.games?.appearences || 0,
    })),
    topassists: assists.slice(0,10).map(p => ({
      name: p.player.name,
      team: TEAM_MAP[p.statistics[0]?.team?.name] || p.statistics[0]?.team?.name || '',
      assists: p.statistics[0]?.goals?.assists || 0,
      goals: p.statistics[0]?.goals?.total || 0,
      games: p.statistics[0]?.games?.appearences || 0,
    })),
    topyellow: yellowCards.slice(0,10).map(p => ({
      name: p.player.name,
      team: TEAM_MAP[p.statistics[0]?.team?.name] || p.statistics[0]?.team?.name || '',
      yellow: p.statistics[0]?.cards?.yellow || 0,
      red: p.statistics[0]?.cards?.red || 0,
    })),
    topred: redCards.slice(0,5).map(p => ({
      name: p.player.name,
      team: TEAM_MAP[p.statistics[0]?.team?.name] || p.statistics[0]?.team?.name || '',
      red: p.statistics[0]?.cards?.red || 0,
      yellow: p.statistics[0]?.cards?.yellow || 0,
    })),
    topgoalkeepers: goalkeepers.slice(0,10).map(p => ({
      name: p.player.name,
      team: TEAM_MAP[p.statistics[0]?.team?.name] || p.statistics[0]?.team?.name || '',
      cleanSheets: p.statistics[0]?.goals?.conceded === 0 ? p.statistics[0]?.games?.appearences || 0 : (p.statistics[0]?.goals?.saves || 0),
      conceded: p.statistics[0]?.goals?.conceded || 0,
      saves: p.statistics[0]?.goals?.saves || 0,
      games: p.statistics[0]?.games?.appearences || 0,
    })),
    updatedAt: FieldValue.serverTimestamp(),
  }

  await db.collection('playerstats').doc('wm2026').set(stats)
  console.log('[playerstats] ✅ Done')
}

syncPlayerStats().catch(err => { console.error('[playerstats] ERROR:', err.message || err); process.exit(0) })
