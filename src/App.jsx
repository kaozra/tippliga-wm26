import { useState, useEffect, useCallback } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, signOut, onAuthStateChanged, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential, updateProfile
} from 'firebase/auth'
import {
  getFirestore, doc, setDoc, getDoc, getDocs, collection,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import './App.css'

const firebaseConfig = {
  apiKey: 'AIzaSyAU1YuONlOvbpSYXvWTGHOrTEoxt4oAQOQ',
  authDomain: 'wm26-tipit.firebaseapp.com',
  projectId: 'wm26-tipit',
  storageBucket: 'wm26-tipit.firebasestorage.app',
  messagingSenderId: '578314228001',
  appId: '1:578314228001:web:addd4246e41bcfe9b3ee60'
}
const fbApp = initializeApp(firebaseConfig)
const auth = getAuth(fbApp)
const db = getFirestore(fbApp)

const ADMIN_EMAIL = 'kaozra@hotmail.com'
const AVATARS = ['⚽','🦁','🐯','🦊','🐺','🦅','🐲','🦄','🐻','🦋','🐬','🦈','🐆','🦉','🦜','🐸']

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const GROUPS = {
  A: ['Mexiko', 'Südafrika', 'Südkorea', 'Tschechien'],
  B: ['Kanada', 'Bosnien-Herzegowina', 'Katar', 'Schweiz'],
  C: ['Brasilien', 'Marokko', 'Haiti', 'Schottland'],
  D: ['USA', 'Paraguay', 'Australien', 'Türkei'],
  E: ['Deutschland', 'Curaçao', 'Elfenbeinküste', 'Ecuador'],
  F: ['Niederlande', 'Japan', 'Schweden', 'Tunesien'],
  G: ['Belgien', 'Ägypten', 'Iran', 'Neuseeland'],
  H: ['Spanien', 'Kap Verde', 'Saudi-Arabien', 'Uruguay'],
  I: ['Frankreich', 'Senegal', 'Irak', 'Norwegen'],
  J: ['Argentinien', 'Algerien', 'Österreich', 'Jordanien'],
  K: ['Portugal', 'DR Kongo', 'Usbekistan', 'Kolumbien'],
  L: ['England', 'Kroatien', 'Ghana', 'Panama'],
}

const MATCHES = [
  // Gruppe A
  { id:'A1', group:'A', home:'Mexiko', away:'Südafrika', date:'11.06.2026', time:'21:00' },
  { id:'A2', group:'A', home:'Südkorea', away:'Tschechien', date:'12.06.2026', time:'04:00' },
  { id:'A3', group:'A', home:'Tschechien', away:'Südafrika', date:'18.06.2026', time:'18:00' },
  { id:'A4', group:'A', home:'Mexiko', away:'Südkorea', date:'19.06.2026', time:'03:00' },
  { id:'A5', group:'A', home:'Tschechien', away:'Mexiko', date:'25.06.2026', time:'03:00' },
  { id:'A6', group:'A', home:'Südafrika', away:'Südkorea', date:'25.06.2026', time:'03:00' },
  // Gruppe B
  { id:'B1', group:'B', home:'Kanada', away:'Bosnien-Herzegowina', date:'12.06.2026', time:'21:00' },
  { id:'B2', group:'B', home:'Katar', away:'Schweiz', date:'13.06.2026', time:'21:00' },
  { id:'B3', group:'B', home:'Schweiz', away:'Bosnien-Herzegowina', date:'18.06.2026', time:'21:00' },
  { id:'B4', group:'B', home:'Kanada', away:'Katar', date:'19.06.2026', time:'00:00' },
  { id:'B5', group:'B', home:'Schweiz', away:'Kanada', date:'24.06.2026', time:'21:00' },
  { id:'B6', group:'B', home:'Bosnien-Herzegowina', away:'Katar', date:'24.06.2026', time:'21:00' },
  // Gruppe C
  { id:'C1', group:'C', home:'Brasilien', away:'Marokko', date:'14.06.2026', time:'00:00' },
  { id:'C2', group:'C', home:'Haiti', away:'Schottland', date:'14.06.2026', time:'03:00' },
  { id:'C3', group:'C', home:'Schottland', away:'Marokko', date:'20.06.2026', time:'00:00' },
  { id:'C4', group:'C', home:'Brasilien', away:'Haiti', date:'20.06.2026', time:'03:00' },
  { id:'C5', group:'C', home:'Schottland', away:'Brasilien', date:'25.06.2026', time:'00:00' },
  { id:'C6', group:'C', home:'Marokko', away:'Haiti', date:'25.06.2026', time:'00:00' },
  // Gruppe D
  { id:'D1', group:'D', home:'USA', away:'Paraguay', date:'13.06.2026', time:'03:00' },
  { id:'D2', group:'D', home:'Australien', away:'Türkei', date:'14.06.2026', time:'06:00' },
  { id:'D3', group:'D', home:'USA', away:'Australien', date:'19.06.2026', time:'21:00' },
  { id:'D4', group:'D', home:'Türkei', away:'Paraguay', date:'20.06.2026', time:'06:00' },
  { id:'D5', group:'D', home:'Türkei', away:'USA', date:'26.06.2026', time:'04:00' },
  { id:'D6', group:'D', home:'Paraguay', away:'Australien', date:'26.06.2026', time:'04:00' },
  // Gruppe E
  { id:'E1', group:'E', home:'Deutschland', away:'Curaçao', date:'14.06.2026', time:'19:00' },
  { id:'E2', group:'E', home:'Elfenbeinküste', away:'Ecuador', date:'15.06.2026', time:'01:00' },
  { id:'E3', group:'E', home:'Deutschland', away:'Elfenbeinküste', date:'20.06.2026', time:'22:00' },
  { id:'E4', group:'E', home:'Ecuador', away:'Curaçao', date:'21.06.2026', time:'02:00' },
  { id:'E5', group:'E', home:'Ecuador', away:'Deutschland', date:'25.06.2026', time:'22:00' },
  { id:'E6', group:'E', home:'Curaçao', away:'Elfenbeinküste', date:'25.06.2026', time:'22:00' },
  // Gruppe F
  { id:'F1', group:'F', home:'Niederlande', away:'Japan', date:'14.06.2026', time:'22:00' },
  { id:'F2', group:'F', home:'Schweden', away:'Tunesien', date:'15.06.2026', time:'04:00' },
  { id:'F3', group:'F', home:'Niederlande', away:'Schweden', date:'20.06.2026', time:'19:00' },
  { id:'F4', group:'F', home:'Tunesien', away:'Japan', date:'21.06.2026', time:'06:00' },
  { id:'F5', group:'F', home:'Japan', away:'Schweden', date:'26.06.2026', time:'01:00' },
  { id:'F6', group:'F', home:'Tunesien', away:'Niederlande', date:'26.06.2026', time:'01:00' },
  // Gruppe G
  { id:'G1', group:'G', home:'Belgien', away:'Ägypten', date:'16.06.2026', time:'00:00' },
  { id:'G2', group:'G', home:'Iran', away:'Neuseeland', date:'16.06.2026', time:'06:00' },
  { id:'G3', group:'G', home:'Belgien', away:'Iran', date:'21.06.2026', time:'21:00' },
  { id:'G4', group:'G', home:'Neuseeland', away:'Ägypten', date:'22.06.2026', time:'03:00' },
  { id:'G5', group:'G', home:'Ägypten', away:'Iran', date:'27.06.2026', time:'05:00' },
  { id:'G6', group:'G', home:'Neuseeland', away:'Belgien', date:'27.06.2026', time:'05:00' },
  // Gruppe H
  { id:'H1', group:'H', home:'Spanien', away:'Kap Verde', date:'15.06.2026', time:'19:00' },
  { id:'H2', group:'H', home:'Saudi-Arabien', away:'Uruguay', date:'16.06.2026', time:'00:00' },
  { id:'H3', group:'H', home:'Spanien', away:'Saudi-Arabien', date:'21.06.2026', time:'18:00' },
  { id:'H4', group:'H', home:'Uruguay', away:'Kap Verde', date:'22.06.2026', time:'00:00' },
  { id:'H5', group:'H', home:'Kap Verde', away:'Saudi-Arabien', date:'27.06.2026', time:'02:00' },
  { id:'H6', group:'H', home:'Uruguay', away:'Spanien', date:'27.06.2026', time:'02:00' },
  // Gruppe I
  { id:'I1', group:'I', home:'Frankreich', away:'Senegal', date:'16.06.2026', time:'21:00' },
  { id:'I2', group:'I', home:'Irak', away:'Norwegen', date:'17.06.2026', time:'00:00' },
  { id:'I3', group:'I', home:'Frankreich', away:'Irak', date:'22.06.2026', time:'23:00' },
  { id:'I4', group:'I', home:'Norwegen', away:'Senegal', date:'23.06.2026', time:'02:00' },
  { id:'I5', group:'I', home:'Norwegen', away:'Frankreich', date:'26.06.2026', time:'21:00' },
  { id:'I6', group:'I', home:'Senegal', away:'Irak', date:'26.06.2026', time:'21:00' },
  // Gruppe J
  { id:'J1', group:'J', home:'Argentinien', away:'Algerien', date:'17.06.2026', time:'03:00' },
  { id:'J2', group:'J', home:'Österreich', away:'Jordanien', date:'17.06.2026', time:'06:00' },
  { id:'J3', group:'J', home:'Argentinien', away:'Österreich', date:'22.06.2026', time:'19:00' },
  { id:'J4', group:'J', home:'Jordanien', away:'Algerien', date:'23.06.2026', time:'05:00' },
  { id:'J5', group:'J', home:'Algerien', away:'Österreich', date:'28.06.2026', time:'04:00' },
  { id:'J6', group:'J', home:'Jordanien', away:'Argentinien', date:'28.06.2026', time:'04:00' },
  // Gruppe K
  { id:'K1', group:'K', home:'Portugal', away:'DR Kongo', date:'17.06.2026', time:'19:00' },
  { id:'K2', group:'K', home:'Usbekistan', away:'Kolumbien', date:'18.06.2026', time:'04:00' },
  { id:'K3', group:'K', home:'Portugal', away:'Usbekistan', date:'23.06.2026', time:'19:00' },
  { id:'K4', group:'K', home:'Kolumbien', away:'DR Kongo', date:'24.06.2026', time:'04:00' },
  { id:'K5', group:'K', home:'Kolumbien', away:'Portugal', date:'28.06.2026', time:'01:30' },
  { id:'K6', group:'K', home:'DR Kongo', away:'Usbekistan', date:'28.06.2026', time:'01:30' },
  // Gruppe L
  { id:'L1', group:'L', home:'England', away:'Kroatien', date:'17.06.2026', time:'22:00' },
  { id:'L2', group:'L', home:'Ghana', away:'Panama', date:'18.06.2026', time:'01:00' },
  { id:'L3', group:'L', home:'England', away:'Ghana', date:'23.06.2026', time:'22:00' },
  { id:'L4', group:'L', home:'Panama', away:'Kroatien', date:'24.06.2026', time:'01:00' },
  { id:'L5', group:'L', home:'Panama', away:'England', date:'27.06.2026', time:'23:00' },
  { id:'L6', group:'L', home:'Kroatien', away:'Ghana', date:'27.06.2026', time:'23:00' },
  // Sechzehntelfinale (Round of 32)
  { id:'R32_1',  group:'R32', home:'1A', away:'2B', date:'29.06.2026', time:'21:00' },
  { id:'R32_2',  group:'R32', home:'1C', away:'2D', date:'29.06.2026', time:'21:00' },
  { id:'R32_3',  group:'R32', home:'1B', away:'2A', date:'30.06.2026', time:'18:00' },
  { id:'R32_4',  group:'R32', home:'1D', away:'2C', date:'30.06.2026', time:'21:00' },
  { id:'R32_5',  group:'R32', home:'1E', away:'2F', date:'01.07.2026', time:'18:00' },
  { id:'R32_6',  group:'R32', home:'1G', away:'2H', date:'01.07.2026', time:'21:00' },
  { id:'R32_7',  group:'R32', home:'1F', away:'2E', date:'02.07.2026', time:'18:00' },
  { id:'R32_8',  group:'R32', home:'1H', away:'2G', date:'02.07.2026', time:'21:00' },
  { id:'R32_9',  group:'R32', home:'1I', away:'2J', date:'03.07.2026', time:'18:00' },
  { id:'R32_10', group:'R32', home:'1K', away:'2L', date:'03.07.2026', time:'21:00' },
  { id:'R32_11', group:'R32', home:'1J', away:'2I', date:'04.07.2026', time:'18:00' },
  { id:'R32_12', group:'R32', home:'1L', away:'2K', date:'04.07.2026', time:'21:00' },
  { id:'R32_13', group:'R32', home:'Bester 3. (B/E/F/I)', away:'Bester 3. (A/C/D)', date:'05.07.2026', time:'18:00' },
  { id:'R32_14', group:'R32', home:'Bester 3. (G/H/K/L)', away:'Bester 3. (E/F/G/H)', date:'05.07.2026', time:'21:00' },
  { id:'R32_15', group:'R32', home:'Bester 3. (A/B/C/D)', away:'Bester 3. (I/J/K/L)', date:'06.07.2026', time:'18:00' },
  { id:'R32_16', group:'R32', home:'Bester 3. (J/K/L)', away:'Bester 3. (G/H/I/J)', date:'06.07.2026', time:'21:00' },
  // Viertelfinale
  { id:'QF1', group:'QF', home:'Sieger R32_1', away:'Sieger R32_2', date:'09.07.2026', time:'21:00' },
  { id:'QF2', group:'QF', home:'Sieger R32_3', away:'Sieger R32_4', date:'09.07.2026', time:'21:00' },
  { id:'QF3', group:'QF', home:'Sieger R32_5', away:'Sieger R32_6', date:'10.07.2026', time:'21:00' },
  { id:'QF4', group:'QF', home:'Sieger R32_7', away:'Sieger R32_8', date:'10.07.2026', time:'21:00' },
  { id:'QF5', group:'QF', home:'Sieger R32_9', away:'Sieger R32_10', date:'11.07.2026', time:'21:00' },
  { id:'QF6', group:'QF', home:'Sieger R32_11', away:'Sieger R32_12', date:'11.07.2026', time:'21:00' },
  { id:'QF7', group:'QF', home:'Sieger R32_13', away:'Sieger R32_14', date:'12.07.2026', time:'21:00' },
  { id:'QF8', group:'QF', home:'Sieger R32_15', away:'Sieger R32_16', date:'12.07.2026', time:'21:00' },
  // Halbfinale
  { id:'SF1', group:'SF', home:'Sieger QF1', away:'Sieger QF2', date:'14.07.2026', time:'21:00' },
  { id:'SF2', group:'SF', home:'Sieger QF3', away:'Sieger QF4', date:'14.07.2026', time:'21:00' },
  { id:'SF3', group:'SF', home:'Sieger QF5', away:'Sieger QF6', date:'15.07.2026', time:'21:00' },
  { id:'SF4', group:'SF', home:'Sieger QF7', away:'Sieger QF8', date:'15.07.2026', time:'21:00' },
  // Spiel um Platz 3
  { id:'P3',  group:'P3',  home:'Verlierer SF1/SF2', away:'Verlierer SF3/SF4', date:'18.07.2026', time:'21:00' },
  // Finale
  { id:'FIN', group:'FIN', home:'Sieger SF1/SF2', away:'Sieger SF3/SF4', date:'19.07.2026', time:'21:00' },
]

function parseMatchDate(m) {
  const [d, mo, y] = m.date.split('.')
  const [h, min] = m.time.split(':')
  return new Date(+y, +mo - 1, +d, +h, +min)
}

function calcPoints(tip, result) {
  if (!result || result.homeGoals == null || result.awayGoals == null) return null
  const th = tip.homeGoals, ta = tip.awayGoals
  const rh = result.homeGoals, ra = result.awayGoals
  if (th === rh && ta === ra) return 3
  const tipTend = Math.sign(th - ta), resTend = Math.sign(rh - ra)
  if (tipTend === resTend) return (th === rh || ta === ra) ? 2 : 1
  return 0
}

function ptsLabel(pts) {
  if (pts === 3) return <span className="pts-3">⭐ 3 Punkte</span>
  if (pts === 2) return <span className="pts-2">✓ 2 Punkte</span>
  if (pts === 1) return <span className="pts-1">~ 1 Punkt</span>
  if (pts === 0) return <span className="pts-0">✗ 0 Punkte</span>
  return null
}

// ── EYE ICON ─────────────────────────────────────────────────────────────────
function Eye({ show }) {
  return show
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}

// ── REGISTER ─────────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [avatar, setAvatar] = useState('⚽')
  const [code, setCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const urlCode = new URLSearchParams(window.location.search).get('code') || ''
  useEffect(() => { if (urlCode) setCode(urlCode) }, [urlCode])

  async function handleRegister(e) {
    e.preventDefault()
    setErr('')
    if (!name.trim()) return setErr('Name erforderlich')
    if (pw !== pw2) return setErr('Passwörter stimmen nicht überein')
    if (pw.length < 6) return setErr('Passwort min. 6 Zeichen')
    const inviteCode = code.trim().toUpperCase()
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      if (!inviteCode) return setErr('Einladungscode erforderlich')
      const usersSnap = await getDocs(collection(db, 'users'))
      const valid = usersSnap.docs.some(d => d.data().inviteCode === inviteCode)
      if (!valid) return setErr('Ungültiger Einladungscode')
    }
    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, pw)
      await updateProfile(user, { displayName: name.trim() })
      await sendEmailVerification(user)
      const myCode = genCode()
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name.trim(), email: email.toLowerCase(),
        avatar, inviteCode: myCode, invitedBy: inviteCode || null,
        createdAt: serverTimestamp()
      })
    } catch (e) {
      setErr(e.code === 'auth/email-already-in-use' ? 'E-Mail bereits registriert' : e.message)
      setLoading(false)
    }
  }

  return (
    <form className="auth-card" onSubmit={handleRegister}>
      <h2>Registrieren</h2>
      <div className="field"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" /></div>
      <div className="field"><label>E-Mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" /></div>
      <div className="field"><label>Passwort</label>
        <div className="pw-wrap">
          <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Min. 6 Zeichen" />
          <button type="button" className="pw-eye" onClick={() => setShowPw(v => !v)}><Eye show={showPw} /></button>
        </div>
      </div>
      <div className="field"><label>Passwort bestätigen</label>
        <div className="pw-wrap">
          <input type={showPw2 ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Passwort wiederholen" />
          <button type="button" className="pw-eye" onClick={() => setShowPw2(v => !v)}><Eye show={showPw2} /></button>
        </div>
      </div>
      <div className="field"><label>Avatar</label>
        <div className="avatar-grid">{AVATARS.map(a => (
          <button key={a} type="button" className={`avatar-btn${avatar === a ? ' selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
        ))}</div>
      </div>
      {email.toLowerCase() !== ADMIN_EMAIL && (
        <div className="field"><label>Einladungscode</label><input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} /></div>
      )}
      {err && <p className="err">{err}</p>}
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Wird registriert…' : 'Registrieren'}</button>
      <div className="auth-switch">Bereits registriert? <button type="button" onClick={onSwitch}>Anmelden</button></div>
    </form>
  )
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, pw)
    } catch {
      setErr('E-Mail oder Passwort falsch')
      setLoading(false)
    }
  }

  return (
    <form className="auth-card" onSubmit={handleLogin}>
      <h2>Anmelden</h2>
      <div className="field"><label>E-Mail</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" /></div>
      <div className="field"><label>Passwort</label>
        <div className="pw-wrap">
          <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="Passwort" />
          <button type="button" className="pw-eye" onClick={() => setShowPw(v => !v)}><Eye show={showPw} /></button>
        </div>
      </div>
      {err && <p className="err">{err}</p>}
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Anmeldung…' : 'Anmelden'}</button>
      <div className="auth-switch">Noch kein Konto? <button type="button" onClick={onSwitch}>Registrieren</button></div>
    </form>
  )
}

// ── TIPPEN TAB ────────────────────────────────────────────────────────────────
function TippenTab({ uid, results }) {
  const [tips, setTips] = useState({})
  const [filter, setFilter] = useState('ALL')
  const now = new Date()

  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'tips'), orderBy('matchId'))
    const unsub = onSnapshot(q, snap => {
      const t = {}
      snap.docs.forEach(d => {
        const data = d.data()
        if (data.uid === uid) t[data.matchId] = data
      })
      setTips(t)
    })
    return unsub
  }, [uid])

  async function saveTip(matchId, homeGoals, awayGoals) {
    if (homeGoals === '' || awayGoals === '') return
    const id = `${uid}__${matchId}`
    await setDoc(doc(db, 'tips', id), { uid, matchId, homeGoals: +homeGoals, awayGoals: +awayGoals, updatedAt: serverTimestamp() })
  }

  const groupKeys = ['ALL', ...Object.keys(GROUPS), 'R32', 'QF', 'SF', 'P3', 'FIN']
  const groupLabels = { ALL: 'Alle', R32: 'Sechzehntelfinale', QF: 'Viertelfinale', SF: 'Halbfinale', P3: 'Platz 3', FIN: 'Finale' }

  const filtered = filter === 'ALL' ? MATCHES : MATCHES.filter(m => m.group === filter)

  const groupedMatches = {}
  filtered.forEach(m => {
    if (!groupedMatches[m.group]) groupedMatches[m.group] = []
    groupedMatches[m.group].push(m)
  })

  const koGroups = ['R32', 'QF', 'SF', 'P3', 'FIN']
  const koLabels = { R32: '⚡ Sechzehntelfinale', QF: '🏆 Viertelfinale', SF: '🔥 Halbfinale', P3: '🥉 Spiel um Platz 3', FIN: '🥇 Finale' }

  return (
    <div>
      <div className="section-title">🎯 Tippen</div>
      <div className="group-filter">
        {groupKeys.map(k => (
          <button key={k} className={`filter-btn${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>
            {groupLabels[k] || `Gruppe ${k}`}
          </button>
        ))}
      </div>
      {Object.keys(groupedMatches).map(grp => {
        const isKo = koGroups.includes(grp)
        return (
          <div key={grp}>
            {isKo
              ? <div className="ko-label">{koLabels[grp] || grp}</div>
              : <div className="group-header">
                  <span className="group-tag">{grp}</span>
                  Gruppe {grp}
                  <span style={{fontSize:11,color:'var(--muted)',fontFamily:'DM Sans',fontWeight:400,marginLeft:4}}>
                    {GROUPS[grp]?.join(' · ')}
                  </span>
                </div>
            }
            {groupedMatches[grp].map(m => (
              <MatchCard key={m.id} match={m} tip={tips[m.id]} result={results[m.id]} now={now} onSave={saveTip} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function MatchCard({ match, tip, result, now, onSave }) {
  const kickoff = parseMatchDate(match)
  const locked = now >= kickoff
  const [h, setH] = useState(tip?.homeGoals ?? '')
  const [a, setA] = useState(tip?.awayGoals ?? '')

  useEffect(() => {
    setH(tip?.homeGoals ?? '')
    setA(tip?.awayGoals ?? '')
  }, [tip])

  const pts = (result && tip) ? calcPoints(tip, result) : null

  function handleBlur() { onSave(match.id, h, a) }

  return (
    <div className="match-card">
      <div className="match-meta">{match.date} · {match.time} CEST</div>
      <div className="match-teams">
        <div className="team-name team-home">{match.home}</div>
        {result
          ? <div className="result-display">{result.homeGoals} : {result.awayGoals}</div>
          : <div className="match-vs">vs</div>
        }
        <div className="team-name team-away">{match.away}</div>
      </div>
      {locked ? (
        <div className="tip-shown">
          {tip != null ? `${tip.homeGoals} : ${tip.awayGoals}` : '– : –'}
          {pts != null && <div className="tip-points">{ptsLabel(pts)}</div>}
          {pts == null && <div className="match-locked">🔒 Gesperrt</div>}
        </div>
      ) : (
        <>
          <div className="tip-row">
            <input className="tip-input" type="number" min="0" max="99" value={h}
              onChange={e => setH(e.target.value)} onBlur={handleBlur} placeholder="–" />
            <div className="tip-dash">:</div>
            <input className="tip-input" type="number" min="0" max="99" value={a}
              onChange={e => setA(e.target.value)} onBlur={handleBlur} placeholder="–" />
          </div>
          {tip != null && <div className="tip-points" style={{color:'var(--text-dim)'}}>Gespeichert ✓</div>}
        </>
      )}
    </div>
  )
}

// ── RANGLISTE TAB ─────────────────────────────────────────────────────────────
function RanglisteTab({ uid, results }) {
  const [users, setUsers] = useState([])
  const [allTips, setAllTips] = useState([])

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'users'), snap => setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, 'tips'), snap => setAllTips(snap.docs.map(d => d.data())))
    return () => { u1(); u2() }
  }, [])

  const leaderboard = users.map(u => {
    const myTips = allTips.filter(t => t.uid === u.uid)
    const pts = myTips.reduce((sum, t) => {
      const r = results[t.matchId]
      const p = r ? calcPoints(t, r) : 0
      return sum + (p || 0)
    }, 0)
    return { ...u, pts }
  }).sort((a, b) => b.pts - a.pts)

  return (
    <div>
      <div className="section-title">🏆 Rangliste</div>
      <div className="rank-list">
        {leaderboard.map((u, i) => (
          <div key={u.uid} className={`rank-item${u.uid === uid ? ' me' : ''}`}>
            <div className={`rank-pos${i === 0 ? ' top1' : i === 1 ? ' top2' : i === 2 ? ' top3' : ''}`}>{i + 1}</div>
            <div className="rank-avatar">{u.avatar || '⚽'}</div>
            <div className="rank-name">{u.displayName}{u.uid === uid ? ' (Du)' : ''}</div>
            <div className="rank-pts-wrap">
              <div className="rank-pts">{u.pts}</div>
              <div className="rank-pts-label">Punkte</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12,fontSize:11,color:'var(--muted)',textAlign:'center'}}>
        ⭐ 3P Exakt · ✓ 2P Tendenz+Tor · ~ 1P Tendenz
      </div>
    </div>
  )
}

// ── PROFIL TAB ────────────────────────────────────────────────────────────────
function ProfilTab({ user, profile, onProfileUpdate }) {
  const [name, setName] = useState(profile?.displayName || '')
  const [avatar, setAvatar] = useState(profile?.avatar || '⚽')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    setName(profile?.displayName || '')
    setAvatar(profile?.avatar || '⚽')
  }, [profile])

  async function saveProfile() {
    setMsg(''); setErr('')
    try {
      await setDoc(doc(db, 'users', user.uid), { displayName: name, avatar }, { merge: true })
      await updateProfile(user, { displayName: name })
      onProfileUpdate({ displayName: name, avatar })
      setMsg('Profil gespeichert ✓')
    } catch { setErr('Fehler beim Speichern') }
  }

  async function changePw() {
    setMsg(''); setErr('')
    if (newPw.length < 6) return setErr('Neues Passwort min. 6 Zeichen')
    try {
      const cred = EmailAuthProvider.credential(user.email, oldPw)
      await reauthenticateWithCredential(user, cred)
      await updatePassword(user, newPw)
      setMsg('Passwort geändert ✓')
      setOldPw(''); setNewPw('')
    } catch { setErr('Aktuelles Passwort falsch') }
  }

  return (
    <div>
      <div className="section-title">👤 Profil</div>
      <div className="profile-section">
        <h3>Avatar & Name</h3>
        <div className="profile-card">
          <div className="profile-avatar-big">{avatar}</div>
          <div className="avatar-grid">{AVATARS.map(a => (
            <button key={a} className={`avatar-btn${avatar === a ? ' selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
          ))}</div>
          <div className="field" style={{marginTop:12}}>
            <label>Anzeigename</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" />
          </div>
          {msg && <p className="success-msg">{msg}</p>}
          {err && <p className="err">{err}</p>}
          <button className="save-btn" onClick={saveProfile}>Speichern</button>
        </div>
      </div>
      <div className="profile-section">
        <h3>Passwort ändern</h3>
        <div className="profile-card">
          <div className="field"><label>Aktuelles Passwort</label>
            <div className="pw-wrap">
              <input type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="••••••" />
              <button type="button" className="pw-eye" onClick={() => setShowOld(v => !v)}><Eye show={showOld} /></button>
            </div>
          </div>
          <div className="field"><label>Neues Passwort</label>
            <div className="pw-wrap">
              <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 Zeichen" />
              <button type="button" className="pw-eye" onClick={() => setShowNew(v => !v)}><Eye show={showNew} /></button>
            </div>
          </div>
          <button className="save-btn" onClick={changePw}>Passwort ändern</button>
        </div>
      </div>
    </div>
  )
}

// ── EINLADEN TAB ──────────────────────────────────────────────────────────────
function EinladenTab({ profile }) {
  const [copied, setCopied] = useState(false)
  const code = profile?.inviteCode || '------'
  const url = `${window.location.origin}?code=${code}`

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="section-title">📨 Einladen</div>
      <div className="invite-code-box">
        <div className="invite-code">{code}</div>
        <div className="invite-url">{url}</div>
        <button className="copy-btn" onClick={copy}>{copied ? '✓ Kopiert!' : '🔗 Link kopieren'}</button>
      </div>
      <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.6}}>
        Teile diesen Link oder Code mit Freunden. Sie können sich damit registrieren und der Liga beitreten.
      </p>
    </div>
  )
}

// ── ADMIN TAB ─────────────────────────────────────────────────────────────────
function AdminTab({ results }) {
  const [filter, setFilter] = useState('A')
  const groupKeys = [...Object.keys(GROUPS), 'R32', 'QF', 'SF', 'P3', 'FIN']

  const filtered = MATCHES.filter(m => m.group === filter)

  return (
    <div>
      <div className="section-title">⚙️ Admin</div>
      <div className="group-filter">
        {groupKeys.map(k => (
          <button key={k} className={`filter-btn${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>
            {k === 'R32' ? 'R32' : k === 'QF' ? 'VF' : k === 'SF' ? 'HF' : k === 'P3' ? 'P3' : k === 'FIN' ? 'FIN' : `Gr.${k}`}
          </button>
        ))}
      </div>
      {filtered.map(m => <AdminMatchCard key={m.id} match={m} result={results[m.id]} />)}
    </div>
  )
}

function AdminMatchCard({ match, result }) {
  const [h, setH] = useState(result?.homeGoals ?? '')
  const [a, setA] = useState(result?.awayGoals ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => { setH(result?.homeGoals ?? ''); setA(result?.awayGoals ?? '') }, [result])

  async function save() {
    if (h === '' || a === '') return
    await setDoc(doc(db, 'results', match.id), { homeGoals: +h, awayGoals: +a, matchId: match.id, updatedAt: serverTimestamp() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="admin-match">
      <div className="admin-match-title">{match.home} vs {match.away} · {match.date} {match.time}</div>
      <div className="admin-score-row">
        <input className="admin-input" type="number" min="0" max="99" value={h} onChange={e => setH(e.target.value)} placeholder="–" />
        <span style={{color:'var(--muted)',textAlign:'center'}}>:</span>
        <input className="admin-input" type="number" min="0" max="99" value={a} onChange={e => setA(e.target.value)} placeholder="–" />
        {saved
          ? <span className="saved-badge">✓</span>
          : <button className="save-result-btn" onClick={save}>Speichern</button>
        }
      </div>
    </div>
  )
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [results, setResults] = useState({})
  const [tab, setTab] = useState('tippen')
  const [authMode, setAuthMode] = useState('login')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setAuthUser(u)
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) setProfile(snap.data())
        else setProfile(null)
      } else {
        setProfile(null)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'results'), snap => {
      const r = {}
      snap.docs.forEach(d => { r[d.id] = d.data() })
      setResults(r)
    })
    return unsub
  }, [])

  if (authUser === undefined) return <div className="loading">⚽ Laden…</div>

  if (!authUser) return (
    <div className="auth-wrap">
      <div className="auth-logo">TippLiga WM26</div>
      <div className="auth-sub">Fussball-WM 2026 Tippspiel</div>
      {authMode === 'login'
        ? <LoginForm onSwitch={() => setAuthMode('register')} />
        : <RegisterForm onSwitch={() => setAuthMode('login')} />
      }
    </div>
  )

  if (!authUser.emailVerified) return (
    <div className="auth-wrap">
      <div className="auth-logo">TippLiga WM26</div>
      <div className="verify-wrap">
        <h2>✉️ E-Mail bestätigen</h2>
        <p>Wir haben eine Bestätigungs-E-Mail an <strong>{authUser.email}</strong> gesendet.<br />Bitte klicke auf den Link darin, bevor du dich anmeldest.</p>
        <button className="btn" onClick={async () => { await sendEmailVerification(authUser); alert('E-Mail erneut gesendet!') }}>E-Mail erneut senden</button>
        <button className="btn-ghost" onClick={() => { auth.currentUser?.reload().then(() => setAuthUser({ ...auth.currentUser })); signOut(auth) }}>Abmelden</button>
      </div>
    </div>
  )

  const isAdmin = authUser.email?.toLowerCase() === ADMIN_EMAIL

  const navItems = [
    { id: 'tippen', icon: '🎯', label: 'Tippen' },
    { id: 'rangliste', icon: '🏆', label: 'Rangliste' },
    { id: 'profil', icon: '👤', label: 'Profil' },
    { id: 'einladen', icon: '📨', label: 'Einladen' },
    ...(isAdmin ? [{ id: 'admin', icon: '⚙️', label: 'Admin' }] : []),
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">TippLiga WM26</div>
        <div className="app-user">
          <span className="app-avatar">{profile?.avatar || '⚽'}</span>
          <span className="app-name">{profile?.displayName || authUser.email}</span>
          <button className="logout-btn" onClick={() => signOut(auth)} title="Abmelden">✕</button>
        </div>
      </header>

      <div className="app-content">
        {tab === 'tippen'    && <TippenTab uid={authUser.uid} results={results} />}
        {tab === 'rangliste' && <RanglisteTab uid={authUser.uid} results={results} />}
        {tab === 'profil'    && <ProfilTab user={authUser} profile={profile} onProfileUpdate={p => setProfile(prev => ({ ...prev, ...p }))} />}
        {tab === 'einladen'  && <EinladenTab profile={profile} />}
        {tab === 'admin' && isAdmin && <AdminTab results={results} />}
      </div>

      <nav className="bottom-nav">
        {navItems.map(n => (
          <button key={n.id} className={`nav-btn${tab === n.id ? ' active' : ''}`} onClick={() => setTab(n.id)}>
            <span className="nav-icon">{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
