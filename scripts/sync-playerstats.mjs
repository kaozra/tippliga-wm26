import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Datenquelle: OpenLigaDB (gratis, kein API-Key, kein Limit).
// API-Football scheidet aus: der Gratis-Plan sperrt Season 2026.
// OpenLigaDB liefert Torschützen; Vorlagen/Torhüter/Karten gibt es dort nicht.

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('[playerstats] FIREBASE_SERVICE_ACCOUNT secret is not configured.')
  process.exit(1)
}

let db
try {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) })
  }
  db = getFirestore()
} catch (err) {
  console.error('[playerstats] ❌ Firebase init failed:', err.message)
  process.exit(1)
}

const LEAGUE = 'wm26', SEASON = '2026'
// OpenLigaDB-Teamnamen, die von unseren App-Namen abweichen
const TEAM_FIX = {
  'Bosnien und Herzegowina': 'Bosnien-Herzegowina',
  'Saudi Arabien': 'Saudi-Arabien',
}
const fixTeam = t => TEAM_FIX[t] || t || ''

async function get(path) {
  const r = await fetch(`https://api.openligadb.de/${path}`)
  if (!r.ok) throw new Error(`OpenLigaDB ${path} → HTTP ${r.status}`)
  return r.json()
}

async function syncPlayerStats() {
  console.log('[playerstats] Syncing Torschützen via OpenLigaDB...')
  const matches = await get(`getmatchdata/${LEAGUE}/${SEASON}`)
  const finished = matches.filter(m => m.matchIsFinished).length
  console.log(`[playerstats] Spiele: ${matches.length}, beendet: ${finished}`)

  // Torschützen aggregieren; Team über den Tor-Verlauf (Score-Delta) ableiten.
  const agg = {}
  for (const m of matches) {
    const t1 = m.team1?.teamName, t2 = m.team2?.teamName
    const goals = [...(m.goals || [])].sort((a, b) => (a.matchMinute || 0) - (b.matchMinute || 0))
    let s1 = 0, s2 = 0
    for (const g of goals) {
      const d1 = (g.scoreTeam1 ?? s1) - s1
      s1 = g.scoreTeam1 ?? s1
      s2 = g.scoreTeam2 ?? s2
      const name = (g.goalGetterName || '').trim()
      if (!name || g.isOwnGoal) continue        // Eigentore zählen nicht zum Schützen
      const team = d1 > 0 ? t1 : t2              // welche Seite hat regulär getroffen
      if (!agg[name]) agg[name] = { name, team: fixTeam(team), goals: 0, penalties: 0 }
      agg[name].goals++
      if (g.isPenalty) agg[name].penalties++
    }
  }

  const topscorers = Object.values(agg)
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
    .slice(0, 15)

  console.log(`[playerstats] ${topscorers.length} Torschützen, Top: ${topscorers.slice(0,3).map(s=>`${s.name}(${s.goals})`).join(', ')}`)

  await db.collection('playerstats').doc('wm2026').set({
    topscorers,
    source: 'openligadb',
    matchesFinished: finished,
    updatedAt: FieldValue.serverTimestamp(),
  })
  console.log('[playerstats] ✅ Done')
}

syncPlayerStats().catch(err => {
  console.error('[playerstats] ERROR:', err.message || err)
  process.exitCode = 1
})
