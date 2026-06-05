import { useState, useEffect, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, signOut, onAuthStateChanged, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential, updateProfile
} from 'firebase/auth'
import {
  getFirestore, doc, setDoc, getDoc, getDocs, collection,
  onSnapshot, serverTimestamp
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
function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase() }
function flagUrl(code) { return `https://flagcdn.com/${code}.svg` }

// ── TEAMS ─────────────────────────────────────────────────────────────────────
const TEAMS = {
  'Mexiko':              { code:'mx', strength:79 },
  'Südafrika':           { code:'za', strength:61 },
  'Südkorea':            { code:'kr', strength:74 },
  'Tschechien':          { code:'cz', strength:72 },
  'Kanada':              { code:'ca', strength:76 },
  'Bosnien-Herzegowina': { code:'ba', strength:67 },
  'Katar':               { code:'qa', strength:60 },
  'Schweiz':             { code:'ch', strength:81 },
  'Brasilien':           { code:'br', strength:87 },
  'Marokko':             { code:'ma', strength:78 },
  'Haiti':               { code:'ht', strength:52 },
  'Schottland':          { code:'gb-sct', strength:71 },
  'USA':                 { code:'us', strength:78 },
  'Paraguay':            { code:'py', strength:67 },
  'Australien':          { code:'au', strength:73 },
  'Türkei':              { code:'tr', strength:76 },
  'Deutschland':         { code:'de', strength:85 },
  'Curaçao':             { code:'cw', strength:48 },
  'Elfenbeinküste':      { code:'ci', strength:71 },
  'Ecuador':             { code:'ec', strength:72 },
  'Niederlande':         { code:'nl', strength:83 },
  'Japan':               { code:'jp', strength:77 },
  'Schweden':            { code:'se', strength:75 },
  'Tunesien':            { code:'tn', strength:66 },
  'Belgien':             { code:'be', strength:80 },
  'Ägypten':             { code:'eg', strength:70 },
  'Iran':                { code:'ir', strength:70 },
  'Neuseeland':          { code:'nz', strength:59 },
  'Spanien':             { code:'es', strength:87 },
  'Kap Verde':           { code:'cv', strength:58 },
  'Saudi-Arabien':       { code:'sa', strength:69 },
  'Uruguay':             { code:'uy', strength:79 },
  'Frankreich':          { code:'fr', strength:90 },
  'Senegal':             { code:'sn', strength:75 },
  'Irak':                { code:'iq', strength:60 },
  'Norwegen':            { code:'no', strength:76 },
  'Argentinien':         { code:'ar', strength:93 },
  'Algerien':            { code:'dz', strength:69 },
  'Österreich':          { code:'at', strength:74 },
  'Jordanien':           { code:'jo', strength:61 },
  'Portugal':            { code:'pt', strength:88 },
  'DR Kongo':            { code:'cd', strength:64 },
  'Usbekistan':          { code:'uz', strength:59 },
  'Kolumbien':           { code:'co', strength:80 },
  'England':             { code:'gb-eng', strength:86 },
  'Kroatien':            { code:'hr', strength:78 },
  'Ghana':               { code:'gh', strength:65 },
  'Panama':              { code:'pa', strength:62 },
}

const TEAM_INFO = {
  'Schweiz':       { coach:'Murat Yakin',       players:['Granit Xhaka','Manuel Akanji','Xherdan Shaqiri','Breel Embolo'] },
  'Deutschland':   { coach:'Julian Nagelsmann', players:['Jamal Musiala','Florian Wirtz','Niclas Füllkrug','Kai Havertz'] },
  'Frankreich':    { coach:'Didier Deschamps',  players:['Kylian Mbappé','Antoine Griezmann','Aurélien Tchouaméni'] },
  'Argentinien':   { coach:'Lionel Scaloni',    players:['Lionel Messi','Rodrigo De Paul','Lautaro Martínez'] },
  'Brasilien':     { coach:'Dorival Júnior',    players:['Vinícius Jr.','Rodrygo','Raphinha','Endrick'] },
  'England':       { coach:'Lee Carsley',       players:['Jude Bellingham','Harry Kane','Bukayo Saka','Phil Foden'] },
  'Spanien':       { coach:'Luis de la Fuente', players:['Pedri','Lamine Yamal','Álvaro Morata','Dani Olmo'] },
  'Portugal':      { coach:'Roberto Martínez',  players:['Cristiano Ronaldo','João Félix','Rafael Leão'] },
  'Niederlande':   { coach:'Ronald Koeman',     players:['Virgil van Dijk','Cody Gakpo','Xavi Simons'] },
  'Belgien':       { coach:'Rudi García',       players:['Kevin De Bruyne','Romelu Lukaku','Leandro Trossard'] },
  'Mexiko':        { coach:'Javier Aguirre',    players:['Hirving Lozano','Raúl Jiménez','Edson Álvarez'] },
  'USA':           { coach:'Mauricio Pochettino',players:['Christian Pulisic','Gio Reyna','Tyler Adams'] },
  'Kanada':        { coach:'Jesse Marsch',      players:['Alphonso Davies','Jonathan David','Tajon Buchanan'] },
  'Marokko':       { coach:'Walid Regragui',    players:['Yassine Bounou','Youssef En-Nesyri','Hakim Ziyech'] },
  'Uruguay':       { coach:'Marcelo Bielsa',    players:['Darwin Núñez','Federico Valverde','Rodrigo Bentancur'] },
  'Kolumbien':     { coach:'Néstor Lorenzo',    players:['Luis Díaz','James Rodríguez','Jhon Durán'] },
  'Japan':         { coach:'Hajime Moriyasu',   players:['Takefusa Kubo','Daichi Kamada','Ritsu Doan'] },
  'Südkorea':      { coach:'Hong Myung-bo',     players:['Son Heung-min','Lee Jae-sung','Hwang Hee-chan'] },
  'Australien':    { coach:'Tony Popovic',      players:['Mathew Leckie','Mitchell Duke','Aaron Mooy'] },
  'Türkei':        { coach:'Vincenzo Montella', players:['Arda Güler','Hakan Çalhanoğlu','Kenan Yıldız'] },
  'Senegal':       { coach:'Aliou Cissé',       players:['Sadio Mané','Édouard Mendy','Idrissa Gueye'] },
  'Norwegen':      { coach:'Ståle Solbakken',   players:['Erling Haaland','Martin Ødegaard','Alexander Sørloth'] },
  'Schweden':      { coach:'Jon Dahl Tomasson', players:['Viktor Gyökeres','Dejan Kulusevski','Alexander Isak'] },
  'Kroatien':      { coach:'Zlatko Dalić',      players:['Luka Modrić','Ivan Perišić','Marcelo Brozović'] },
  'Österreich':    { coach:'Ralf Rangnick',     players:['Marcel Sabitzer','Christoph Baumgartner','Marko Arnautović'] },
  'Saudi-Arabien': { coach:'Roberto Mancini',   players:['Salem Al-Dawsari','Firas Al-Buraikan','Mohammed Al-Owais'] },
  'Katar':         { coach:'Marquez López',     players:['Akram Afif','Almoez Ali','Meshaal Barsham'] },
  'Iran':          { coach:'Amir Ghalenoei',    players:['Mehdi Taremi','Sardar Azmoun','Alireza Jahanbakhsh'] },
}

// ── VENUES ────────────────────────────────────────────────────────────────────
const VENUES = {
  A1:{city:'Mexico City',    stadium:'Estadio Azteca',         cap:87523},
  A2:{city:'Guadalajara',    stadium:'Estadio Akron',          cap:48000},
  A3:{city:'Atlanta',        stadium:'Mercedes-Benz Stadium',  cap:75000},
  A4:{city:'Guadalajara',    stadium:'Estadio Akron',          cap:48000},
  A5:{city:'Mexico City',    stadium:'Estadio Azteca',         cap:87523},
  A6:{city:'Guadalajara',    stadium:'Estadio Akron',          cap:48000},
  B1:{city:'Toronto',        stadium:'BMO Field',              cap:44315},
  B2:{city:'Santa Clara',    stadium:"Levi's Stadium",         cap:71000},
  B3:{city:'Los Angeles',    stadium:'SoFi Stadium',           cap:70000},
  B4:{city:'Vancouver',      stadium:'BC Place',               cap:54000},
  B5:{city:'Vancouver',      stadium:'BC Place',               cap:54000},
  B6:{city:'Seattle',        stadium:'Lumen Field',            cap:69000},
  C1:{city:'East Rutherford',stadium:'MetLife Stadium',        cap:78576},
  C2:{city:'Foxborough',     stadium:'Gillette Stadium',       cap:65000},
  C3:{city:'Foxborough',     stadium:'Gillette Stadium',       cap:65000},
  C4:{city:'Philadelphia',   stadium:'Lincoln Financial Field',cap:69000},
  C5:{city:'Miami Gardens',  stadium:'Hard Rock Stadium',      cap:65000},
  C6:{city:'Atlanta',        stadium:'Mercedes-Benz Stadium',  cap:75000},
  D1:{city:'Los Angeles',    stadium:'SoFi Stadium',           cap:70000},
  D2:{city:'Vancouver',      stadium:'BC Place',               cap:54000},
  D3:{city:'Seattle',        stadium:'Lumen Field',            cap:69000},
  D4:{city:'Santa Clara',    stadium:"Levi's Stadium",         cap:71000},
  D5:{city:'Los Angeles',    stadium:'SoFi Stadium',           cap:70000},
  D6:{city:'Santa Clara',    stadium:"Levi's Stadium",         cap:71000},
  E1:{city:'Houston',        stadium:'NRG Stadium',            cap:72000},
  E2:{city:'Philadelphia',   stadium:'Lincoln Financial Field',cap:69000},
  E3:{city:'Toronto',        stadium:'BMO Field',              cap:44315},
  E4:{city:'Kansas City',    stadium:'Arrowhead Stadium',      cap:73000},
  E5:{city:'East Rutherford',stadium:'MetLife Stadium',        cap:78576},
  E6:{city:'Philadelphia',   stadium:'Lincoln Financial Field',cap:69000},
  F1:{city:'Arlington TX',   stadium:"AT&T Stadium",          cap:94000},
  F2:{city:'Guadalajara',    stadium:'Estadio Akron',          cap:48000},
  F3:{city:'Houston',        stadium:'NRG Stadium',            cap:72000},
  F4:{city:'Guadalajara',    stadium:'Estadio Akron',          cap:48000},
  F5:{city:'Arlington TX',   stadium:"AT&T Stadium",          cap:94000},
  F6:{city:'Kansas City',    stadium:'Arrowhead Stadium',      cap:73000},
  G1:{city:'Seattle',        stadium:'Lumen Field',            cap:69000},
  G2:{city:'Los Angeles',    stadium:'SoFi Stadium',           cap:70000},
  G3:{city:'Los Angeles',    stadium:'SoFi Stadium',           cap:70000},
  G4:{city:'Vancouver',      stadium:'BC Place',               cap:54000},
  G5:{city:'Seattle',        stadium:'Lumen Field',            cap:69000},
  G6:{city:'Vancouver',      stadium:'BC Place',               cap:54000},
  H1:{city:'Atlanta',        stadium:'Mercedes-Benz Stadium',  cap:75000},
  H2:{city:'Miami Gardens',  stadium:'Hard Rock Stadium',      cap:65000},
  H3:{city:'Atlanta',        stadium:'Mercedes-Benz Stadium',  cap:75000},
  H4:{city:'Miami Gardens',  stadium:'Hard Rock Stadium',      cap:65000},
  H5:{city:'Houston',        stadium:'NRG Stadium',            cap:72000},
  H6:{city:'Guadalajara',    stadium:'Estadio Akron',          cap:48000},
  I1:{city:'East Rutherford',stadium:'MetLife Stadium',        cap:78576},
  I2:{city:'Foxborough',     stadium:'Gillette Stadium',       cap:65000},
  I3:{city:'Philadelphia',   stadium:'Lincoln Financial Field',cap:69000},
  I4:{city:'East Rutherford',stadium:'MetLife Stadium',        cap:78576},
  I5:{city:'Foxborough',     stadium:'Gillette Stadium',       cap:65000},
  I6:{city:'Toronto',        stadium:'BMO Field',              cap:44315},
  J1:{city:'Kansas City',    stadium:'Arrowhead Stadium',      cap:73000},
  J2:{city:'Santa Clara',    stadium:"Levi's Stadium",         cap:71000},
  J3:{city:'Arlington TX',   stadium:"AT&T Stadium",          cap:94000},
  J4:{city:'Santa Clara',    stadium:"Levi's Stadium",         cap:71000},
  J5:{city:'Kansas City',    stadium:'Arrowhead Stadium',      cap:73000},
  J6:{city:'Arlington TX',   stadium:"AT&T Stadium",          cap:94000},
  K1:{city:'Houston',        stadium:'NRG Stadium',            cap:72000},
  K2:{city:'Mexico City',    stadium:'Estadio Azteca',         cap:87523},
  K3:{city:'Houston',        stadium:'NRG Stadium',            cap:72000},
  K4:{city:'Guadalajara',    stadium:'Estadio Akron',          cap:48000},
  K5:{city:'Miami Gardens',  stadium:'Hard Rock Stadium',      cap:65000},
  K6:{city:'Atlanta',        stadium:'Mercedes-Benz Stadium',  cap:75000},
  L1:{city:'Arlington TX',   stadium:"AT&T Stadium",          cap:94000},
  L2:{city:'Toronto',        stadium:'BMO Field',              cap:44315},
  L3:{city:'Foxborough',     stadium:'Gillette Stadium',       cap:65000},
  L4:{city:'Toronto',        stadium:'BMO Field',              cap:44315},
  L5:{city:'East Rutherford',stadium:'MetLife Stadium',        cap:78576},
  L6:{city:'Philadelphia',   stadium:'Lincoln Financial Field',cap:69000},
}

// ── GROUPS ────────────────────────────────────────────────────────────────────
const GROUPS = {
  A:['Mexiko','Südafrika','Südkorea','Tschechien'],
  B:['Kanada','Bosnien-Herzegowina','Katar','Schweiz'],
  C:['Brasilien','Marokko','Haiti','Schottland'],
  D:['USA','Paraguay','Australien','Türkei'],
  E:['Deutschland','Curaçao','Elfenbeinküste','Ecuador'],
  F:['Niederlande','Japan','Schweden','Tunesien'],
  G:['Belgien','Ägypten','Iran','Neuseeland'],
  H:['Spanien','Kap Verde','Saudi-Arabien','Uruguay'],
  I:['Frankreich','Senegal','Irak','Norwegen'],
  J:['Argentinien','Algerien','Österreich','Jordanien'],
  K:['Portugal','DR Kongo','Usbekistan','Kolumbien'],
  L:['England','Kroatien','Ghana','Panama'],
}

// ── MATCHES ───────────────────────────────────────────────────────────────────
const MATCHES = [
  {id:'A1',group:'A',home:'Mexiko',away:'Südafrika',date:'11.06.2026',time:'21:00'},
  {id:'A2',group:'A',home:'Südkorea',away:'Tschechien',date:'12.06.2026',time:'04:00'},
  {id:'A3',group:'A',home:'Tschechien',away:'Südafrika',date:'18.06.2026',time:'18:00'},
  {id:'A4',group:'A',home:'Mexiko',away:'Südkorea',date:'19.06.2026',time:'03:00'},
  {id:'A5',group:'A',home:'Tschechien',away:'Mexiko',date:'25.06.2026',time:'03:00'},
  {id:'A6',group:'A',home:'Südafrika',away:'Südkorea',date:'25.06.2026',time:'03:00'},
  {id:'B1',group:'B',home:'Kanada',away:'Bosnien-Herzegowina',date:'12.06.2026',time:'21:00'},
  {id:'B2',group:'B',home:'Katar',away:'Schweiz',date:'13.06.2026',time:'21:00'},
  {id:'B3',group:'B',home:'Schweiz',away:'Bosnien-Herzegowina',date:'18.06.2026',time:'21:00'},
  {id:'B4',group:'B',home:'Kanada',away:'Katar',date:'19.06.2026',time:'00:00'},
  {id:'B5',group:'B',home:'Schweiz',away:'Kanada',date:'24.06.2026',time:'21:00'},
  {id:'B6',group:'B',home:'Bosnien-Herzegowina',away:'Katar',date:'24.06.2026',time:'21:00'},
  {id:'C1',group:'C',home:'Brasilien',away:'Marokko',date:'14.06.2026',time:'00:00'},
  {id:'C2',group:'C',home:'Haiti',away:'Schottland',date:'14.06.2026',time:'03:00'},
  {id:'C3',group:'C',home:'Schottland',away:'Marokko',date:'20.06.2026',time:'00:00'},
  {id:'C4',group:'C',home:'Brasilien',away:'Haiti',date:'20.06.2026',time:'03:00'},
  {id:'C5',group:'C',home:'Schottland',away:'Brasilien',date:'25.06.2026',time:'00:00'},
  {id:'C6',group:'C',home:'Marokko',away:'Haiti',date:'25.06.2026',time:'00:00'},
  {id:'D1',group:'D',home:'USA',away:'Paraguay',date:'13.06.2026',time:'03:00'},
  {id:'D2',group:'D',home:'Australien',away:'Türkei',date:'14.06.2026',time:'06:00'},
  {id:'D3',group:'D',home:'USA',away:'Australien',date:'19.06.2026',time:'21:00'},
  {id:'D4',group:'D',home:'Türkei',away:'Paraguay',date:'20.06.2026',time:'06:00'},
  {id:'D5',group:'D',home:'Türkei',away:'USA',date:'26.06.2026',time:'04:00'},
  {id:'D6',group:'D',home:'Paraguay',away:'Australien',date:'26.06.2026',time:'04:00'},
  {id:'E1',group:'E',home:'Deutschland',away:'Curaçao',date:'14.06.2026',time:'19:00'},
  {id:'E2',group:'E',home:'Elfenbeinküste',away:'Ecuador',date:'15.06.2026',time:'01:00'},
  {id:'E3',group:'E',home:'Deutschland',away:'Elfenbeinküste',date:'20.06.2026',time:'22:00'},
  {id:'E4',group:'E',home:'Ecuador',away:'Curaçao',date:'21.06.2026',time:'02:00'},
  {id:'E5',group:'E',home:'Ecuador',away:'Deutschland',date:'25.06.2026',time:'22:00'},
  {id:'E6',group:'E',home:'Curaçao',away:'Elfenbeinküste',date:'25.06.2026',time:'22:00'},
  {id:'F1',group:'F',home:'Niederlande',away:'Japan',date:'14.06.2026',time:'22:00'},
  {id:'F2',group:'F',home:'Schweden',away:'Tunesien',date:'15.06.2026',time:'04:00'},
  {id:'F3',group:'F',home:'Niederlande',away:'Schweden',date:'20.06.2026',time:'19:00'},
  {id:'F4',group:'F',home:'Tunesien',away:'Japan',date:'21.06.2026',time:'06:00'},
  {id:'F5',group:'F',home:'Japan',away:'Schweden',date:'26.06.2026',time:'01:00'},
  {id:'F6',group:'F',home:'Tunesien',away:'Niederlande',date:'26.06.2026',time:'01:00'},
  {id:'G1',group:'G',home:'Belgien',away:'Ägypten',date:'16.06.2026',time:'00:00'},
  {id:'G2',group:'G',home:'Iran',away:'Neuseeland',date:'16.06.2026',time:'06:00'},
  {id:'G3',group:'G',home:'Belgien',away:'Iran',date:'21.06.2026',time:'21:00'},
  {id:'G4',group:'G',home:'Neuseeland',away:'Ägypten',date:'22.06.2026',time:'03:00'},
  {id:'G5',group:'G',home:'Ägypten',away:'Iran',date:'27.06.2026',time:'05:00'},
  {id:'G6',group:'G',home:'Neuseeland',away:'Belgien',date:'27.06.2026',time:'05:00'},
  {id:'H1',group:'H',home:'Spanien',away:'Kap Verde',date:'15.06.2026',time:'19:00'},
  {id:'H2',group:'H',home:'Saudi-Arabien',away:'Uruguay',date:'16.06.2026',time:'00:00'},
  {id:'H3',group:'H',home:'Spanien',away:'Saudi-Arabien',date:'21.06.2026',time:'18:00'},
  {id:'H4',group:'H',home:'Uruguay',away:'Kap Verde',date:'22.06.2026',time:'00:00'},
  {id:'H5',group:'H',home:'Kap Verde',away:'Saudi-Arabien',date:'27.06.2026',time:'02:00'},
  {id:'H6',group:'H',home:'Uruguay',away:'Spanien',date:'27.06.2026',time:'02:00'},
  {id:'I1',group:'I',home:'Frankreich',away:'Senegal',date:'16.06.2026',time:'21:00'},
  {id:'I2',group:'I',home:'Irak',away:'Norwegen',date:'17.06.2026',time:'00:00'},
  {id:'I3',group:'I',home:'Frankreich',away:'Irak',date:'22.06.2026',time:'23:00'},
  {id:'I4',group:'I',home:'Norwegen',away:'Senegal',date:'23.06.2026',time:'02:00'},
  {id:'I5',group:'I',home:'Norwegen',away:'Frankreich',date:'26.06.2026',time:'21:00'},
  {id:'I6',group:'I',home:'Senegal',away:'Irak',date:'26.06.2026',time:'21:00'},
  {id:'J1',group:'J',home:'Argentinien',away:'Algerien',date:'17.06.2026',time:'03:00'},
  {id:'J2',group:'J',home:'Österreich',away:'Jordanien',date:'17.06.2026',time:'06:00'},
  {id:'J3',group:'J',home:'Argentinien',away:'Österreich',date:'22.06.2026',time:'19:00'},
  {id:'J4',group:'J',home:'Jordanien',away:'Algerien',date:'23.06.2026',time:'05:00'},
  {id:'J5',group:'J',home:'Algerien',away:'Österreich',date:'28.06.2026',time:'04:00'},
  {id:'J6',group:'J',home:'Jordanien',away:'Argentinien',date:'28.06.2026',time:'04:00'},
  {id:'K1',group:'K',home:'Portugal',away:'DR Kongo',date:'17.06.2026',time:'19:00'},
  {id:'K2',group:'K',home:'Usbekistan',away:'Kolumbien',date:'18.06.2026',time:'04:00'},
  {id:'K3',group:'K',home:'Portugal',away:'Usbekistan',date:'23.06.2026',time:'19:00'},
  {id:'K4',group:'K',home:'Kolumbien',away:'DR Kongo',date:'24.06.2026',time:'04:00'},
  {id:'K5',group:'K',home:'Kolumbien',away:'Portugal',date:'28.06.2026',time:'01:30'},
  {id:'K6',group:'K',home:'DR Kongo',away:'Usbekistan',date:'28.06.2026',time:'01:30'},
  {id:'L1',group:'L',home:'England',away:'Kroatien',date:'17.06.2026',time:'22:00'},
  {id:'L2',group:'L',home:'Ghana',away:'Panama',date:'18.06.2026',time:'01:00'},
  {id:'L3',group:'L',home:'England',away:'Ghana',date:'23.06.2026',time:'22:00'},
  {id:'L4',group:'L',home:'Panama',away:'Kroatien',date:'24.06.2026',time:'01:00'},
  {id:'L5',group:'L',home:'Panama',away:'England',date:'27.06.2026',time:'23:00'},
  {id:'L6',group:'L',home:'Kroatien',away:'Ghana',date:'27.06.2026',time:'23:00'},
  // Sechzehntelfinale
  {id:'R32_1', group:'R32',home:'1A',away:'2B',date:'29.06.2026',time:'21:00'},
  {id:'R32_2', group:'R32',home:'1C',away:'2D',date:'29.06.2026',time:'21:00'},
  {id:'R32_3', group:'R32',home:'1B',away:'2A',date:'30.06.2026',time:'18:00'},
  {id:'R32_4', group:'R32',home:'1D',away:'2C',date:'30.06.2026',time:'21:00'},
  {id:'R32_5', group:'R32',home:'1E',away:'2F',date:'01.07.2026',time:'18:00'},
  {id:'R32_6', group:'R32',home:'1G',away:'2H',date:'01.07.2026',time:'21:00'},
  {id:'R32_7', group:'R32',home:'1F',away:'2E',date:'02.07.2026',time:'18:00'},
  {id:'R32_8', group:'R32',home:'1H',away:'2G',date:'02.07.2026',time:'21:00'},
  {id:'R32_9', group:'R32',home:'1I',away:'2J',date:'03.07.2026',time:'18:00'},
  {id:'R32_10',group:'R32',home:'1K',away:'2L',date:'03.07.2026',time:'21:00'},
  {id:'R32_11',group:'R32',home:'1J',away:'2I',date:'04.07.2026',time:'18:00'},
  {id:'R32_12',group:'R32',home:'1L',away:'2K',date:'04.07.2026',time:'21:00'},
  {id:'R32_13',group:'R32',home:'Bester 3. (B/E/F/I)',away:'Bester 3. (A/C/D)',date:'05.07.2026',time:'18:00'},
  {id:'R32_14',group:'R32',home:'Bester 3. (G/H/K/L)',away:'Bester 3. (E/F/G/H)',date:'05.07.2026',time:'21:00'},
  {id:'R32_15',group:'R32',home:'Bester 3. (A/B/C/D)',away:'Bester 3. (I/J/K/L)',date:'06.07.2026',time:'18:00'},
  {id:'R32_16',group:'R32',home:'Bester 3. (J/K/L)',away:'Bester 3. (G/H/I/J)',date:'06.07.2026',time:'21:00'},
  // Viertelfinale
  {id:'QF1',group:'QF',home:'Sieger R32_1',away:'Sieger R32_2',date:'09.07.2026',time:'21:00'},
  {id:'QF2',group:'QF',home:'Sieger R32_3',away:'Sieger R32_4',date:'09.07.2026',time:'21:00'},
  {id:'QF3',group:'QF',home:'Sieger R32_5',away:'Sieger R32_6',date:'10.07.2026',time:'21:00'},
  {id:'QF4',group:'QF',home:'Sieger R32_7',away:'Sieger R32_8',date:'10.07.2026',time:'21:00'},
  {id:'QF5',group:'QF',home:'Sieger R32_9',away:'Sieger R32_10',date:'11.07.2026',time:'21:00'},
  {id:'QF6',group:'QF',home:'Sieger R32_11',away:'Sieger R32_12',date:'11.07.2026',time:'21:00'},
  {id:'QF7',group:'QF',home:'Sieger R32_13',away:'Sieger R32_14',date:'12.07.2026',time:'21:00'},
  {id:'QF8',group:'QF',home:'Sieger R32_15',away:'Sieger R32_16',date:'12.07.2026',time:'21:00'},
  // Halbfinale
  {id:'SF1',group:'SF',home:'Sieger QF1',away:'Sieger QF2',date:'14.07.2026',time:'21:00'},
  {id:'SF2',group:'SF',home:'Sieger QF3',away:'Sieger QF4',date:'14.07.2026',time:'21:00'},
  {id:'SF3',group:'SF',home:'Sieger QF5',away:'Sieger QF6',date:'15.07.2026',time:'21:00'},
  {id:'SF4',group:'SF',home:'Sieger QF7',away:'Sieger QF8',date:'15.07.2026',time:'21:00'},
  {id:'P3', group:'P3', home:'Verlierer SF1/SF2',away:'Verlierer SF3/SF4',date:'18.07.2026',time:'21:00'},
  {id:'FIN',group:'FIN',home:'Sieger SF1/SF2',away:'Sieger SF3/SF4',date:'19.07.2026',time:'21:00'},
]

// ── HELPERS ───────────────────────────────────────────────────────────────────
function parseMatchDate(m) {
  const [d,mo,y] = m.date.split('.'), [h,min] = m.time.split(':')
  return new Date(+y,+mo-1,+d,+h,+min)
}
function calcPoints(tip, result) {
  if (!result||result.homeGoals==null||result.awayGoals==null) return null
  const th=tip.homeGoals,ta=tip.awayGoals,rh=result.homeGoals,ra=result.awayGoals
  if(th===rh&&ta===ra) return 3
  const tt=Math.sign(th-ta),rt=Math.sign(rh-ra)
  if(tt===rt) return (th===rh||ta===ra)?2:1
  return 0
}
function ptsLabel(pts) {
  if(pts===3) return <span className="pts-3">⭐ 3 Pkt</span>
  if(pts===2) return <span className="pts-2">✓ 2 Pkt</span>
  if(pts===1) return <span className="pts-1">~ 1 Pkt</span>
  if(pts===0) return <span className="pts-0">✗ 0 Pkt</span>
  return null
}
function strengthColor(s) {
  if(s>=87) return '#D4AF37'
  if(s>=80) return '#4ade80'
  if(s>=72) return '#60a5fa'
  if(s>=63) return '#fb923c'
  return '#9ca3af'
}
function calcStandings(group, results) {
  const teams = GROUPS[group]
  const stats = {}
  teams.forEach(t => { stats[t]={sp:0,s:0,u:0,n:0,gf:0,ga:0,pts:0} })
  MATCHES.filter(m=>m.group===group).forEach(m=>{
    const r=results[m.id]
    if(!r||r.homeGoals==null) return
    const h=stats[m.home],a=stats[m.away]
    h.sp++;a.sp++
    h.gf+=r.homeGoals;h.ga+=r.awayGoals
    a.gf+=r.awayGoals;a.ga+=r.homeGoals
    if(r.homeGoals>r.awayGoals){h.s++;h.pts+=3;a.n++}
    else if(r.homeGoals<r.awayGoals){a.s++;a.pts+=3;h.n++}
    else{h.u++;h.pts++;a.u++;a.pts++}
  })
  return teams.map(t=>({name:t,...stats[t],gd:stats[t].gf-stats[t].ga}))
    .sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf)
}

// ── SVG EYE ───────────────────────────────────────────────────────────────────
function Eye({show}){
  return show
    ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}

// ── TEAM FLAG CELL ────────────────────────────────────────────────────────────
function TeamCell({name, align='left', onClick}) {
  const t = TEAMS[name]||{code:null,strength:0}
  const sc = strengthColor(t.strength)
  const flag = t.code
    ? <img src={flagUrl(t.code)} className="team-flag-img" alt={name} loading="lazy" onClick={onClick} style={{cursor:'pointer'}} />
    : null
  const badge = <span className="str-badge" style={{background:sc+'22',color:sc}}>{t.strength}</span>
  const nameEl = <span className="team-cell-name" onClick={onClick} style={{cursor:'pointer'}}>{name}</span>
  return (
    <div className={`team-cell ${align}`}>
      {align==='left'  && <>{flag}{nameEl}{badge}</>}
      {align==='right' && <>{badge}{nameEl}{flag}</>}
    </div>
  )
}

// ── TEAM MODAL ────────────────────────────────────────────────────────────────
function TeamModal({team, onClose, results}) {
  const t = TEAMS[team]||{}
  const info = TEAM_INFO[team]||{}
  const sc = strengthColor(t.strength||0)
  const teamMatches = MATCHES.filter(m=>m.home===team||m.away===team)
  const stats = teamMatches.reduce((s,m)=>{
    const r=results[m.id]; if(!r||r.homeGoals==null) return s
    const isH=m.home===team
    const gf=isH?r.homeGoals:r.awayGoals, ga=isH?r.awayGoals:r.homeGoals
    const diff=gf-ga
    return {...s,sp:s.sp+1,gf:s.gf+gf,ga:s.ga+ga,s:s.s+(diff>0?1:0),u:s.u+(diff===0?1:0),n:s.n+(diff<0?1:0)}
  },{sp:0,gf:0,ga:0,s:0,u:0,n:0})

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-head">
          {t.code && <img src={flagUrl(t.code)} className="modal-flag" alt={team} />}
          <div>
            <h2 className="modal-team-name">{team}</h2>
            <span className="modal-strength" style={{color:sc}}>Stärke: {t.strength}/100</span>
          </div>
        </div>
        <div className="modal-str-bar">
          <div className="modal-str-fill" style={{width:`${t.strength}%`,background:sc}} />
        </div>
        {stats.sp>0 && (
          <div className="modal-stats">
            <div className="modal-stats-title">WM-Statistik</div>
            <div className="stat-grid">
              <div className="stat-item"><div className="stat-val">{stats.sp}</div><div className="stat-lbl">Spiele</div></div>
              <div className="stat-item"><div className="stat-val">{stats.s}</div><div className="stat-lbl">Siege</div></div>
              <div className="stat-item"><div className="stat-val">{stats.u}</div><div className="stat-lbl">Unentsch.</div></div>
              <div className="stat-item"><div className="stat-val">{stats.n}</div><div className="stat-lbl">Niederl.</div></div>
              <div className="stat-item"><div className="stat-val">{stats.gf}</div><div className="stat-lbl">Tore</div></div>
              <div className="stat-item"><div className="stat-val">{stats.ga}</div><div className="stat-lbl">Gegentore</div></div>
            </div>
          </div>
        )}
        {info.coach && <div className="modal-coach">👨‍💼 <strong>Trainer:</strong> {info.coach}</div>}
        {info.players && (
          <div className="modal-players">
            <div className="modal-players-title">⭐ Schlüsselspieler</div>
            <div className="players-list">
              {info.players.map(p=><span key={p} className="player-chip">{p}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── GROUP TABLE ───────────────────────────────────────────────────────────────
function GroupTable({group, results, onTeamClick}) {
  const standings = calcStandings(group, results)
  return (
    <div className="group-table">
      <div className="gt-head">
        <span className="gt-c gt-pos">#</span>
        <span className="gt-c gt-team-h">Mannschaft</span>
        <span className="gt-c">Sp</span>
        <span className="gt-c">S</span>
        <span className="gt-c">U</span>
        <span className="gt-c">N</span>
        <span className="gt-c">Tore</span>
        <span className="gt-c gt-diff">+/-</span>
        <span className="gt-c gt-pts">Pkt</span>
      </div>
      {standings.map((s,i)=>(
        <div key={s.name} className={`gt-row${i<2?' qualifies':i===2?' maybe':''}`} onClick={()=>onTeamClick(s.name)}>
          <span className="gt-c gt-pos gt-pos-num">{i+1}</span>
          <span className="gt-c gt-team-cell">
            {TEAMS[s.name]?.code && <img src={flagUrl(TEAMS[s.name].code)} className="gt-flag" alt={s.name} />}
            <span className="gt-name">{s.name}</span>
          </span>
          <span className="gt-c">{s.sp}</span>
          <span className="gt-c gt-s">{s.s}</span>
          <span className="gt-c">{s.u}</span>
          <span className="gt-c gt-n">{s.n}</span>
          <span className="gt-c gt-goals">{s.gf}:{s.ga}</span>
          <span className="gt-c gt-diff-val" style={{color:s.gd>0?'var(--green)':s.gd<0?'var(--red)':'var(--muted)'}}>
            {s.gd>0?'+':''}{s.gd}
          </span>
          <span className="gt-c gt-pts-val">{s.pts}</span>
        </div>
      ))}
      <div className="gt-legend">
        <span className="legend-q">■</span> Qualifiziert &nbsp;
        <span className="legend-m">■</span> Evtl. weiter
      </div>
    </div>
  )
}

// ── MATCH CARD ────────────────────────────────────────────────────────────────
function MatchCard({match, tip, result, now, onSave, onTeamClick, compact=false}) {
  const kickoff = parseMatchDate(match)
  const locked = now >= kickoff
  const isKo = !TEAMS[match.home]
  const [h, setH] = useState(tip?.homeGoals??'')
  const [a, setA] = useState(tip?.awayGoals??'')
  const pts = (result&&tip) ? calcPoints(tip,result) : null
  const venue = VENUES[match.id]

  useEffect(()=>{setH(tip?.homeGoals??''); setA(tip?.awayGoals??'')},[tip])
  function handleBlur(){if(h!==''&&a!=='') onSave(match.id,h,a)}

  return (
    <div className={`match-card${result?' has-result':''}${locked?' locked':''}`}>
      <div className="match-meta">
        {match.date} · {match.time} CEST
        {venue && !compact && <span className="match-venue"> · 🏟️ {venue.stadium}, {venue.city} ({venue.cap.toLocaleString()})</span>}
      </div>
      <div className="match-row">
        {isKo
          ? <div className="team-cell left ko-team"><span className="team-cell-name">{match.home}</span></div>
          : <TeamCell name={match.home} align="left" onClick={()=>onTeamClick&&onTeamClick(match.home)} />
        }
        <div className="match-center-col">
          {result
            ? <div className="result-score">{result.homeGoals}<span className="score-sep">:</span>{result.awayGoals}</div>
            : locked
              ? <div className="tip-locked-score">{tip!=null?`${tip.homeGoals}:${tip.awayGoals}`:'?:?'}</div>
              : <div className="tip-inputs-row">
                  <input className="tip-inp" type="number" min="0" max="99" value={h} onChange={e=>setH(e.target.value)} onBlur={handleBlur} placeholder="–" />
                  <span className="score-sep-input">:</span>
                  <input className="tip-inp" type="number" min="0" max="99" value={a} onChange={e=>setA(e.target.value)} onBlur={handleBlur} placeholder="–" />
                </div>
          }
          {pts!=null && <div className="pts-row">{ptsLabel(pts)}</div>}
          {locked&&pts==null&&!result&&tip==null && <div className="no-tip-label">kein Tipp</div>}
          {!locked&&tip!=null&&h!=='' && <div className="saved-tick">✓</div>}
        </div>
        {isKo
          ? <div className="team-cell right ko-team"><span className="team-cell-name">{match.away}</span></div>
          : <TeamCell name={match.away} align="right" onClick={()=>onTeamClick&&onTeamClick(match.away)} />
        }
      </div>
    </div>
  )
}

// ── NEXT MATCH COUNTDOWN ──────────────────────────────────────────────────────
function Countdown({kickoff}) {
  const [txt, setTxt] = useState('')
  useEffect(()=>{
    const tick=()=>{
      const diff=kickoff-new Date()
      if(diff<=0){setTxt('Läuft jetzt!');return}
      const d=Math.floor(diff/86400000), h=Math.floor((diff%86400000)/3600000),
            m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000)
      setTxt(d>0?`${d}T ${h}h ${m}m`:`${h}h ${m}m ${s}s`)
    }
    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id)
  },[kickoff])
  return <span className="countdown-txt">{txt}</span>
}

// ── NEXT VIEW ─────────────────────────────────────────────────────────────────
function NextView({tips, results, now, uid, onSave, onTeamClick}) {
  const upcoming = MATCHES
    .filter(m=>!['R32','QF','SF','P3','FIN'].includes(m.group))
    .map(m=>({...m,kickoff:parseMatchDate(m)}))
    .filter(m=>m.kickoff>now)
    .sort((a,b)=>a.kickoff-b.kickoff)
  if(!upcoming.length) return <p style={{color:'var(--muted)',textAlign:'center',padding:20}}>Alle Spiele sind abgeschlossen.</p>
  const nextTs = upcoming[0].kickoff.getTime()
  const concurrent = upcoming.filter(m=>m.kickoff.getTime()===nextTs)

  return (
    <div>
      <div className="next-header">
        <span className="next-label">⚡ Nächste Spiele</span>
        <Countdown kickoff={upcoming[0].kickoff} />
      </div>
      {concurrent.length>1 && (
        <div className="concurrent-note">
          ℹ️ {concurrent.length} Spiele gleichzeitig · {upcoming[0].date} · {upcoming[0].time} CEST
        </div>
      )}
      {concurrent.map(m=>{
        const venue=VENUES[m.id]
        return (
          <div key={m.id} className="next-match-card">
            <div className="next-match-top">
              <span className="next-group-badge">Gruppe {m.group}</span>
              {venue && <span className="next-venue">🏟 {venue.stadium} · {venue.city} · {venue.cap.toLocaleString()} Plätze</span>}
            </div>
            <div className="next-teams-row">
              <div className="next-team" onClick={()=>onTeamClick&&onTeamClick(m.home)}>
                {TEAMS[m.home]?.code && <img src={flagUrl(TEAMS[m.home].code)} className="next-flag" alt={m.home} />}
                <span className="next-team-name">{m.home}</span>
                <span className="next-str" style={{color:strengthColor(TEAMS[m.home]?.strength||0)}}>{TEAMS[m.home]?.strength}</span>
              </div>
              <div className="next-vs-col">
                <div className="next-vs">VS</div>
                <div className="next-time">{m.time} CEST</div>
              </div>
              <div className="next-team right" onClick={()=>onTeamClick&&onTeamClick(m.away)}>
                <span className="next-str" style={{color:strengthColor(TEAMS[m.away]?.strength||0)}}>{TEAMS[m.away]?.strength}</span>
                <span className="next-team-name">{m.away}</span>
                {TEAMS[m.away]?.code && <img src={flagUrl(TEAMS[m.away].code)} className="next-flag" alt={m.away} />}
              </div>
            </div>
            <MatchCard match={m} tip={tips[m.id]} result={results[m.id]} now={now} onSave={onSave} onTeamClick={onTeamClick} compact />
          </div>
        )
      })}
      {upcoming.length>concurrent.length && (
        <div className="upcoming-section">
          <div className="upcoming-title">Weitere bevorstehende Spiele</div>
          {upcoming.slice(concurrent.length, concurrent.length+6).map(m=>(
            <MatchCard key={m.id} match={m} tip={tips[m.id]} result={results[m.id]} now={now} onSave={onSave} onTeamClick={onTeamClick} compact />
          ))}
        </div>
      )}
    </div>
  )
}

// ── GROUP VIEW ────────────────────────────────────────────────────────────────
function GroupView({group, tips, results, now, onSave, onTeamClick}) {
  const groupMatches = MATCHES.filter(m=>m.group===group)
  const upcoming = groupMatches.filter(m=>parseMatchDate(m)>now)
  const played = groupMatches.filter(m=>results[m.id]&&results[m.id].homeGoals!=null)
  return (
    <div>
      <GroupTable group={group} results={results} onTeamClick={onTeamClick} />
      {played.length>0 && (
        <div className="matches-section">
          <div className="matches-section-title">Gespielte Spiele</div>
          {played.map(m=><MatchCard key={m.id} match={m} tip={tips[m.id]} result={results[m.id]} now={now} onSave={onSave} onTeamClick={onTeamClick} />)}
        </div>
      )}
      {upcoming.length>0 && (
        <div className="matches-section">
          <div className="matches-section-title">Nächste Spiele</div>
          {upcoming.map(m=><MatchCard key={m.id} match={m} tip={tips[m.id]} result={results[m.id]} now={now} onSave={onSave} onTeamClick={onTeamClick} />)}
        </div>
      )}
    </div>
  )
}

// ── KO VIEW ───────────────────────────────────────────────────────────────────
function KoView({koGroup, tips, results, now, onSave, onTeamClick}) {
  const koLabels={R32:'⚡ Sechzehntelfinale',QF:'🏆 Viertelfinale',SF:'🔥 Halbfinale',P3:'🥉 Platz 3',FIN:'🥇 Finale'}
  const matches = MATCHES.filter(m=>m.group===koGroup)
  return (
    <div>
      <div className="ko-section-title">{koLabels[koGroup]||koGroup}</div>
      {matches.map(m=><MatchCard key={m.id} match={m} tip={tips[m.id]} result={results[m.id]} now={now} onSave={onSave} onTeamClick={onTeamClick} />)}
    </div>
  )
}

// ── TIPPEN TAB ────────────────────────────────────────────────────────────────
function TippenTab({uid, results}) {
  const [tips, setTips] = useState({})
  const [filter, setFilter] = useState('NEXT')
  const [selectedTeam, setSelectedTeam] = useState(null)
  const sliderRef = useRef(null)
  const now = new Date()

  useEffect(()=>{
    if(!uid) return
    const unsub = onSnapshot(collection(db,'tips'), snap=>{
      const t={}
      snap.docs.forEach(d=>{const data=d.data(); if(data.uid===uid) t[data.matchId]=data})
      setTips(t)
    })
    return unsub
  },[uid])

  async function saveTip(matchId, homeGoals, awayGoals) {
    if(homeGoals===''||awayGoals==='') return
    await setDoc(doc(db,'tips',`${uid}__${matchId}`),{uid,matchId,homeGoals:+homeGoals,awayGoals:+awayGoals,updatedAt:serverTimestamp()})
  }

  const filterItems = [
    {id:'NEXT', label:'⚡ Nächste'},
    ...Object.keys(GROUPS).map(g=>({id:g, label:`Gr. ${g}`})),
    {id:'R32', label:'Sechzehntelfinale'},
    {id:'QF',  label:'Viertelfinale'},
    {id:'SF',  label:'Halbfinale'},
    {id:'P3',  label:'Platz 3'},
    {id:'FIN', label:'Finale'},
  ]

  return (
    <div>
      {/* Horizontal scroll slider */}
      <div className="group-filter-slider" ref={sliderRef}>
        {filterItems.map(f=>(
          <button key={f.id} className={`filter-btn${filter===f.id?' active':''}`} onClick={()=>setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{marginTop:12}}>
        {filter==='NEXT' && <NextView tips={tips} results={results} now={now} uid={uid} onSave={saveTip} onTeamClick={setSelectedTeam} />}
        {filter in GROUPS && <GroupView group={filter} tips={tips} results={results} now={now} onSave={saveTip} onTeamClick={setSelectedTeam} />}
        {['R32','QF','SF','P3','FIN'].includes(filter) && <KoView koGroup={filter} tips={tips} results={results} now={now} onSave={saveTip} onTeamClick={setSelectedTeam} />}
      </div>

      {selectedTeam && <TeamModal team={selectedTeam} onClose={()=>setSelectedTeam(null)} results={results} />}
    </div>
  )
}

// ── TABELLE TAB ───────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id:'pts',  label:'Meiste Punkte' },
  { id:'gf',   label:'Meiste Tore' },
  { id:'ga',   label:'Wenigste Gegentore' },
  { id:'gd',   label:'Beste Tordifferenz' },
  { id:'s',    label:'Meiste Siege' },
  { id:'sp',   label:'Meiste Spiele' },
]

function TabelleTab({ results, onTeamClick }) {
  const [view, setView] = useState('groups')   // 'groups' | 'turnier'
  const [sortBy, setSortBy] = useState('pts')

  // All 48 teams across all groups
  const allTeams = Object.keys(GROUPS).flatMap(g =>
    calcStandings(g, results).map(t => ({ ...t, group: g }))
  )

  const sorted = [...allTeams].sort((a, b) => {
    if (sortBy === 'pts') return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
    if (sortBy === 'gf')  return b.gf - a.gf   || b.pts - a.pts
    if (sortBy === 'ga')  return a.ga - b.ga   || b.pts - a.pts
    if (sortBy === 'gd')  return b.gd - a.gd   || b.pts - a.pts
    if (sortBy === 's')   return b.s - a.s     || b.pts - a.pts
    if (sortBy === 'sp')  return b.sp - a.sp   || b.pts - a.pts
    return 0
  })

  return (
    <div>
      {/* View switcher */}
      <div className="tab-switcher">
        <button className={`tab-sw-btn${view==='groups'?' active':''}`} onClick={()=>setView('groups')}>Gruppen A–L</button>
        <button className={`tab-sw-btn${view==='turnier'?' active':''}`} onClick={()=>setView('turnier')}>Turnier-Ranking</button>
      </div>

      {/* ALL GROUPS */}
      {view==='groups' && (
        <div>
          {Object.keys(GROUPS).map(g => (
            <div key={g} className="tabelle-group-block">
              <div className="tabelle-group-header">
                <span className="group-tag">{g}</span>
                <span className="tabelle-group-title">Gruppe {g}</span>
                <div className="tabelle-group-flags">
                  {GROUPS[g].map(t => TEAMS[t]?.code &&
                    <img key={t} src={flagUrl(TEAMS[t].code)} className="tabelle-mini-flag" alt={t} title={t} />
                  )}
                </div>
              </div>
              <GroupTable group={g} results={results} onTeamClick={onTeamClick||(() => {})} />
              {/* Matches summary for this group */}
              <div className="tabelle-match-summary">
                {MATCHES.filter(m=>m.group===g).map(m => {
                  const r = results[m.id]
                  return (
                    <div key={m.id} className="tabelle-match-row">
                      <span className="tms-date">{m.date.slice(0,5)}</span>
                      <span className="tms-home">{m.home}</span>
                      <span className="tms-score">
                        {r&&r.homeGoals!=null ? `${r.homeGoals}:${r.awayGoals}` : `${m.time}`}
                      </span>
                      <span className="tms-away">{m.away}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOURNAMENT RANKING */}
      {view==='turnier' && (
        <div>
          <div className="sort-bar">
            {SORT_OPTIONS.map(o => (
              <button key={o.id} className={`filter-btn${sortBy===o.id?' active':''}`} onClick={()=>setSortBy(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="tournament-table">
            <div className="tt-head">
              <span className="tt-c tt-pos">#</span>
              <span className="tt-c tt-flag-h"></span>
              <span className="tt-c tt-name-h">Mannschaft</span>
              <span className="tt-c">Gr</span>
              <span className="tt-c">Sp</span>
              <span className="tt-c tt-s">S</span>
              <span className="tt-c">U</span>
              <span className="tt-c tt-n">N</span>
              <span className="tt-c">Tore</span>
              <span className="tt-c">+/-</span>
              <span className="tt-c tt-pts-h">Pkt</span>
            </div>
            {sorted.map((t, i) => {
              const td = TEAMS[t.name]
              const sc = strengthColor(td?.strength||0)
              return (
                <div key={t.name} className="tt-row" onClick={()=>onTeamClick&&onTeamClick(t.name)}>
                  <span className="tt-c tt-pos tt-pos-n">{i+1}</span>
                  <span className="tt-c">
                    {td?.code && <img src={flagUrl(td.code)} className="tt-flag" alt={t.name} />}
                  </span>
                  <span className="tt-c tt-name">{t.name}</span>
                  <span className="tt-c tt-grp"><span className="grp-pill">{t.group}</span></span>
                  <span className="tt-c">{t.sp}</span>
                  <span className="tt-c tt-s">{t.s}</span>
                  <span className="tt-c">{t.u}</span>
                  <span className="tt-c tt-n">{t.n}</span>
                  <span className="tt-c tt-goals">{t.gf}:{t.ga}</span>
                  <span className="tt-c" style={{color:t.gd>0?'var(--green)':t.gd<0?'var(--red)':'var(--muted)',fontWeight:700,fontSize:11}}>
                    {t.gd>0?'+':''}{t.gd}
                  </span>
                  <span className="tt-c tt-pts-val">{t.pts}</span>
                </div>
              )
            })}
          </div>
          <div style={{fontSize:10,color:'var(--muted)',marginTop:8,textAlign:'center'}}>
            Klick auf eine Mannschaft für Details
          </div>
        </div>
      )}
    </div>
  )
}

// ── RANGLISTE ─────────────────────────────────────────────────────────────────
function RanglisteTab({uid, results}) {
  const [users, setUsers] = useState([])
  const [allTips, setAllTips] = useState([])
  useEffect(()=>{
    const u1=onSnapshot(collection(db,'users'),snap=>setUsers(snap.docs.map(d=>({uid:d.id,...d.data()}))))
    const u2=onSnapshot(collection(db,'tips'),snap=>setAllTips(snap.docs.map(d=>d.data())))
    return()=>{u1();u2()}
  },[])
  const board = users.map(u=>{
    const pts=allTips.filter(t=>t.uid===u.uid).reduce((s,t)=>{
      const r=results[t.matchId], p=r?calcPoints(t,r):0; return s+(p||0)
    },0)
    return{...u,pts}
  }).sort((a,b)=>b.pts-a.pts)
  return (
    <div>
      <div className="section-title">🏆 Rangliste</div>
      <div className="rank-list">
        {board.map((u,i)=>(
          <div key={u.uid} className={`rank-item${u.uid===uid?' me':''}`}>
            <div className={`rank-pos${i===0?' top1':i===1?' top2':i===2?' top3':''}`}>{i+1}</div>
            <div className="rank-avatar">{u.avatar||'⚽'}</div>
            <div className="rank-name">{u.displayName}{u.uid===uid?' (Du)':''}</div>
            <div className="rank-pts-wrap"><div className="rank-pts">{u.pts}</div><div className="rank-pts-label">Pkt</div></div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12,fontSize:11,color:'var(--muted)',textAlign:'center'}}>⭐ 3P Exakt · ✓ 2P Tendenz+Tor · ~ 1P Tendenz</div>
    </div>
  )
}

// ── PROFIL ────────────────────────────────────────────────────────────────────
function ProfilTab({user, profile, onProfileUpdate}) {
  const [name, setName] = useState(profile?.displayName||'')
  const [avatar, setAvatar] = useState(profile?.avatar||'⚽')
  const [oldPw, setOldPw] = useState(''), [newPw, setNewPw] = useState('')
  const [showOld, setShowOld] = useState(false), [showNew, setShowNew] = useState(false)
  const [msg, setMsg] = useState(''), [err, setErr] = useState('')
  useEffect(()=>{setName(profile?.displayName||'');setAvatar(profile?.avatar||'⚽')},[profile])
  async function saveProfile(){
    setMsg('');setErr('')
    try{
      await setDoc(doc(db,'users',user.uid),{displayName:name,avatar},{merge:true})
      await updateProfile(user,{displayName:name})
      onProfileUpdate({displayName:name,avatar}); setMsg('Gespeichert ✓')
    }catch{setErr('Fehler beim Speichern')}
  }
  async function changePw(){
    setMsg('');setErr('')
    if(newPw.length<6) return setErr('Passwort min. 6 Zeichen')
    try{
      await reauthenticateWithCredential(user,EmailAuthProvider.credential(user.email,oldPw))
      await updatePassword(user,newPw); setMsg('Passwort geändert ✓'); setOldPw(''); setNewPw('')
    }catch{setErr('Aktuelles Passwort falsch')}
  }
  return (
    <div>
      <div className="section-title">👤 Profil</div>
      <div className="profile-section">
        <h3>Avatar & Name</h3>
        <div className="profile-card">
          <div className="profile-avatar-big">{avatar}</div>
          <div className="avatar-grid">{AVATARS.map(a=><button key={a} className={`avatar-btn${avatar===a?' selected':''}`} onClick={()=>setAvatar(a)}>{a}</button>)}</div>
          <div className="field" style={{marginTop:12}}><label>Anzeigename</label><input value={name} onChange={e=>setName(e.target.value)} /></div>
          {msg&&<p className="success-msg">{msg}</p>}{err&&<p className="err">{err}</p>}
          <button className="save-btn" onClick={saveProfile}>Speichern</button>
        </div>
      </div>
      <div className="profile-section">
        <h3>Passwort ändern</h3>
        <div className="profile-card">
          <div className="field"><label>Aktuelles Passwort</label>
            <div className="pw-wrap"><input type={showOld?'text':'password'} value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="••••••" /><button type="button" className="pw-eye" onClick={()=>setShowOld(v=>!v)}><Eye show={showOld}/></button></div>
          </div>
          <div className="field"><label>Neues Passwort</label>
            <div className="pw-wrap"><input type={showNew?'text':'password'} value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min. 6 Zeichen" /><button type="button" className="pw-eye" onClick={()=>setShowNew(v=>!v)}><Eye show={showNew}/></button></div>
          </div>
          <button className="save-btn" onClick={changePw}>Passwort ändern</button>
        </div>
      </div>
    </div>
  )
}

// ── EINLADEN ──────────────────────────────────────────────────────────────────
function EinladenTab({profile}) {
  const [copied, setCopied] = useState(false)
  const code = profile?.inviteCode||'------'
  const url = `${window.location.origin}?code=${code}`
  function copy(){navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000)}
  return (
    <div>
      <div className="section-title">📨 Einladen</div>
      <div className="invite-code-box">
        <div className="invite-code">{code}</div>
        <div className="invite-url">{url}</div>
        <button className="copy-btn" onClick={copy}>{copied?'✓ Kopiert!':'🔗 Link kopieren'}</button>
      </div>
      <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.6}}>Teile diesen Link oder Code mit Freunden. Sie können sich damit registrieren.</p>
    </div>
  )
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function AdminTab({results}) {
  const [filter, setFilter] = useState('A')
  const keys=[...Object.keys(GROUPS),'R32','QF','SF','P3','FIN']
  return (
    <div>
      <div className="section-title">⚙️ Admin</div>
      <div className="group-filter-slider">
        {keys.map(k=><button key={k} className={`filter-btn${filter===k?' active':''}`} onClick={()=>setFilter(k)}>{k}</button>)}
      </div>
      <div style={{marginTop:12}}>
        {MATCHES.filter(m=>m.group===filter).map(m=><AdminMatchCard key={m.id} match={m} result={results[m.id]}/>)}
      </div>
    </div>
  )
}
function AdminMatchCard({match, result}) {
  const [h,setH]=useState(result?.homeGoals??''), [a,setA]=useState(result?.awayGoals??''), [saved,setSaved]=useState(false)
  useEffect(()=>{setH(result?.homeGoals??'');setA(result?.awayGoals??'')},[result])
  async function save(){
    if(h===''||a==='') return
    await setDoc(doc(db,'results',match.id),{homeGoals:+h,awayGoals:+a,matchId:match.id,updatedAt:serverTimestamp()})
    setSaved(true); setTimeout(()=>setSaved(false),2000)
  }
  return (
    <div className="admin-match">
      <div className="admin-match-title">{match.home} vs {match.away} · {match.date} {match.time}</div>
      <div className="admin-score-row">
        <input className="admin-input" type="number" min="0" max="99" value={h} onChange={e=>setH(e.target.value)} placeholder="–"/>
        <span style={{color:'var(--muted)',textAlign:'center'}}>:</span>
        <input className="admin-input" type="number" min="0" max="99" value={a} onChange={e=>setA(e.target.value)} placeholder="–"/>
        {saved?<span className="saved-badge">✓</span>:<button className="save-result-btn" onClick={save}>Speichern</button>}
      </div>
    </div>
  )
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function RegisterForm({onSwitch}) {
  const [name,setName]=useState(''), [email,setEmail]=useState(''), [pw,setPw]=useState(''), [pw2,setPw2]=useState('')
  const [avatar,setAvatar]=useState('⚽'), [code,setCode]=useState(''), [showPw,setShowPw]=useState(false), [showPw2,setShowPw2]=useState(false)
  const [err,setErr]=useState(''), [loading,setLoading]=useState(false)
  const urlCode=new URLSearchParams(window.location.search).get('code')||''
  useEffect(()=>{if(urlCode) setCode(urlCode)},[urlCode])
  async function handleRegister(e){
    e.preventDefault(); setErr('')
    if(!name.trim()) return setErr('Name erforderlich')
    if(pw!==pw2) return setErr('Passwörter stimmen nicht überein')
    if(pw.length<6) return setErr('Passwort min. 6 Zeichen')
    const inv=code.trim().toUpperCase()
    if(email.toLowerCase()!==ADMIN_EMAIL){
      if(!inv) return setErr('Einladungscode erforderlich')
      const snap=await getDocs(collection(db,'users'))
      if(!snap.docs.some(d=>d.data().inviteCode===inv)) return setErr('Ungültiger Code')
    }
    setLoading(true)
    try{
      const {user}=await createUserWithEmailAndPassword(auth,email,pw)
      await updateProfile(user,{displayName:name.trim()}); await sendEmailVerification(user)
      await setDoc(doc(db,'users',user.uid),{displayName:name.trim(),email:email.toLowerCase(),avatar,inviteCode:genCode(),invitedBy:inv||null,createdAt:serverTimestamp()})
    }catch(e){setErr(e.code==='auth/email-already-in-use'?'E-Mail bereits registriert':e.message);setLoading(false)}
  }
  return (
    <form className="auth-card" onSubmit={handleRegister}>
      <h2>Registrieren</h2>
      <div className="field"><label>Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Dein Name"/></div>
      <div className="field"><label>E-Mail</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@email.com"/></div>
      <div className="field"><label>Passwort</label><div className="pw-wrap"><input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Min. 6 Zeichen"/><button type="button" className="pw-eye" onClick={()=>setShowPw(v=>!v)}><Eye show={showPw}/></button></div></div>
      <div className="field"><label>Bestätigen</label><div className="pw-wrap"><input type={showPw2?'text':'password'} value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Wiederholen"/><button type="button" className="pw-eye" onClick={()=>setShowPw2(v=>!v)}><Eye show={showPw2}/></button></div></div>
      <div className="field"><label>Avatar</label><div className="avatar-grid">{AVATARS.map(a=><button key={a} type="button" className={`avatar-btn${avatar===a?' selected':''}`} onClick={()=>setAvatar(a)}>{a}</button>)}</div></div>
      {email.toLowerCase()!==ADMIN_EMAIL&&<div className="field"><label>Einladungscode</label><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6}/></div>}
      {err&&<p className="err">{err}</p>}
      <button className="btn" type="submit" disabled={loading}>{loading?'Wird registriert…':'Registrieren'}</button>
      <div className="auth-switch">Bereits registriert? <button type="button" onClick={onSwitch}>Anmelden</button></div>
    </form>
  )
}
function LoginForm({onSwitch}) {
  const [email,setEmail]=useState(''), [pw,setPw]=useState(''), [showPw,setShowPw]=useState(false), [err,setErr]=useState(''), [loading,setLoading]=useState(false)
  async function handleLogin(e){e.preventDefault();setErr('');setLoading(true);try{await signInWithEmailAndPassword(auth,email,pw)}catch{setErr('E-Mail oder Passwort falsch');setLoading(false)}}
  return (
    <form className="auth-card" onSubmit={handleLogin}>
      <h2>Anmelden</h2>
      <div className="field"><label>E-Mail</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@email.com"/></div>
      <div className="field"><label>Passwort</label><div className="pw-wrap"><input type={showPw?'text':'password'} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Passwort"/><button type="button" className="pw-eye" onClick={()=>setShowPw(v=>!v)}><Eye show={showPw}/></button></div></div>
      {err&&<p className="err">{err}</p>}
      <button className="btn" type="submit" disabled={loading}>{loading?'Anmeldung…':'Anmelden'}</button>
      <div className="auth-switch">Noch kein Konto? <button type="button" onClick={onSwitch}>Registrieren</button></div>
    </form>
  )
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [authUser,setAuthUser]=useState(undefined), [profile,setProfile]=useState(null), [results,setResults]=useState({})
  const [tab,setTab]=useState('tippen'), [authMode,setAuthMode]=useState('login')
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async u=>{
      setAuthUser(u)
      if(u){const snap=await getDoc(doc(db,'users',u.uid));if(snap.exists()) setProfile(snap.data());else setProfile(null)}
      else setProfile(null)
    }); return unsub
  },[])
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,'results'),snap=>{const r={};snap.docs.forEach(d=>{r[d.id]=d.data()});setResults(r)}); return unsub
  },[])
  if(authUser===undefined) return <div className="loading">⚽ Laden…</div>
  if(!authUser) return (
    <div className="auth-wrap">
      <div className="auth-logo">TippLiga WM26</div>
      <div className="auth-sub">Fussball-WM 2026 Tippspiel</div>
      {authMode==='login'?<LoginForm onSwitch={()=>setAuthMode('register')}/>:<RegisterForm onSwitch={()=>setAuthMode('login')}/>}
    </div>
  )
  if(!authUser.emailVerified) return (
    <div className="auth-wrap">
      <div className="auth-logo">TippLiga WM26</div>
      <div className="verify-wrap">
        <h2>✉️ E-Mail bestätigen</h2>
        <p>Wir haben eine Bestätigungs-E-Mail an <strong>{authUser.email}</strong> gesendet.</p>
        <button className="btn" onClick={async()=>{await sendEmailVerification(authUser);alert('E-Mail erneut gesendet!')}}>E-Mail erneut senden</button>
        <button className="btn-ghost" onClick={()=>signOut(auth)}>Abmelden</button>
      </div>
    </div>
  )
  const isAdmin=authUser.email?.toLowerCase()===ADMIN_EMAIL
  const navItems=[
    {id:'tippen',    icon:'🎯', label:'Tippen'},
    {id:'tabelle',   icon:'📊', label:'Tabelle'},
    {id:'rangliste', icon:'🏆', label:'Liga'},
    {id:'profil',    icon:profile?.avatar||'👤', label:profile?.displayName?.split(' ')[0]||'Profil'},
    ...(isAdmin?[{id:'admin',icon:'⚙️',label:'Admin'}]:[]),
  ]
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">TippLiga WM26</div>
        <button className="logout-btn" onClick={()=>signOut(auth)} title="Abmelden">✕</button>
      </header>
      <div className="app-content">
        {tab==='tippen'    && <TippenTab uid={authUser.uid} results={results}/>}
        {tab==='tabelle'   && <TabelleTab results={results} onTeamClick={null}/>}
        {tab==='rangliste' && <RanglisteTab uid={authUser.uid} results={results}/>}
        {tab==='profil'    && <ProfilTab user={authUser} profile={profile} onProfileUpdate={p=>setProfile(prev=>({...prev,...p}))}/>}
        {tab==='admin'&&isAdmin && <AdminTab results={results}/>}
      </div>
      <nav className="bottom-nav">
        {navItems.map(n=>(
          <button key={n.id} className={`nav-btn${tab===n.id?' active':''}`} onClick={()=>setTab(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
