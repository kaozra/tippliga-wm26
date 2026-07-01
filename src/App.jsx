import { useState, useEffect, useRef } from "react";
import appCodeRaw from "./App.jsx?raw";
import { calcPoints, hasMatchScore } from "./scoring.js";
import {
  Crosshair,
  Star,
  Flame,
  Skull,
  PenLine,
  Sun,
  Moon,
  Download,
  Share,
  CalendarDays,
  Crown,
  Zap,
  FileEdit,
  CheckCircle2,
  Activity,
  Gamepad2,
  BarChart3,
  Trophy,
  User,
  Settings,
  Info,
  Target,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import "./App.css";

const firebaseConfig = {
  apiKey: "AIzaSyAU1YuONlOvbpSYXvWTGHOrTEoxt4oAQOQ",
  authDomain: "wm26-tipit.firebaseapp.com",
  projectId: "wm26-tipit",
  storageBucket: "wm26-tipit.firebasestorage.app",
  messagingSenderId: "578314228001",
  appId: "1:578314228001:web:addd4246e41bcfe9b3ee60",
};
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

const ADMIN_EMAIL = "kaozra@hotmail.com";
const AVATAR_GRADIENTS = [
  ["#E63946", "#9B1D24"],
  ["#F4A261", "#C1622A"],
  ["#2A9D8F", "#1A6B60"],
  ["#457B9D", "#1D4E70"],
  ["#9B5DE5", "#5E1FA8"],
  ["#F72585", "#A0005A"],
  ["#4CC9F0", "#1A7FA8"],
  ["#06D6A0", "#047A5C"],
  ["#FB8500", "#A85500"],
  ["#8338EC", "#4A0FAD"],
];
function InitialsAvatar({ name, uid, size = 36 }) {
  const n = name || "?";
  const initials =
    n
      .trim()
      .split(/\s+/)
      .map((w) => w[0]?.toUpperCase() || "")
      .slice(0, 2)
      .join("") || "?";
  const seed = uid || n;
  const idx =
    [...seed].reduce((s, c) => s + c.charCodeAt(0), 0) %
    AVATAR_GRADIENTS.length;
  const [c1, c2] = AVATAR_GRADIENTS[idx];
  return (
    <div
      className="initials-avatar"
      style={{
        width: size,
        height: size,
        minWidth: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
      }}
    >
      {initials}
    </div>
  );
}
function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function flagUrl(code) {
  return `https://flagcdn.com/${code}.svg`;
}

// ── TEAMS ─────────────────────────────────────────────────────────────────────
const TEAMS = {
  Mexiko: { code: "mx", strength: 79 },
  Südafrika: { code: "za", strength: 61 },
  Südkorea: { code: "kr", strength: 74 },
  Tschechien: { code: "cz", strength: 72 },
  Kanada: { code: "ca", strength: 76 },
  "Bosnien-Herzegowina": { code: "ba", strength: 67 },
  Katar: { code: "qa", strength: 60 },
  Schweiz: { code: "ch", strength: 81 },
  Brasilien: { code: "br", strength: 87 },
  Marokko: { code: "ma", strength: 78 },
  Haiti: { code: "ht", strength: 52 },
  Schottland: { code: "gb-sct", strength: 71 },
  USA: { code: "us", strength: 78 },
  Paraguay: { code: "py", strength: 67 },
  Australien: { code: "au", strength: 73 },
  Türkei: { code: "tr", strength: 76 },
  Deutschland: { code: "de", strength: 85 },
  Curaçao: { code: "cw", strength: 48 },
  Elfenbeinküste: { code: "ci", strength: 71 },
  Ecuador: { code: "ec", strength: 72 },
  Niederlande: { code: "nl", strength: 83 },
  Japan: { code: "jp", strength: 77 },
  Schweden: { code: "se", strength: 75 },
  Tunesien: { code: "tn", strength: 66 },
  Belgien: { code: "be", strength: 80 },
  Ägypten: { code: "eg", strength: 70 },
  Iran: { code: "ir", strength: 70 },
  Neuseeland: { code: "nz", strength: 59 },
  Spanien: { code: "es", strength: 87 },
  "Kap Verde": { code: "cv", strength: 58 },
  "Saudi-Arabien": { code: "sa", strength: 69 },
  Uruguay: { code: "uy", strength: 79 },
  Frankreich: { code: "fr", strength: 90 },
  Senegal: { code: "sn", strength: 75 },
  Irak: { code: "iq", strength: 60 },
  Norwegen: { code: "no", strength: 76 },
  Argentinien: { code: "ar", strength: 93 },
  Algerien: { code: "dz", strength: 69 },
  Österreich: { code: "at", strength: 74 },
  Jordanien: { code: "jo", strength: 61 },
  Portugal: { code: "pt", strength: 88 },
  "DR Kongo": { code: "cd", strength: 64 },
  Usbekistan: { code: "uz", strength: 59 },
  Kolumbien: { code: "co", strength: 80 },
  England: { code: "gb-eng", strength: 86 },
  Kroatien: { code: "hr", strength: 78 },
  Ghana: { code: "gh", strength: 65 },
  Panama: { code: "pa", strength: 62 },
};

const TEAM_MAP_DE = {
  Mexico: "Mexiko",
  "South Africa": "Südafrika",
  "Korea Republic": "Südkorea",
  "Czech Republic": "Tschechien",
  Czechia: "Tschechien",
  Canada: "Kanada",
  "Bosnia and Herzegovina": "Bosnien-Herzegowina",
  Qatar: "Katar",
  Switzerland: "Schweiz",
  Brazil: "Brasilien",
  Morocco: "Marokko",
  Haiti: "Haiti",
  Scotland: "Schottland",
  "United States": "USA",
  USA: "USA",
  Paraguay: "Paraguay",
  Australia: "Australien",
  Turkey: "Türkei",
  Turkiye: "Türkei",
  Germany: "Deutschland",
  Curacao: "Curaçao",
  "Cote d'Ivoire": "Elfenbeinküste",
  "Ivory Coast": "Elfenbeinküste",
  Ecuador: "Ecuador",
  Netherlands: "Niederlande",
  Japan: "Japan",
  Sweden: "Schweden",
  Tunisia: "Tunesien",
  Belgium: "Belgien",
  Egypt: "Ägypten",
  Iran: "Iran",
  "New Zealand": "Neuseeland",
  Spain: "Spanien",
  "Cape Verde": "Kap Verde",
  "Saudi Arabia": "Saudi-Arabien",
  Uruguay: "Uruguay",
  France: "Frankreich",
  Senegal: "Senegal",
  Iraq: "Irak",
  Norway: "Norwegen",
  Argentina: "Argentinien",
  Algeria: "Algerien",
  Austria: "Österreich",
  Jordan: "Jordanien",
  Portugal: "Portugal",
  "DR Congo": "DR Kongo",
  "Congo DR": "DR Kongo",
  Uzbekistan: "Usbekistan",
  Colombia: "Kolumbien",
  England: "England",
  Croatia: "Kroatien",
  Ghana: "Ghana",
  Panama: "Panama",
};

const TEAM_INFO = {
  Schweiz: {
    coach: "Murat Yakin",
    players: [
      "Granit Xhaka",
      "Manuel Akanji",
      "Xherdan Shaqiri",
      "Breel Embolo",
    ],
  },
  Deutschland: {
    coach: "Julian Nagelsmann",
    players: [
      "Jamal Musiala",
      "Florian Wirtz",
      "Niclas Füllkrug",
      "Kai Havertz",
    ],
  },
  Frankreich: {
    coach: "Didier Deschamps",
    players: ["Kylian Mbappé", "Antoine Griezmann", "Aurélien Tchouaméni"],
  },
  Argentinien: {
    coach: "Lionel Scaloni",
    players: ["Lionel Messi", "Rodrigo De Paul", "Lautaro Martínez"],
  },
  Brasilien: {
    coach: "Dorival Júnior",
    players: ["Vinícius Jr.", "Rodrygo", "Raphinha", "Endrick"],
  },
  England: {
    coach: "Lee Carsley",
    players: ["Jude Bellingham", "Harry Kane", "Bukayo Saka", "Phil Foden"],
  },
  Spanien: {
    coach: "Luis de la Fuente",
    players: ["Pedri", "Lamine Yamal", "Álvaro Morata", "Dani Olmo"],
  },
  Portugal: {
    coach: "Roberto Martínez",
    players: ["Cristiano Ronaldo", "João Félix", "Rafael Leão"],
  },
  Niederlande: {
    coach: "Ronald Koeman",
    players: ["Virgil van Dijk", "Cody Gakpo", "Xavi Simons"],
  },
  Belgien: {
    coach: "Rudi García",
    players: ["Kevin De Bruyne", "Romelu Lukaku", "Leandro Trossard"],
  },
  Mexiko: {
    coach: "Javier Aguirre",
    players: ["Hirving Lozano", "Raúl Jiménez", "Edson Álvarez"],
  },
  USA: {
    coach: "Mauricio Pochettino",
    players: ["Christian Pulisic", "Gio Reyna", "Tyler Adams"],
  },
  Kanada: {
    coach: "Jesse Marsch",
    players: ["Alphonso Davies", "Jonathan David", "Tajon Buchanan"],
  },
  Marokko: {
    coach: "Walid Regragui",
    players: ["Yassine Bounou", "Youssef En-Nesyri", "Hakim Ziyech"],
  },
  Uruguay: {
    coach: "Marcelo Bielsa",
    players: ["Darwin Núñez", "Federico Valverde", "Rodrigo Bentancur"],
  },
  Kolumbien: {
    coach: "Néstor Lorenzo",
    players: ["Luis Díaz", "James Rodríguez", "Jhon Durán"],
  },
  Japan: {
    coach: "Hajime Moriyasu",
    players: ["Takefusa Kubo", "Daichi Kamada", "Ritsu Doan"],
  },
  Südkorea: {
    coach: "Hong Myung-bo",
    players: ["Son Heung-min", "Lee Jae-sung", "Hwang Hee-chan"],
  },
  Australien: {
    coach: "Tony Popovic",
    players: ["Mathew Leckie", "Mitchell Duke", "Aaron Mooy"],
  },
  Türkei: {
    coach: "Vincenzo Montella",
    players: ["Arda Güler", "Hakan Çalhanoğlu", "Kenan Yıldız"],
  },
  Senegal: {
    coach: "Aliou Cissé",
    players: ["Sadio Mané", "Édouard Mendy", "Idrissa Gueye"],
  },
  Norwegen: {
    coach: "Ståle Solbakken",
    players: ["Erling Haaland", "Martin Ødegaard", "Alexander Sørloth"],
  },
  Schweden: {
    coach: "Jon Dahl Tomasson",
    players: ["Viktor Gyökeres", "Dejan Kulusevski", "Alexander Isak"],
  },
  Kroatien: {
    coach: "Zlatko Dalić",
    players: ["Luka Modrić", "Ivan Perišić", "Marcelo Brozović"],
  },
  Österreich: {
    coach: "Ralf Rangnick",
    players: ["Marcel Sabitzer", "Christoph Baumgartner", "Marko Arnautović"],
  },
  "Saudi-Arabien": {
    coach: "Roberto Mancini",
    players: ["Salem Al-Dawsari", "Firas Al-Buraikan", "Mohammed Al-Owais"],
  },
  Katar: {
    coach: "Marquez López",
    players: ["Akram Afif", "Almoez Ali", "Meshaal Barsham"],
  },
  Iran: {
    coach: "Amir Ghalenoei",
    players: ["Mehdi Taremi", "Sardar Azmoun", "Alireza Jahanbakhsh"],
  },
  Südafrika: {
    coach: "Hugo Broos",
    players: ["Percy Tau", "Themba Zwane", "Ronwen Williams"],
  },
  Tschechien: {
    coach: "Ivan Hašek",
    players: ["Tomáš Souček", "Patrik Schick", "Vladimír Coufal"],
  },
  "Bosnien-Herzegowina": {
    coach: "Sergej Barbarez",
    players: ["Edin Džeko", "Miralem Pjanić", "Sead Kolašinac"],
  },
  Haiti: {
    coach: "Marc Collat",
    players: ["Duckens Nazon", "Frantzdy Pierrot", "Mechack Jérôme"],
  },
  Schottland: {
    coach: "Steve Clarke",
    players: ["Andrew Robertson", "Scott McTominay", "Kieran Tierney"],
  },
  Paraguay: {
    coach: "Daniel Garnero",
    players: ["Miguel Almirón", "Julio Enciso", "Óscar Romero"],
  },
  Curaçao: {
    coach: "Remko Bicentini",
    players: ["Leandro Bacuna", "Cuco Martina", "Juninho"],
  },
  Elfenbeinküste: {
    coach: "Emerse Faé",
    players: ["Sébastien Haller", "Franck Kessié", "Simon Adingra"],
  },
  Ecuador: {
    coach: "Félix Sánchez",
    players: ["Moisés Caicedo", "Enner Valencia", "Gonzalo Plata"],
  },
  Tunesien: {
    coach: "Jalel Kadri",
    players: ["Wahbi Khazri", "Ellyes Skhiri", "Youssef Msakni"],
  },
  Ägypten: {
    coach: "Rui Vitória",
    players: ["Mohamed Salah", "Mostafa Mohamed", "Omar Marmoush"],
  },
  Neuseeland: {
    coach: "Danny Hay",
    players: ["Chris Wood", "Clayton Lewis", "Bill Tuilagi"],
  },
  "Kap Verde": {
    coach: "Pedro Brito",
    players: ["Garry Rodrigues", "Ryan Mendes", "Lisandro Semedo"],
  },
  Irak: {
    coach: "Jesús Casas",
    players: ["Aymen Hussein", "Amjad Attwan", "Mohanad Ali"],
  },
  Algerien: {
    coach: "Vladimir Petković",
    players: ["Riyad Mahrez", "Youcef Atal", "Islam Slimani"],
  },
  Jordanien: {
    coach: "Hussein Ammouta",
    players: ["Yazan Al-Naimat", "Ahmad Hayel", "Musa Al-Taamari"],
  },
  "DR Kongo": {
    coach: "Sébastien Desabre",
    players: ["Chancel Mbemba", "Yannick Bolasie", "Dieumerci Mbokani"],
  },
  Usbekistan: {
    coach: "Srecko Katanec",
    players: ["Eldor Shomurodov", "Otabek Shukurov", "Jamshid Iskanderov"],
  },
  Ghana: {
    coach: "Otto Addo",
    players: ["Mohammed Kudus", "Thomas Partey", "Jordan Ayew"],
  },
  Panama: {
    coach: "Thomas Christiansen",
    players: ["Aníbal Godoy", "Adalberto Carrasquilla", "Rolando Blackburn"],
  },
};

// ── VENUES ────────────────────────────────────────────────────────────────────
const VENUES = {
  A1: { city: "Mexico City", stadium: "Estadio Azteca", cap: 87523 },
  A2: { city: "Guadalajara", stadium: "Estadio Akron", cap: 48000 },
  A3: { city: "Atlanta", stadium: "Mercedes-Benz Stadium", cap: 75000 },
  A4: { city: "Guadalajara", stadium: "Estadio Akron", cap: 48000 },
  A5: { city: "Mexico City", stadium: "Estadio Azteca", cap: 87523 },
  A6: { city: "Guadalajara", stadium: "Estadio Akron", cap: 48000 },
  B1: { city: "Toronto", stadium: "BMO Field", cap: 44315 },
  B2: { city: "Santa Clara", stadium: "Levi's Stadium", cap: 71000 },
  B3: { city: "Los Angeles", stadium: "SoFi Stadium", cap: 70000 },
  B4: { city: "Vancouver", stadium: "BC Place", cap: 54000 },
  B5: { city: "Vancouver", stadium: "BC Place", cap: 54000 },
  B6: { city: "Seattle", stadium: "Lumen Field", cap: 69000 },
  C1: { city: "East Rutherford", stadium: "MetLife Stadium", cap: 78576 },
  C2: { city: "Foxborough", stadium: "Gillette Stadium", cap: 65000 },
  C3: { city: "Foxborough", stadium: "Gillette Stadium", cap: 65000 },
  C4: { city: "Philadelphia", stadium: "Lincoln Financial Field", cap: 69000 },
  C5: { city: "Miami Gardens", stadium: "Hard Rock Stadium", cap: 65000 },
  C6: { city: "Atlanta", stadium: "Mercedes-Benz Stadium", cap: 75000 },
  D1: { city: "Los Angeles", stadium: "SoFi Stadium", cap: 70000 },
  D2: { city: "Vancouver", stadium: "BC Place", cap: 54000 },
  D3: { city: "Seattle", stadium: "Lumen Field", cap: 69000 },
  D4: { city: "Santa Clara", stadium: "Levi's Stadium", cap: 71000 },
  D5: { city: "Los Angeles", stadium: "SoFi Stadium", cap: 70000 },
  D6: { city: "Santa Clara", stadium: "Levi's Stadium", cap: 71000 },
  E1: { city: "Houston", stadium: "NRG Stadium", cap: 72000 },
  E2: { city: "Philadelphia", stadium: "Lincoln Financial Field", cap: 69000 },
  E3: { city: "Toronto", stadium: "BMO Field", cap: 44315 },
  E4: { city: "Kansas City", stadium: "Arrowhead Stadium", cap: 73000 },
  E5: { city: "East Rutherford", stadium: "MetLife Stadium", cap: 78576 },
  E6: { city: "Philadelphia", stadium: "Lincoln Financial Field", cap: 69000 },
  F1: { city: "Arlington TX", stadium: "AT&T Stadium", cap: 94000 },
  F2: { city: "Guadalajara", stadium: "Estadio Akron", cap: 48000 },
  F3: { city: "Houston", stadium: "NRG Stadium", cap: 72000 },
  F4: { city: "Guadalajara", stadium: "Estadio Akron", cap: 48000 },
  F5: { city: "Arlington TX", stadium: "AT&T Stadium", cap: 94000 },
  F6: { city: "Kansas City", stadium: "Arrowhead Stadium", cap: 73000 },
  G1: { city: "Seattle", stadium: "Lumen Field", cap: 69000 },
  G2: { city: "Los Angeles", stadium: "SoFi Stadium", cap: 70000 },
  G3: { city: "Los Angeles", stadium: "SoFi Stadium", cap: 70000 },
  G4: { city: "Vancouver", stadium: "BC Place", cap: 54000 },
  G5: { city: "Seattle", stadium: "Lumen Field", cap: 69000 },
  G6: { city: "Vancouver", stadium: "BC Place", cap: 54000 },
  H1: { city: "Atlanta", stadium: "Mercedes-Benz Stadium", cap: 75000 },
  H2: { city: "Miami Gardens", stadium: "Hard Rock Stadium", cap: 65000 },
  H3: { city: "Atlanta", stadium: "Mercedes-Benz Stadium", cap: 75000 },
  H4: { city: "Miami Gardens", stadium: "Hard Rock Stadium", cap: 65000 },
  H5: { city: "Houston", stadium: "NRG Stadium", cap: 72000 },
  H6: { city: "Guadalajara", stadium: "Estadio Akron", cap: 48000 },
  I1: { city: "East Rutherford", stadium: "MetLife Stadium", cap: 78576 },
  I2: { city: "Foxborough", stadium: "Gillette Stadium", cap: 65000 },
  I3: { city: "Philadelphia", stadium: "Lincoln Financial Field", cap: 69000 },
  I4: { city: "East Rutherford", stadium: "MetLife Stadium", cap: 78576 },
  I5: { city: "Foxborough", stadium: "Gillette Stadium", cap: 65000 },
  I6: { city: "Toronto", stadium: "BMO Field", cap: 44315 },
  J1: { city: "Kansas City", stadium: "Arrowhead Stadium", cap: 73000 },
  J2: { city: "Santa Clara", stadium: "Levi's Stadium", cap: 71000 },
  J3: { city: "Arlington TX", stadium: "AT&T Stadium", cap: 94000 },
  J4: { city: "Santa Clara", stadium: "Levi's Stadium", cap: 71000 },
  J5: { city: "Kansas City", stadium: "Arrowhead Stadium", cap: 73000 },
  J6: { city: "Arlington TX", stadium: "AT&T Stadium", cap: 94000 },
  K1: { city: "Houston", stadium: "NRG Stadium", cap: 72000 },
  K2: { city: "Mexico City", stadium: "Estadio Azteca", cap: 87523 },
  K3: { city: "Houston", stadium: "NRG Stadium", cap: 72000 },
  K4: { city: "Guadalajara", stadium: "Estadio Akron", cap: 48000 },
  K5: { city: "Miami Gardens", stadium: "Hard Rock Stadium", cap: 65000 },
  K6: { city: "Atlanta", stadium: "Mercedes-Benz Stadium", cap: 75000 },
  L1: { city: "Arlington TX", stadium: "AT&T Stadium", cap: 94000 },
  L2: { city: "Toronto", stadium: "BMO Field", cap: 44315 },
  L3: { city: "Foxborough", stadium: "Gillette Stadium", cap: 65000 },
  L4: { city: "Toronto", stadium: "BMO Field", cap: 44315 },
  L5: { city: "East Rutherford", stadium: "MetLife Stadium", cap: 78576 },
  L6: { city: "Philadelphia", stadium: "Lincoln Financial Field", cap: 69000 },
};

// ── GROUPS ────────────────────────────────────────────────────────────────────
const GROUPS = {
  A: ["Mexiko", "Südafrika", "Südkorea", "Tschechien"],
  B: ["Kanada", "Bosnien-Herzegowina", "Katar", "Schweiz"],
  C: ["Brasilien", "Marokko", "Haiti", "Schottland"],
  D: ["USA", "Paraguay", "Australien", "Türkei"],
  E: ["Deutschland", "Curaçao", "Elfenbeinküste", "Ecuador"],
  F: ["Niederlande", "Japan", "Schweden", "Tunesien"],
  G: ["Belgien", "Ägypten", "Iran", "Neuseeland"],
  H: ["Spanien", "Kap Verde", "Saudi-Arabien", "Uruguay"],
  I: ["Frankreich", "Senegal", "Irak", "Norwegen"],
  J: ["Argentinien", "Algerien", "Österreich", "Jordanien"],
  K: ["Portugal", "DR Kongo", "Usbekistan", "Kolumbien"],
  L: ["England", "Kroatien", "Ghana", "Panama"],
};

// Bracket-Hälfte: Gruppen A-H → Sieger SF1/SF2 → Final; I-L → Sieger SF3/SF4 → Final
const TEAM_TO_GROUP = {};
Object.entries(GROUPS).forEach(([g, teams]) =>
  teams.forEach((t) => {
    TEAM_TO_GROUP[t] = g;
  }),
);
const BRACKET_HALF1 = new Set(["A", "B", "C", "D", "E", "F", "G", "H"]);

// ── MATCHES ───────────────────────────────────────────────────────────────────
const MATCHES = [
  {
    id: "A1",
    group: "A",
    home: "Mexiko",
    away: "Südafrika",
    date: "11.06.2026",
    time: "21:00",
  },
  {
    id: "A2",
    group: "A",
    home: "Südkorea",
    away: "Tschechien",
    date: "12.06.2026",
    time: "04:00",
  },
  {
    id: "A3",
    group: "A",
    home: "Tschechien",
    away: "Südafrika",
    date: "18.06.2026",
    time: "18:00",
  },
  {
    id: "A4",
    group: "A",
    home: "Mexiko",
    away: "Südkorea",
    date: "19.06.2026",
    time: "03:00",
  },
  {
    id: "A5",
    group: "A",
    home: "Tschechien",
    away: "Mexiko",
    date: "25.06.2026",
    time: "03:00",
  },
  {
    id: "A6",
    group: "A",
    home: "Südafrika",
    away: "Südkorea",
    date: "25.06.2026",
    time: "03:00",
  },
  {
    id: "B1",
    group: "B",
    home: "Kanada",
    away: "Bosnien-Herzegowina",
    date: "12.06.2026",
    time: "21:00",
  },
  {
    id: "B2",
    group: "B",
    home: "Katar",
    away: "Schweiz",
    date: "13.06.2026",
    time: "21:00",
  },
  {
    id: "B3",
    group: "B",
    home: "Schweiz",
    away: "Bosnien-Herzegowina",
    date: "18.06.2026",
    time: "21:00",
  },
  {
    id: "B4",
    group: "B",
    home: "Kanada",
    away: "Katar",
    date: "19.06.2026",
    time: "00:00",
  },
  {
    id: "B5",
    group: "B",
    home: "Schweiz",
    away: "Kanada",
    date: "24.06.2026",
    time: "21:00",
  },
  {
    id: "B6",
    group: "B",
    home: "Bosnien-Herzegowina",
    away: "Katar",
    date: "24.06.2026",
    time: "21:00",
  },
  {
    id: "C1",
    group: "C",
    home: "Brasilien",
    away: "Marokko",
    date: "14.06.2026",
    time: "00:00",
  },
  {
    id: "C2",
    group: "C",
    home: "Haiti",
    away: "Schottland",
    date: "14.06.2026",
    time: "03:00",
  },
  {
    id: "C3",
    group: "C",
    home: "Schottland",
    away: "Marokko",
    date: "20.06.2026",
    time: "00:00",
  },
  {
    id: "C4",
    group: "C",
    home: "Brasilien",
    away: "Haiti",
    date: "20.06.2026",
    time: "02:30",
  },
  {
    id: "C5",
    group: "C",
    home: "Schottland",
    away: "Brasilien",
    date: "25.06.2026",
    time: "00:00",
  },
  {
    id: "C6",
    group: "C",
    home: "Marokko",
    away: "Haiti",
    date: "25.06.2026",
    time: "00:00",
  },
  {
    id: "D1",
    group: "D",
    home: "USA",
    away: "Paraguay",
    date: "13.06.2026",
    time: "03:00",
  },
  {
    id: "D2",
    group: "D",
    home: "Australien",
    away: "Türkei",
    date: "14.06.2026",
    time: "06:00",
  },
  {
    id: "D3",
    group: "D",
    home: "USA",
    away: "Australien",
    date: "19.06.2026",
    time: "21:00",
  },
  {
    id: "D4",
    group: "D",
    home: "Türkei",
    away: "Paraguay",
    date: "20.06.2026",
    time: "05:00",
  },
  {
    id: "D5",
    group: "D",
    home: "Türkei",
    away: "USA",
    date: "26.06.2026",
    time: "04:00",
  },
  {
    id: "D6",
    group: "D",
    home: "Paraguay",
    away: "Australien",
    date: "26.06.2026",
    time: "04:00",
  },
  {
    id: "E1",
    group: "E",
    home: "Deutschland",
    away: "Curaçao",
    date: "14.06.2026",
    time: "19:00",
  },
  {
    id: "E2",
    group: "E",
    home: "Elfenbeinküste",
    away: "Ecuador",
    date: "15.06.2026",
    time: "01:00",
  },
  {
    id: "E3",
    group: "E",
    home: "Deutschland",
    away: "Elfenbeinküste",
    date: "20.06.2026",
    time: "22:00",
  },
  {
    id: "E4",
    group: "E",
    home: "Ecuador",
    away: "Curaçao",
    date: "21.06.2026",
    time: "02:00",
  },
  {
    id: "E5",
    group: "E",
    home: "Ecuador",
    away: "Deutschland",
    date: "25.06.2026",
    time: "22:00",
  },
  {
    id: "E6",
    group: "E",
    home: "Curaçao",
    away: "Elfenbeinküste",
    date: "25.06.2026",
    time: "22:00",
  },
  {
    id: "F1",
    group: "F",
    home: "Niederlande",
    away: "Japan",
    date: "14.06.2026",
    time: "22:00",
  },
  {
    id: "F2",
    group: "F",
    home: "Schweden",
    away: "Tunesien",
    date: "15.06.2026",
    time: "04:00",
  },
  {
    id: "F3",
    group: "F",
    home: "Niederlande",
    away: "Schweden",
    date: "20.06.2026",
    time: "19:00",
  },
  {
    id: "F4",
    group: "F",
    home: "Tunesien",
    away: "Japan",
    date: "21.06.2026",
    time: "06:00",
  },
  {
    id: "F5",
    group: "F",
    home: "Japan",
    away: "Schweden",
    date: "26.06.2026",
    time: "01:00",
  },
  {
    id: "F6",
    group: "F",
    home: "Tunesien",
    away: "Niederlande",
    date: "26.06.2026",
    time: "01:00",
  },
  {
    id: "G1",
    group: "G",
    home: "Belgien",
    away: "Ägypten",
    date: "15.06.2026",
    time: "21:00",
  },
  {
    id: "G2",
    group: "G",
    home: "Iran",
    away: "Neuseeland",
    date: "16.06.2026",
    time: "03:00",
  },
  {
    id: "G3",
    group: "G",
    home: "Belgien",
    away: "Iran",
    date: "21.06.2026",
    time: "21:00",
  },
  {
    id: "G4",
    group: "G",
    home: "Neuseeland",
    away: "Ägypten",
    date: "22.06.2026",
    time: "03:00",
  },
  {
    id: "G5",
    group: "G",
    home: "Ägypten",
    away: "Iran",
    date: "27.06.2026",
    time: "05:00",
  },
  {
    id: "G6",
    group: "G",
    home: "Neuseeland",
    away: "Belgien",
    date: "27.06.2026",
    time: "05:00",
  },
  {
    id: "H1",
    group: "H",
    home: "Spanien",
    away: "Kap Verde",
    date: "15.06.2026",
    time: "18:00",
  },
  {
    id: "H2",
    group: "H",
    home: "Saudi-Arabien",
    away: "Uruguay",
    date: "16.06.2026",
    time: "00:00",
  },
  {
    id: "H3",
    group: "H",
    home: "Spanien",
    away: "Saudi-Arabien",
    date: "21.06.2026",
    time: "18:00",
  },
  {
    id: "H4",
    group: "H",
    home: "Uruguay",
    away: "Kap Verde",
    date: "22.06.2026",
    time: "00:00",
  },
  {
    id: "H5",
    group: "H",
    home: "Kap Verde",
    away: "Saudi-Arabien",
    date: "27.06.2026",
    time: "02:00",
  },
  {
    id: "H6",
    group: "H",
    home: "Uruguay",
    away: "Spanien",
    date: "27.06.2026",
    time: "02:00",
  },
  {
    id: "I1",
    group: "I",
    home: "Frankreich",
    away: "Senegal",
    date: "16.06.2026",
    time: "21:00",
  },
  {
    id: "I2",
    group: "I",
    home: "Irak",
    away: "Norwegen",
    date: "17.06.2026",
    time: "00:00",
  },
  {
    id: "I3",
    group: "I",
    home: "Frankreich",
    away: "Irak",
    date: "22.06.2026",
    time: "23:00",
  },
  {
    id: "I4",
    group: "I",
    home: "Norwegen",
    away: "Senegal",
    date: "23.06.2026",
    time: "02:00",
  },
  {
    id: "I5",
    group: "I",
    home: "Norwegen",
    away: "Frankreich",
    date: "26.06.2026",
    time: "21:00",
  },
  {
    id: "I6",
    group: "I",
    home: "Senegal",
    away: "Irak",
    date: "26.06.2026",
    time: "21:00",
  },
  {
    id: "J1",
    group: "J",
    home: "Argentinien",
    away: "Algerien",
    date: "17.06.2026",
    time: "03:00",
  },
  {
    id: "J2",
    group: "J",
    home: "Österreich",
    away: "Jordanien",
    date: "17.06.2026",
    time: "06:00",
  },
  {
    id: "J3",
    group: "J",
    home: "Argentinien",
    away: "Österreich",
    date: "22.06.2026",
    time: "19:00",
  },
  {
    id: "J4",
    group: "J",
    home: "Jordanien",
    away: "Algerien",
    date: "23.06.2026",
    time: "05:00",
  },
  {
    id: "J5",
    group: "J",
    home: "Algerien",
    away: "Österreich",
    date: "28.06.2026",
    time: "04:00",
  },
  {
    id: "J6",
    group: "J",
    home: "Jordanien",
    away: "Argentinien",
    date: "28.06.2026",
    time: "04:00",
  },
  {
    id: "K1",
    group: "K",
    home: "Portugal",
    away: "DR Kongo",
    date: "17.06.2026",
    time: "19:00",
  },
  {
    id: "K2",
    group: "K",
    home: "Usbekistan",
    away: "Kolumbien",
    date: "18.06.2026",
    time: "04:00",
  },
  {
    id: "K3",
    group: "K",
    home: "Portugal",
    away: "Usbekistan",
    date: "23.06.2026",
    time: "19:00",
  },
  {
    id: "K4",
    group: "K",
    home: "Kolumbien",
    away: "DR Kongo",
    date: "24.06.2026",
    time: "04:00",
  },
  {
    id: "K5",
    group: "K",
    home: "Kolumbien",
    away: "Portugal",
    date: "28.06.2026",
    time: "01:30",
  },
  {
    id: "K6",
    group: "K",
    home: "DR Kongo",
    away: "Usbekistan",
    date: "28.06.2026",
    time: "01:30",
  },
  {
    id: "L1",
    group: "L",
    home: "England",
    away: "Kroatien",
    date: "17.06.2026",
    time: "22:00",
  },
  {
    id: "L2",
    group: "L",
    home: "Ghana",
    away: "Panama",
    date: "18.06.2026",
    time: "01:00",
  },
  {
    id: "L3",
    group: "L",
    home: "England",
    away: "Ghana",
    date: "23.06.2026",
    time: "22:00",
  },
  {
    id: "L4",
    group: "L",
    home: "Panama",
    away: "Kroatien",
    date: "24.06.2026",
    time: "01:00",
  },
  {
    id: "L5",
    group: "L",
    home: "Panama",
    away: "England",
    date: "27.06.2026",
    time: "23:00",
  },
  {
    id: "L6",
    group: "L",
    home: "Kroatien",
    away: "Ghana",
    date: "27.06.2026",
    time: "23:00",
  },
  // Sechzehntelfinale
  {
    id: "R32_1",
    group: "R32",
    home: "Südafrika",
    away: "Kanada",
    date: "28.06.2026",
    time: "21:00",
  },
  {
    id: "R32_2",
    group: "R32",
    home: "Brasilien",
    away: "Japan",
    date: "29.06.2026",
    time: "19:00",
  },
  {
    id: "R32_3",
    group: "R32",
    home: "Deutschland",
    away: "Paraguay",
    date: "29.06.2026",
    time: "22:30",
  },
  {
    id: "R32_4",
    group: "R32",
    home: "Niederlande",
    away: "Marokko",
    date: "30.06.2026",
    time: "03:00",
  },
  {
    id: "R32_5",
    group: "R32",
    home: "Elfenbeinküste",
    away: "Norwegen",
    date: "30.06.2026",
    time: "19:00",
  },
  {
    id: "R32_6",
    group: "R32",
    home: "Frankreich",
    away: "Schweden",
    date: "30.06.2026",
    time: "23:00",
  },
  {
    id: "R32_7",
    group: "R32",
    home: "Mexiko",
    away: "Ecuador",
    date: "01.07.2026",
    time: "03:00",
  },
  {
    id: "R32_8",
    group: "R32",
    home: "England",
    away: "DR Kongo",
    date: "01.07.2026",
    time: "18:00",
  },
  {
    id: "R32_9",
    group: "R32",
    home: "Belgien",
    away: "Senegal",
    date: "01.07.2026",
    time: "22:00",
  },
  {
    id: "R32_10",
    group: "R32",
    home: "USA",
    away: "Bosnien-Herzegowina",
    date: "02.07.2026",
    time: "02:00",
  },
  {
    id: "R32_11",
    group: "R32",
    home: "Spanien",
    away: "2J",
    date: "02.07.2026",
    time: "21:00",
  },
  {
    id: "R32_12",
    group: "R32",
    home: "Portugal",
    away: "Kroatien",
    date: "03.07.2026",
    time: "01:00",
  },
  {
    id: "R32_13",
    group: "R32",
    home: "Schweiz",
    away: "3 E/F/G/I/J",
    date: "03.07.2026",
    time: "05:00",
  },
  {
    id: "R32_14",
    group: "R32",
    home: "Australien",
    away: "Ägypten",
    date: "03.07.2026",
    time: "20:00",
  },
  {
    id: "R32_15",
    group: "R32",
    home: "Argentinien",
    away: "Kap Verde",
    date: "04.07.2026",
    time: "00:00",
  },
  {
    id: "R32_16",
    group: "R32",
    home: "Kolumbien",
    away: "Ghana",
    date: "04.07.2026",
    time: "03:30",
  },
  // Achtelfinale
  {
    id: "R16_1",
    group: "R16",
    home: "Sieger R32_1",
    away: "Sieger R32_4",
    date: "04.07.2026",
    time: "19:00",
  },
  {
    id: "R16_2",
    group: "R16",
    home: "Sieger R32_3",
    away: "Sieger R32_6",
    date: "04.07.2026",
    time: "23:00",
  },
  {
    id: "R16_3",
    group: "R16",
    home: "Sieger R32_2",
    away: "Sieger R32_5",
    date: "05.07.2026",
    time: "22:00",
  },
  {
    id: "R16_4",
    group: "R16",
    home: "Sieger R32_7",
    away: "Sieger R32_8",
    date: "06.07.2026",
    time: "03:00",
  },
  {
    id: "R16_5",
    group: "R16",
    home: "Sieger R32_12",
    away: "Sieger R32_11",
    date: "06.07.2026",
    time: "21:00",
  },
  {
    id: "R16_6",
    group: "R16",
    home: "Sieger R32_10",
    away: "Sieger R32_9",
    date: "07.07.2026",
    time: "03:00",
  },
  {
    id: "R16_7",
    group: "R16",
    home: "Sieger R32_15",
    away: "Sieger R32_14",
    date: "07.07.2026",
    time: "18:00",
  },
  {
    id: "R16_8",
    group: "R16",
    home: "Sieger R32_13",
    away: "Sieger R32_16",
    date: "07.07.2026",
    time: "22:00",
  },
  // Viertelfinale
  {
    id: "QF1",
    group: "QF",
    home: "Sieger R16_2",
    away: "Sieger R16_1",
    date: "09.07.2026",
    time: "22:00",
  },
  {
    id: "QF2",
    group: "QF",
    home: "Sieger R16_5",
    away: "Sieger R16_6",
    date: "10.07.2026",
    time: "21:00",
  },
  {
    id: "QF3",
    group: "QF",
    home: "Sieger R16_3",
    away: "Sieger R16_4",
    date: "11.07.2026",
    time: "23:00",
  },
  {
    id: "QF4",
    group: "QF",
    home: "Sieger R16_7",
    away: "Sieger R16_8",
    date: "12.07.2026",
    time: "03:00",
  },
  // Halbfinale
  {
    id: "SF1",
    group: "SF",
    home: "Sieger QF1",
    away: "Sieger QF2",
    date: "14.07.2026",
    time: "21:00",
  },
  {
    id: "SF2",
    group: "SF",
    home: "Sieger QF3",
    away: "Sieger QF4",
    date: "15.07.2026",
    time: "21:00",
  },
  // Finale & Platz 3
  {
    id: "P3",
    group: "P3",
    home: "Verlierer SF1",
    away: "Verlierer SF2",
    date: "18.07.2026",
    time: "23:00",
  },
  {
    id: "FIN",
    group: "FIN",
    home: "Sieger SF1",
    away: "Sieger SF2",
    date: "19.07.2026",
    time: "21:00",
  },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function parseMatchDate(m) {
  const [d, mo, y] = m.date.split(".");
  const [h, min] = m.time.split(":");
  // WM 2026 takes place in summer, so CEST is UTC+2
  // We construct an ISO string to parse it explicitly with the +02:00 offset
  return new Date(`${y}-${mo}-${d}T${h}:${min}:00+02:00`);
}
const KO_GROUPS = ["R32", "R16", "QF", "SF", "P3", "FIN"];

const SONDER_LOCK = new Date(`2026-06-20T18:00:00+02:00`); // 20. Juni 18:00 CEST
const STAGE_OPTIONS = [
  "Vorrunde",
  "Achtelfinale",
  "Viertelfinale",
  "Halbfinale",
  "Platz 3",
  "Finalist",
  "Weltmeister",
];
const SONDER = [
  {
    id: "weltmeister",
    icon: "🏆",
    label: "Weltmeister",
    desc: "Welches Team gewinnt die WM 2026?",
    pts: 9,
    type: "team",
  },
  {
    id: "finalist",
    icon: "🥈",
    label: "Platz 2",
    desc: "Welches Team verliert das Finale?",
    pts: 6,
    type: "team",
  },
  {
    id: "platz3",
    icon: "🥉",
    label: "Platz 3",
    desc: "Welches Team holt den 3. Platz?",
    pts: 6,
    type: "team",
  },
  {
    id: "topteam",
    icon: "⚽",
    label: "Top-Torjäger-Team",
    desc: "Aus welchem Team kommt der Torschützenkönig?",
    pts: 6,
    type: "team",
  },
  {
    id: "meistetore",
    icon: "🥅",
    label: "Meiste Turnier-Tore",
    desc: "Welches Team erzielt die meisten Tore im gesamten Turnier?",
    pts: 6,
    type: "team",
  },
  {
    id: "fruehexit",
    icon: "💥",
    label: "Früh-Scheitern",
    desc: "Welcher Topfavorit (Stärke ≥87) scheitert vor dem Viertelfinale?",
    pts: 9,
    type: "team",
    minStr: 87,
  },
  {
    id: "schweiz_stage",
    icon: "🇨🇭",
    label: "Wo landet die Schweiz?",
    desc: "Wie weit kommt die Schweiz an der WM 2026?",
    pts: 6,
    type: "stage",
  },
];

const SONDER_KO_LOCK = new Date(`2026-06-28T21:00:00+02:00`);
const SONDER_KO_POPUP_KEY = "sonder_ko_20260628_2100_popup_v2";
const SONDER_KO = [
  {
    id: "ko_tore",
    icon: "🔥",
    label: "Offensiv-Feuerwerk",
    desc: "Welches Team schießt die meisten Tore in der KO-Phase?",
    pts: 5,
    type: "team",
  },
  {
    id: "ko_karten",
    icon: "🟥",
    label: "Karten-Festival",
    desc: "Welches Team kassiert die meisten Roten Karten in der KO-Phase?",
    pts: 5,
    type: "team",
  },
  {
    id: "ko_elfmeter",
    icon: "🥅",
    label: "Elfmeter-Drama",
    desc: "Wie viele Spiele der KO-Phase enden im Elfmeterschießen?",
    pts: 5,
    type: "number",
  },
];

function calcSonderPoints(sonderTip, sonderResults) {
  if (!sonderResults || !sonderTip) return 0;
  const p1 = SONDER.reduce((sum, q) => {
    if (sonderTip[`${q.id}_late`]) return sum;
    if (sonderResults[q.id] && sonderTip[q.id] === sonderResults[q.id])
      return sum + q.pts;
    return sum;
  }, 0);
  const p2 = SONDER_KO.reduce((sum, q) => {
    if (sonderTip[`${q.id}_late`]) return sum;
    if (sonderResults[q.id] && sonderTip[q.id] === sonderResults[q.id])
      return sum + q.pts;
    return sum;
  }, 0);
  return p1 + p2;
}

function hasPenaltyScore(result) {
  return (
    result?.penaltyHomeGoals != null && result?.penaltyAwayGoals != null
  );
}
function ptsLabel(pts) {
  if (pts === 5) return <span className="pts-3">⭐ 5 Pkt</span>;
  if (pts === 3) return <span className="pts-2">✓ 3 Pkt</span>;
  if (pts === 1) return <span className="pts-1">~ 1 Pkt</span>;
  if (pts === 0) return <span className="pts-0">✗ 0 Pkt</span>;
  return null;
}
function strengthColor(s) {
  if (s >= 87) return "#D4AF37";
  if (s >= 80) return "#4ade80";
  if (s >= 72) return "#60a5fa";
  if (s >= 63) return "#fb923c";
  return "#9ca3af";
}
function calcStandings(group, results) {
  const teams = GROUPS[group];
  const stats = {};
  teams.forEach((t) => {
    stats[t] = { sp: 0, s: 0, u: 0, n: 0, gf: 0, ga: 0, pts: 0 };
  });
  MATCHES.filter((m) => m.group === group).forEach((m) => {
    const r = results[m.id];
    if (!r || r.homeGoals == null) return;
    const h = stats[m.home],
      a = stats[m.away];
    h.sp++;
    a.sp++;
    h.gf += r.homeGoals;
    h.ga += r.awayGoals;
    a.gf += r.awayGoals;
    a.ga += r.homeGoals;
    if (r.homeGoals > r.awayGoals) {
      h.s++;
      h.pts += 3;
      a.n++;
    } else if (r.homeGoals < r.awayGoals) {
      a.s++;
      a.pts += 3;
      h.n++;
    } else {
      h.u++;
      h.pts++;
      a.u++;
      a.pts++;
    }
  });
  return teams
    .map((t) => ({ name: t, ...stats[t], gd: stats[t].gf - stats[t].ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

// ── SVG EYE ───────────────────────────────────────────────────────────────────
function Eye({ show }) {
  return show ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── TEAM FLAG CELL ────────────────────────────────────────────────────────────
function TeamCell({ name, align = "left", onClick }) {
  const t = TEAMS[name] || { code: null, strength: 0 };
  const sc = strengthColor(t.strength);
  const flag = t.code ? (
    <img
      src={flagUrl(t.code)}
      className="team-flag-img"
      alt={name}
      loading="lazy"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    />
  ) : null;
  const badge = (
    <span className="str-badge" style={{ color: sc }}>
      {t.strength}
    </span>
  );
  const nameEl = (
    <span
      className="team-cell-name"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {name}
    </span>
  );
  return (
    <div className={`team-cell ${align}`}>
      {align === "left" && (
        <>
          {flag}
          {nameEl}
          {badge}
        </>
      )}
      {align === "right" && (
        <>
          {badge}
          {nameEl}
          {flag}
        </>
      )}
    </div>
  );
}

// ── MATCH MODAL ────────────────────────────────────────────────────────────────
function MatchModal({ match, onClose, results }) {
  function renderTeamStats(team) {
    const t = TEAMS[team] || {};
    const sc = strengthColor(t.strength || 0);
    const teamMatches = MATCHES.filter(
      (m) => m.home === team || m.away === team,
    );
    const stats = teamMatches.reduce(
      (s, m) => {
        const r = results[m.id];
        if (!r || r.homeGoals == null) return s;
        const isH = m.home === team;
        const gf = isH ? r.homeGoals : r.awayGoals,
          ga = isH ? r.awayGoals : r.homeGoals;
        const diff = gf - ga;
        return {
          ...s,
          sp: s.sp + 1,
          gf: s.gf + gf,
          ga: s.ga + ga,
          s: s.s + (diff > 0 ? 1 : 0),
          u: s.u + (diff === 0 ? 1 : 0),
          n: s.n + (diff < 0 ? 1 : 0),
        };
      },
      { sp: 0, gf: 0, ga: 0, s: 0, u: 0, n: 0 },
    );

    // Bisherige Spiele ohne dieses Match
    const pastMatches = teamMatches.filter(
      (m) =>
        m.id !== match.id && results[m.id] && results[m.id].homeGoals != null,
    );

    return (
      <div className="match-modal-team">
        <div className="modal-head">
          {t.code && (
            <img
              src={flagUrl(t.code)}
              className="modal-flag"
              alt={team}
              style={{ width: "40px", height: "28px" }}
            />
          )}
          <div>
            <h2 className="modal-team-name" style={{ fontSize: "22px" }}>
              {team}
            </h2>
            <span
              className="modal-strength"
              style={{ color: sc, fontSize: "11px" }}
            >
              Stärke: {t.strength}/100
            </span>
          </div>
        </div>

        {stats.sp > 0 && (
          <div
            className="modal-stats"
            style={{ padding: "12px", marginBottom: "16px" }}
          >
            <div className="modal-stats-title">WM-Statistik</div>
            <table className="modal-stats-table">
              <thead>
                <tr>
                  <th>Sp</th>
                  <th>S</th>
                  <th>U</th>
                  <th>N</th>
                  <th>Tore</th>
                  <th>Diff</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{stats.sp}</td>
                  <td className="gt-s">{stats.s}</td>
                  <td>{stats.u}</td>
                  <td className="gt-n">{stats.n}</td>
                  <td>
                    {stats.gf}:{stats.ga}
                  </td>
                  <td
                    style={{
                      color:
                        stats.gf - stats.ga > 0
                          ? "var(--green)"
                          : stats.gf - stats.ga < 0
                            ? "var(--red)"
                            : "var(--muted)",
                    }}
                  >
                    {stats.gf - stats.ga > 0
                      ? "+" + (stats.gf - stats.ga)
                      : stats.gf - stats.ga}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {pastMatches.length > 0 && (
          <div className="modal-matches">
            <div className="modal-matches-title">Bisherige Spiele</div>
            <div className="modal-matches-list">
              {pastMatches.map((m) => {
                const r = results[m.id];
                const isHome = m.home === team;
                const opp = isHome ? m.away : m.home;
                const oppCode = TEAMS[opp]?.code;
                const gf = isHome ? r.homeGoals : r.awayGoals;
                const ga = isHome ? r.awayGoals : r.homeGoals;
                const resClass = gf > ga ? "win" : gf === ga ? "draw" : "loss";
                const isKo = KO_GROUPS.includes(m.group);
                const grpLbl = isKo
                  ? {
                      R32: "Sechzehntelfinale",
                      R16: "Achtelfinale",
                      QF: "Viertelfinale",
                      SF: "Halbfinale",
                      P3: "Platz 3",
                      FIN: "Finale",
                    }[m.group] || m.group
                  : `Gruppe ${m.group}`;

                return (
                  <div
                    key={m.id}
                    className="modal-match-item"
                    style={{ padding: "8px 12px" }}
                  >
                    <div className="modal-match-info">
                      <span className="modal-match-date">
                        {m.date} - {grpLbl}
                      </span>
                      <div
                        className="modal-match-opp"
                        style={{ fontSize: "13px" }}
                      >
                        vs.{" "}
                        {oppCode && (
                          <img
                            src={flagUrl(oppCode)}
                            className="modal-match-flag"
                            alt=""
                          />
                        )}{" "}
                        {opp}
                      </div>
                    </div>
                    <div
                      className={`modal-match-res ${resClass}`}
                      style={{ fontSize: "18px" }}
                    >
                      {gf}:{ga}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const isKo = !TEAMS[match.home];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", width: "95%" }}
      >
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div
          className="match-modal-title"
          style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "var(--muted)",
            fontSize: "12px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontWeight: "600",
          }}
        >
          H2H Vergleich
        </div>
        {isKo ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "var(--muted)",
            }}
          >
            Für K.O.-Spiele stehen die Teams noch nicht fest.
          </div>
        ) : (
          <div className="match-modal-grid">
            {renderTeamStats(match.home)}
            <div className="match-modal-vs">VS</div>
            {renderTeamStats(match.away)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── GROUP TABLE ───────────────────────────────────────────────────────────────
function GroupTable({ group, results, onTeamClick }) {
  const standings = calcStandings(group, results);
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
      {standings.map((s, i) => (
        <div
          key={s.name}
          className={`gt-row${i < 2 ? " qualifies" : i === 2 ? " maybe" : ""}`}
        >
          <span className="gt-c gt-pos gt-pos-num">{i + 1}</span>
          <span className="gt-c gt-team-cell">
            {TEAMS[s.name]?.code && (
              <img
                src={flagUrl(TEAMS[s.name].code)}
                className="gt-flag"
                alt={s.name}
              />
            )}
            <span className="gt-name">{s.name}</span>
          </span>
          <span className="gt-c">{s.sp}</span>
          <span className="gt-c gt-s">{s.s}</span>
          <span className="gt-c">{s.u}</span>
          <span className="gt-c gt-n">{s.n}</span>
          <span className="gt-c gt-goals">
            {s.gf}:{s.ga}
          </span>
          <span
            className="gt-c gt-diff-val"
            style={{
              color:
                s.gd > 0
                  ? "var(--green)"
                  : s.gd < 0
                    ? "var(--red)"
                    : "var(--muted)",
            }}
          >
            {s.gd > 0 ? "+" : ""}
            {s.gd}
          </span>
          <span className="gt-c gt-pts-val">{s.pts}</span>
        </div>
      ))}
      <div className="gt-legend">
        <span className="legend-q">■</span> Qualifiziert &nbsp;
        <span className="legend-m">■</span> Evtl. weiter
      </div>
    </div>
  );
}

// ── MATCH EVENTS ─────────────────────────────────────────────────────────────
function MatchEvents({ events, match, isLive = false }) {
  const [open, setOpen] = useState(isLive);
  useEffect(() => {
    if (isLive) setOpen(true);
  }, [isLive]);
  const goals = events.filter((e) => e.type === "Goal");
  const cards = events.filter((e) => e.type === "Card");
  return (
    <div className="match-events">
      <button className="events-toggle" onClick={() => setOpen((v) => !v)}>
        {goals.length > 0 && <span>⚽ {goals.length}</span>}
        {cards.filter((c) => c.detail?.includes("Yellow")).length > 0 && (
          <span>
            🟨 {cards.filter((c) => c.detail?.includes("Yellow")).length}
          </span>
        )}
        {cards.filter((c) => c.detail?.includes("Red")).length > 0 && (
          <span>
            🟥 {cards.filter((c) => c.detail?.includes("Red")).length}
          </span>
        )}
        <span className={`events-chevron${open ? " open" : ""}`}>›</span>
      </button>
      {open && (
        <div className="events-list">
          {events.map((e, i) => {
            const isHome =
              e.teamName === match.home ||
              TEAM_MAP_DE[e.teamName] === match.home;
            const icon =
              e.type === "Goal"
                ? e.detail === "Own Goal"
                  ? "⚽🔄"
                  : "⚽"
                : e.detail?.includes("Red")
                  ? "🟥"
                  : "🟨";
            const timeStr = e.extra ? `${e.time}+${e.extra}'` : `${e.time}'`;
            return (
              <div key={i} className={`event-row${isHome ? " home" : " away"}`}>
                {isHome && (
                  <>
                    <span className="event-player">{e.player}</span>
                    {e.assist && (
                      <span className="event-assist">({e.assist})</span>
                    )}
                    <span className="event-time">{timeStr}</span>
                    <span className="event-icon">{icon}</span>
                  </>
                )}
                {!isHome && (
                  <>
                    <span className="event-icon">{icon}</span>
                    <span className="event-time">{timeStr}</span>
                    <span className="event-player">{e.player}</span>
                    {e.assist && (
                      <span className="event-assist">({e.assist})</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MATCH CARD ────────────────────────────────────────────────────────────────
function MatchCard({
  match,
  tip,
  result,
  allResults,
  now,
  onSave,
  onMatchClick,
  compact = false,
  featured = false,
  allTips = [],
  allUsers = [],
  allEvents = {},
}) {
  const kickoff = parseMatchDate(match);
  const locked = now >= kickoff;
  const hasResult = hasMatchScore(result);
  const isLive =
    (now >= kickoff && now.getTime() <= kickoff.getTime() + 115 * 60 * 1000) ||
    result?.status === "LIVE";
  const isKo = !TEAMS[match.home];
  const isKoGroup = KO_GROUPS.includes(match.group);
  const [h, setH] = useState(tip?.homeGoals ?? "");
  const [a, setA] = useState(tip?.awayGoals ?? "");
  const [penWinner, setPenWinner] = useState(tip?.penaltyWinner || null);
  const pts = hasResult && tip ? calcPoints(tip, result) : null;
  const venue = VENUES[match.id];
  const tipIsDraw = h !== "" && a !== "" && +h === +a;
  const resultIsDraw =
    result && result.homeGoals != null && result.homeGoals === result.awayGoals;
  const showDeadline = !locked && !tip && kickoff - now <= 3600000;

  const currentEvents = allEvents[match.id] || [];
  let liveHomeGoals = isLive && !hasResult ? 0 : null;
  let liveAwayGoals = isLive && !hasResult ? 0 : null;
  if (isLive && !hasResult && currentEvents.length > 0) {
    currentEvents.forEach((e) => {
      if (e.type === "Goal") {
        const isHome =
          e.teamName === match.home || TEAM_MAP_DE[e.teamName] === match.home;
        const isOwnGoal = e.detail === "Own Goal";
        if (isHome) {
          if (isOwnGoal) liveAwayGoals++;
          else liveHomeGoals++;
        } else {
          if (isOwnGoal) liveHomeGoals++;
          else liveAwayGoals++;
        }
      }
    });
  }

  useEffect(() => {
    setH(tip?.homeGoals ?? "");
    setA(tip?.awayGoals ?? "");
    setPenWinner(tip?.penaltyWinner || null);
  }, [tip]);
  function handleBlur() {
    if (h === "" || a === "") return;
    if (isKoGroup && +h === +a && !penWinner) return;
    onSave(match.id, h, a, isKoGroup && +h === +a ? penWinner : null);
  }
  function handlePen(pw) {
    setPenWinner(pw);
    onSave(match.id, h, a, pw);
  }

  const homeCode = TEAMS[match.home]?.code;
  const awayCode = TEAMS[match.away]?.code;

  const grpLbl = isKo
    ? {
        R32: "Sechzehntelfinale",
        R16: "Achtelfinale",
        QF: "Viertelfinale",
        SF: "Halbfinale",
        P3: "Platz 3",
        FIN: "Finale",
      }[match.group] || match.group
    : `Gruppe ${match.group}`;
  const hStr = TEAMS[match.home]?.strength,
    aStr = TEAMS[match.away]?.strength;

  const getTeamStats = (team) => {
    if (!team || !allResults) return null;
    const teamMatches = MATCHES.filter(
      (m) => m.home === team || m.away === team,
    );
    const stats = teamMatches.reduce(
      (s, m) => {
        const r = allResults[m.id];
        if (!r || r.homeGoals == null) return s;
        const isH = m.home === team;
        const gf = isH ? r.homeGoals : r.awayGoals;
        const ga = isH ? r.awayGoals : r.homeGoals;
        const diff = gf - ga;
        return {
          sp: s.sp + 1,
          s: s.s + (diff > 0 ? 1 : 0),
          u: s.u + (diff === 0 ? 1 : 0),
          n: s.n + (diff < 0 ? 1 : 0),
          gf: s.gf + gf,
          ga: s.ga + ga,
        };
      },
      { sp: 0, s: 0, u: 0, n: 0, gf: 0, ga: 0 },
    );
    return stats.sp > 0 ? stats : null;
  };

  const homeStats = !isKo ? getTeamStats(match.home) : null;
  const awayStats = !isKo ? getTeamStats(match.away) : null;

  return (
    <div
      className={`match-card mc2${featured ? " mc2-featured" : ""}${hasResult ? " has-result" : ""}${locked ? " locked" : ""}`}
    >
      {featured ? (
        <div className="mc2-head">
          <span className="mc2-grp">{grpLbl}</span>
          {isLive ? (
            <span className="mc2-livebadge">
              <span className="live-dot" />
              LIVE
            </span>
          ) : !locked ? (
            <Countdown kickoff={kickoff} />
          ) : null}
          {!isKo && onMatchClick && (
            <button
              className="mc2-stats-btn"
              onClick={() => onMatchClick(match)}
              title="H2H Stats"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="match-meta">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              flex: 1,
            }}
          >
            {isLive && <span className="live-dot" />}
            {match.date} · {match.time} CEST
            {showDeadline && <span className="deadline-badge">&lt;1h</span>}
            <span className="mc2-metagrp"> · {grpLbl}</span>
          </div>
          {!isKo && onMatchClick && (
            <button
              className="mc2-stats-btn"
              onClick={() => onMatchClick(match)}
              title="H2H Stats"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="mc2-row">
        <div className="mc2-team">
          {homeCode && (
            <img src={flagUrl(homeCode)} className="mc2-flag" alt="" />
          )}
          <span className="mc2-name">{match.home}</span>
          {!isKo && hStr != null && (
            <span
              className="mc2-str"
              style={{
                color: strengthColor(hStr),
                background: strengthColor(hStr) + "24",
              }}
            >
              {hStr}
            </span>
          )}
        </div>

        <div className="mc2-center">
          {hasResult ? (
            <>
              <div className="result-score">
                <span className="result-score-team">
                  {result.homeGoals}
                  {hasPenaltyScore(result) && (
                    <small>({result.penaltyHomeGoals})</small>
                  )}
                </span>
                <span className="score-sep">:</span>
                <span className="result-score-team">
                  {result.awayGoals}
                  {hasPenaltyScore(result) && (
                    <small>({result.penaltyAwayGoals})</small>
                  )}
                </span>
              </div>
              {tip != null ? (
                <div className="mc2-yourtip">
                  Tipp {tip.homeGoals}:{tip.awayGoals} {ptsLabel(pts)}
                </div>
              ) : (
                <div className="no-tip-label">kein Tipp abgegeben</div>
              )}
            </>
          ) : isLive && liveHomeGoals != null ? (
            <>
              <div className="result-score" style={{ color: "var(--red)" }}>
                {liveHomeGoals}
                <span className="score-sep">:</span>
                {liveAwayGoals}
              </div>
              {tip != null ? (
                <div className="mc2-yourtip">
                  Dein Tipp {tip.homeGoals}:{tip.awayGoals}
                </div>
              ) : (
                <div className="no-tip-label">kein Tipp abgegeben</div>
              )}
            </>
          ) : locked ? (
            <>
              <div className="tip-locked-score">
                {tip != null ? `${tip.homeGoals}:${tip.awayGoals}` : "?:?"}
              </div>
              <div className="mc2-tiplabel">
                {tip != null ? "Dein Tipp" : "Kein Tipp"}
              </div>
            </>
          ) : (
            <>
              {featured && <div className="mc2-time">{match.time} CEST</div>}
              <div className="tip-inputs-row">
                <input
                  className="tip-inp"
                  type="number"
                  min="0"
                  max="99"
                  value={h}
                  onChange={(e) => setH(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="–"
                />
                <span className="score-sep-input">:</span>
                <input
                  className="tip-inp"
                  type="number"
                  min="0"
                  max="99"
                  value={a}
                  onChange={(e) => setA(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="–"
                />
              </div>
              <div className="mc2-tiplabel">
                Dein Tipp
                {tip != null && h !== "" && (
                  <span className="saved-tick"> ✓</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mc2-team">
          {awayCode && (
            <img src={flagUrl(awayCode)} className="mc2-flag" alt="" />
          )}
          <span className="mc2-name">{match.away}</span>
          {!isKo && aStr != null && (
            <span
              className="mc2-str"
              style={{
                color: strengthColor(aStr),
                background: strengthColor(aStr) + "24",
              }}
            >
              {aStr}
            </span>
          )}
        </div>
      </div>

      {(homeStats || awayStats) && (
        <div className="mc2-bottom-stats">
          {homeStats && (
            <div className="bstats-side bstats-left">
              <span className="bstats-lbl">Sp</span>
              <span className="bstats-val">{homeStats.sp}</span>
              <span className="bstats-sep"></span>
              <span className="bstats-lbl">S-U-N</span>
              <span className="bstats-val">
                <span className="gt-s">{homeStats.s}</span>-
                <span className="gt-u">{homeStats.u}</span>-
                <span className="gt-n">{homeStats.n}</span>
              </span>
              <span className="bstats-sep"></span>
              <span className="bstats-lbl">Tor</span>
              <span className="bstats-val">
                {homeStats.gf}:{homeStats.ga}
              </span>
              <span className="bstats-sep"></span>
              <span className="bstats-lbl">Diff</span>
              <span
                className={`bstats-val ${homeStats.gf - homeStats.ga > 0 ? "gt-s" : homeStats.gf - homeStats.ga < 0 ? "gt-n" : ""}`}
              >
                {homeStats.gf - homeStats.ga > 0 ? "+" : ""}
                {homeStats.gf - homeStats.ga}
              </span>
            </div>
          )}
          {awayStats && (
            <div className="bstats-side bstats-right">
              <span className="bstats-lbl">Sp</span>
              <span className="bstats-val">{awayStats.sp}</span>
              <span className="bstats-sep"></span>
              <span className="bstats-lbl">S-U-N</span>
              <span className="bstats-val">
                <span className="gt-s">{awayStats.s}</span>-
                <span className="gt-u">{awayStats.u}</span>-
                <span className="gt-n">{awayStats.n}</span>
              </span>
              <span className="bstats-sep"></span>
              <span className="bstats-lbl">Tor</span>
              <span className="bstats-val">
                {awayStats.gf}:{awayStats.ga}
              </span>
              <span className="bstats-sep"></span>
              <span className="bstats-lbl">Diff</span>
              <span
                className={`bstats-val ${awayStats.gf - awayStats.ga > 0 ? "gt-s" : awayStats.gf - awayStats.ga < 0 ? "gt-n" : ""}`}
              >
                {awayStats.gf - awayStats.ga > 0 ? "+" : ""}
                {awayStats.gf - awayStats.ga}
              </span>
            </div>
          )}
        </div>
      )}

      {featured && venue && (
        <div className="mc2-venue">
          📍 {venue.stadium} · {venue.city}
        </div>
      )}

      {isKoGroup && tipIsDraw && !locked && !hasResult && (
        <div className="pen-row">
          <span className="pen-label">
            Elfmetersieger auswählen <em>Pflicht</em>
          </span>
          <button
            className={`pen-btn${penWinner === "home" ? " active" : ""}`}
            onClick={() => handlePen("home")}
          >
            {match.home}
          </button>
          <button
            className={`pen-btn${penWinner === "away" ? " active" : ""}`}
            onClick={() => handlePen("away")}
          >
            {match.away}
          </button>
        </div>
      )}
      {isKoGroup && locked && tip && tipIsDraw && tip.penaltyWinner && (
        <div className="pen-locked">
          {tip.penaltyWinner === "home" ? match.home : match.away} i.E.
        </div>
      )}
      {isKoGroup && hasResult && resultIsDraw && result.penaltyWinner && (
        <div className="pen-locked result">
          {result.penaltyWinner === "home" ? match.home : match.away} i.E.
        </div>
      )}

      {locked && (
        <MatchTipsPanel
          matchId={match.id}
          match={match}
          allTips={allTips}
          allUsers={allUsers}
          result={hasResult ? result : null}
        />
      )}
      {(hasResult || isLive) && currentEvents.length > 0 && (
        <MatchEvents events={currentEvents} match={match} isLive={isLive} />
      )}
    </div>
  );
}

// ── NEXT MATCH COUNTDOWN ──────────────────────────────────────────────────────
function Countdown({ kickoff }) {
  const [txt, setTxt] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = kickoff - new Date();
      if (diff <= 0) {
        setTxt("Läuft jetzt!");
        return;
      }
      const d = Math.floor(diff / 86400000),
        h = Math.floor((diff % 86400000) / 3600000),
        m = Math.floor((diff % 3600000) / 60000),
        s = Math.floor((diff % 60000) / 1000);
      setTxt(d > 0 ? `${d}T ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [kickoff]);
  return <span className="countdown-txt">{txt}</span>;
}

// ── LIVE VIEW ─────────────────────────────────────────────────────────────────
function LiveView({
  tips,
  results,
  now,
  uid,
  onSave,
  onMatchClick,
  allTips = [],
  allUsers = [],
  allEvents = {},
}) {
  const allParsed = MATCHES.map((m) => ({ ...m, kickoff: parseMatchDate(m) }));

  const liveMatches = allParsed.filter(
    (m) =>
      (now >= m.kickoff &&
        now.getTime() <= m.kickoff.getTime() + 115 * 60 * 1000) ||
      results[m.id]?.status === "LIVE",
  );

  if (!liveMatches.length)
    return (
      <p style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>
        Aktuell finden keine Spiele statt.
      </p>
    );

  return (
    <div>
      <div className="next-header">
        <span className="next-label" style={{ color: "var(--red)" }}>
          <span className="live-dot" /> Aktuelles Spiel (LIVE)
        </span>
      </div>
      {liveMatches.map((m) => (
        <MatchCard
          allResults={results}
          key={m.id}
          match={m}
          tip={tips[m.id]}
          result={results[m.id]}
          now={now}
          onSave={onSave}
          onMatchClick={onMatchClick}
          featured
          allTips={allTips}
          allUsers={allUsers}
          allEvents={allEvents}
        />
      ))}
    </div>
  );
}

// ── NEXT VIEW ─────────────────────────────────────────────────────────────────
function NextView({
  tips,
  results,
  now,
  uid,
  onSave,
  onMatchClick,
  allTips = [],
  allUsers = [],
  allEvents = {},
}) {
  const allParsed = MATCHES.map((m) => ({ ...m, kickoff: parseMatchDate(m) }));

  const upcoming = allParsed
    .filter((m) => m.kickoff > now)
    .sort((a, b) => a.kickoff - b.kickoff);

  if (!upcoming.length)
    return (
      <p style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>
        Alle Spiele sind abgeschlossen.
      </p>
    );

  const nextTs = upcoming.length > 0 ? upcoming[0].kickoff.getTime() : null;
  const concurrent = nextTs
    ? upcoming.filter((m) => m.kickoff.getTime() === nextTs)
    : [];
  const further = upcoming.slice(concurrent.length, concurrent.length + 6);

  return (
    <div>
      {concurrent.length > 0 && (
        <>
          <div className="next-header">
            <span className="next-label">
              {concurrent.length > 1 ? "Nächste Spiele" : "Nächstes Spiel"}
            </span>
          </div>
          {concurrent.length > 1 && (
            <div className="concurrent-note flex items-center justify-center gap-1.5">
              <Info size={14} strokeWidth={2} /> {concurrent.length} Spiele
              gleichzeitig · {upcoming[0].date} · {upcoming[0].time} CEST
            </div>
          )}
          {concurrent.map((m) => (
            <MatchCard
              allResults={results}
              key={m.id}
              match={m}
              tip={tips[m.id]}
              result={results[m.id]}
              now={now}
              onSave={onSave}
              onMatchClick={onMatchClick}
              featured
              allTips={allTips}
              allUsers={allUsers}
              allEvents={allEvents}
            />
          ))}
        </>
      )}
      {further.length > 0 && (
        <div className="upcoming-section">
          <div className="next-header">
            <span className="next-label">Weitere Spiele</span>
          </div>
          {further.map((m) => (
            <MatchCard
              allResults={results}
              key={m.id}
              match={m}
              tip={tips[m.id]}
              result={results[m.id]}
              now={now}
              onSave={onSave}
              onMatchClick={onMatchClick}
              allTips={allTips}
              allUsers={allUsers}
              allEvents={allEvents}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SPIELPLAN TAB ─────────────────────────────────────────────────────────────
function SpielplanTab({ results, onTeamClick }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  function dateStr(d) {
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  }
  function fmtDay(s) {
    const [d, m, y] = s.split("."),
      dt = new Date(+y, +m - 1, +d);
    const dn = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      mn = [
        "Jan",
        "Feb",
        "Mär",
        "Apr",
        "Mai",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Dez",
      ];
    return `${dn[dt.getDay()]}, ${d}. ${mn[+m - 1]}.`;
  }

  const todayStr = dateStr(now);
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const allDates = [...new Set(MATCHES.map((m) => m.date))].sort((a, b) => {
    const [da, ma, ya] = a.split("."),
      [db, mb, yb] = b.split(".");
    return new Date(+ya, +ma - 1, +da) - new Date(+yb, +mb - 1, +db);
  });

  const upcomingDates = allDates
    .filter((s) => {
      const [d, m, y] = s.split(".");
      return new Date(+y, +m - 1, +d) >= todayMidnight;
    })
    .slice(0, 7);

  const recentDates = allDates
    .filter((s) => {
      const [d, m, y] = s.split(".");
      const dt = new Date(+y, +m - 1, +d);
      return (
        dt < todayMidnight &&
        dt >= new Date(todayMidnight.getTime() - 3 * 86400000)
      );
    })
    .reverse()
    .slice(0, 2);

  function SpRow({ m }) {
    const r = results[m.id];
    const kickoff = parseMatchDate(m);
    const isLive =
      (now >= kickoff &&
        now <= new Date(kickoff.getTime() + 115 * 60 * 1000)) ||
      r?.status === "LIVE";
    const isDone = r && r.homeGoals != null;
    const isKo = !TEAMS[m.home];
    const grpLbl = KO_GROUPS.includes(m.group)
      ? {
          R32: "Sechzehntelfinale",
          R16: "Achtelfinale",
          QF: "Viertelfinale",
          SF: "Halbfinale",
          P3: "Platz 3",
          FIN: "Finale",
        }[m.group] || m.group
      : `Gruppe ${m.group}`;
    const homeCode = TEAMS[m.home]?.code;
    const awayCode = TEAMS[m.away]?.code;
    return (
      <div
        className={`sp2-match${isLive ? " sp2-live" : isDone ? " sp2-done" : ""}`}
      >
        <div className="sp2-row">
          <div className="sp2-home">
            <span className="sp2-tname">{m.home}</span>
            {homeCode && (
              <img src={flagUrl(homeCode)} className="sp2-flag" alt="" />
            )}
          </div>
          <div className="sp2-center">
            {isDone ? (
              <span className="sp2-score">
                {r.homeGoals}:{r.awayGoals}
              </span>
            ) : isLive ? (
              <>
                <span className="sp2-score sp2-score-live">
                  {r?.homeGoals ?? 0}:{r?.awayGoals ?? 0}
                </span>
                <span className="sp2-live-lbl">
                  <span className="sp2-pulse">●</span> LIVE
                </span>
              </>
            ) : (
              <span className="sp2-time">{m.time}</span>
            )}
          </div>
          <div className="sp2-away">
            {awayCode && (
              <img src={flagUrl(awayCode)} className="sp2-flag" alt="" />
            )}
            <span className="sp2-tname">{m.away}</span>
          </div>
        </div>
        <div
          className="sp2-sub"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <span>{grpLbl}</span>
          {!isKo && onTeamClick && (
            <button
              className="mc2-stats-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTeamClick(m);
              }}
              style={{
                position: "absolute",
                right: "0",
                padding: "2px 4px",
                background: "transparent",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
              }}
              title="H2H Stats"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  function DayBlock({ s, highlight }) {
    const ms = MATCHES.filter((m) => m.date === s);
    return (
      <div className={`sp2-day${highlight ? " sp2-today" : ""}`}>
        <div className="sp2-day-hdr">
          <span className="sp2-day-lbl">{fmtDay(s)}</span>
          {highlight && <span className="sp2-today-pill">Heute</span>}
          <span className="sp2-day-cnt">
            {ms.length} Spiel{ms.length !== 1 ? "e" : ""}
          </span>
        </div>
        {ms.map((m) => (
          <SpRow key={m.id} m={m} />
        ))}
      </div>
    );
  }

  const hasToday = upcomingDates.includes(todayStr);

  return (
    <div className="spielplan-tab">
      {!hasToday && (
        <div className="sp2-day sp2-today">
          <div className="sp2-day-hdr">
            <span className="sp2-day-lbl">{fmtDay(todayStr)}</span>
            <span className="sp2-today-pill">Heute</span>
          </div>
          <div className="sp-no-games">Keine Spiele heute</div>
        </div>
      )}
      {upcomingDates.map((s) => (
        <DayBlock key={s} s={s} highlight={s === todayStr} />
      ))}
      {recentDates.length > 0 && (
        <div className="sp-recent-title">Letzte Ergebnisse</div>
      )}
      {recentDates.map((s) => (
        <DayBlock key={s} s={s} />
      ))}
    </div>
  );
}

// ── MATCH TIPS PANEL ─────────────────────────────────────────────────────────
function TipRows({ matchTips, allUsers, result, match }) {
  return matchTips.map((tip) => {
    const user = allUsers.find((entry) => entry.uid === tip.uid);
    const points = result?.status === "LIVE" ? null : calcPoints(tip, result);
    const isKnockoutDraw =
      KO_GROUPS.includes(match.group) && tip.homeGoals === tip.awayGoals;
    const shootoutTeam = tip.penaltyWinner
      ? tip.penaltyWinner === "home"
        ? match.home
        : match.away
      : null;
    return (
      <div key={tip.uid} className="tips-row">
        <InitialsAvatar
          name={user?.displayName || "?"}
          uid={tip.uid}
          size={20}
        />
        <span className="tips-name">{user?.displayName || "?"}</span>
        <span className="tips-pick">
          <strong className="tips-score">
            {tip.homeGoals}:{tip.awayGoals}
          </strong>
          {shootoutTeam ? (
            <small>{shootoutTeam} i.E.</small>
          ) : isKnockoutDraw ? (
            <small className="missing">kein Elfmetersieger</small>
          ) : null}
        </span>
        {points != null && (
          <span className={`tips-pts pts-${points}`}>{points}P</span>
        )}
      </div>
    );
  });
}

function MatchTipsPanel({ matchId, match, allTips, allUsers, result }) {
  const [open, setOpen] = useState(false);
  const matchTips = allTips.filter((t) => t.matchId === matchId);
  if (matchTips.length === 0) return null;
  return (
    <div className="tips-panel">
      <button className="tips-toggle" onClick={() => setOpen((v) => !v)}>
        👥 {matchTips.length} Tipp{matchTips.length !== 1 ? "s" : ""}
        <span className={`tips-chevron${open ? " open" : ""}`}>›</span>
      </button>
      {open && (
        <div className="tips-list">
          <TipRows
            matchTips={matchTips}
            allUsers={allUsers}
            result={result}
            match={match}
          />
        </div>
      )}
    </div>
  );
}

// ── COMBINED MATCHES VIEW ──────────────────────────────────────────────────
function CombinedMatchesView({
  type,
  tips,
  results,
  now,
  uid,
  onSave,
  onMatchClick,
  allTips = [],
  allUsers = [],
  allEvents = {},
}) {
  const allParsed = MATCHES.map((m) => ({ ...m, kickoff: parseMatchDate(m) }));

  const sections = [];
  const groupOrder = [...Object.keys(GROUPS), ...KO_GROUPS];
  const koLabels = {
    R32: "Sechzehntelfinale",
    R16: "Achtelfinale",
    QF: "Viertelfinale",
    SF: "Halbfinale",
    P3: "Platz 3",
    FIN: "Finale",
  };

  for (const g of groupOrder) {
    const isKo = KO_GROUPS.includes(g);
    const matches = allParsed.filter((m) => m.group === g);

    let sectionMatches = matches.filter((m) => {
      const hasTip = tips[m.id] != null;
      if (type === "OFFEN") return !hasTip && m.kickoff > now;
      if (type === "GETIPPT") return hasTip || (m.kickoff <= now && !hasTip); // Getippte Spiele UND verpasste Spiele
      return false;
    });

    if (sectionMatches.length > 0) {
      sections.push({
        groupId: g,
        title: isKo ? koLabels[g] || g : `Gruppe ${g}`,
        matches: sectionMatches,
      });
    }
  }

  if (sections.length === 0) {
    return (
      <p style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>
        Keine Spiele in dieser Kategorie.
      </p>
    );
  }

  return (
    <div>
      {sections.map((sec) => (
        <div key={sec.groupId} style={{ marginBottom: 24 }}>
          <div
            className="next-header"
            style={{
              borderBottom: "1px solid var(--dark-4)",
              paddingBottom: "8px",
            }}
          >
            <span className="next-label">{sec.title}</span>
          </div>
          {sec.matches.map((m) => (
            <MatchCard
              allResults={results}
              key={m.id}
              match={m}
              tip={tips[m.id]}
              result={results[m.id]}
              now={now}
              onSave={onSave}
              onMatchClick={onMatchClick}
              allTips={allTips}
              allUsers={allUsers}
              allEvents={allEvents}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── TIPPEN TAB ────────────────────────────────────────────────────────────────
// ── SONDERTIPPS ───────────────────────────────────────────────────────────────
function getKnockoutTeams(results) {
  const r32Teams = MATCHES.filter((m) => m.group === "R32").flatMap((m) => {
    const result = results[m.id] || {};
    return [result.koHome || m.home, result.koAway || m.away];
  });

  const groupMatches = MATCHES.filter((m) => GROUPS[m.group]);
  const groupStageComplete = groupMatches.every((m) => {
    const result = results[m.id];
    return result?.homeGoals != null && result?.awayGoals != null;
  });

  let qualifiedTeams = r32Teams.filter((team) => TEAMS[team]);
  if (groupStageComplete) {
    const groupStandings = Object.keys(GROUPS).map((group) =>
      calcStandings(group, results),
    );
    const topTwo = groupStandings.flatMap((standings) =>
      standings.slice(0, 2).map((team) => team.name),
    );
    const bestThirds = groupStandings
      .map((standings) => standings[2])
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      .slice(0, 8)
      .map((team) => team.name);
    qualifiedTeams = [...topTwo, ...bestThirds];
  }

  return [...new Set(qualifiedTeams)].sort(
    (a, b) =>
      TEAMS[b].strength - TEAMS[a].strength || a.localeCompare(b, "de"),
  );
}

function SonderTeamPicker({ options, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const closePicker = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closePicker);
    return () => document.removeEventListener("pointerdown", closePicker);
  }, [open]);

  return (
    <div className="sonder-team-picker" ref={pickerRef}>
      <button
        type="button"
        className={`sonder-team-trigger${open ? " open" : ""}${value ? " has-value" : ""}`}
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
      >
        <span className="sonder-team-trigger-main">
          {value && TEAMS[value]?.code ? (
            <img src={flagUrl(TEAMS[value].code)} alt="" />
          ) : (
            <span className="sonder-team-placeholder-icon">⚽</span>
          )}
          <span>
            <small>{value ? "Deine Auswahl" : "Team auswählen"}</small>
            <strong>{value || "Noch im Turnier"}</strong>
          </span>
        </span>
        <span className="sonder-team-chevron" aria-hidden="true">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && !disabled && (
        <div className="sonder-team-menu">
          <div className="sonder-team-menu-head">
            <span>Qualifizierte Teams</span>
            <span>{options.length} verfügbar</span>
          </div>
          <div className="sonder-team-grid">
            {options.map((team) => (
              <button
                type="button"
                key={team}
                className={`sonder-team-option${value === team ? " selected" : ""}`}
                onClick={() => {
                  onChange(team);
                  setOpen(false);
                }}
              >
                <img src={flagUrl(TEAMS[team].code)} alt="" />
                <span className="sonder-team-option-name">{team}</span>
                <span className="sonder-team-strength">
                  {value === team ? "✓" : TEAMS[team].strength}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SonderView({ uid, now, results }) {
  const [myTip, setMyTip] = useState({});
  const [sonderResults, setSonderResults] = useState(null);
  const isLateTime = now >= SONDER_LOCK;
  const teamNames = Object.keys(TEAMS).sort(
    (a, b) => TEAMS[b].strength - TEAMS[a].strength,
  );
  const knockoutTeamNames = getKnockoutTeams(results);
  const groupNames = Object.keys(GROUPS);

  useEffect(() => {
    if (!uid) return;
    const u1 = onSnapshot(doc(db, "sondertips", uid), (snap) => {
      if (snap.exists()) setMyTip(snap.data());
    });
    const u2 = onSnapshot(doc(db, "results", "sonder"), (snap) => {
      if (snap.exists()) setSonderResults(snap.data());
    });
    return () => {
      u1();
      u2();
    };
  }, [uid]);

  async function saveTip(qid, val, lockTime = SONDER_LOCK) {
    if (!val) return;
    const updateData = { [qid]: val, updatedAt: serverTimestamp() };
    if (now >= lockTime) updateData[`${qid}_late`] = true;
    setMyTip((prev) => ({ ...prev, ...updateData }));
    await setDoc(doc(db, "sondertips", uid), updateData, { merge: true });
  }

  const currentCompleted = SONDER_KO.filter((q) => myTip[q.id]).length;
  const previousCompleted = SONDER.filter((q) => myTip[q.id]).length;

  return (
    <div className="sonder-wrap">
      <section className="sonder-section sonder-section-history">
        <div className="sonder-section-heading">
          <div>
            <span className="sonder-section-eyebrow">Bereits abgegeben</span>
            <h2>Vorrunden-Sondertipps</h2>
            <p>Deine bisherigen Antworten und ihre spätere Auswertung.</p>
          </div>
          <span className="sonder-section-progress">
            {previousCompleted}/{SONDER.length}
          </span>
        </div>
      <div className="sonder-info-row" style={{ marginBottom: 16 }}>
        <div className="sonder-info-text">
          Abgabeschluss war am <b>20. Juni um 18:00 Uhr</b>.
        </div>
        <div className={`sonder-lock-badge${isLateTime ? " locked" : ""}`}>
          {isLateTime ? "🔒 Wertung geschlossen" : "Offen bis 20.06. 18:00"}
        </div>
      </div>
      {SONDER.map((q) => {
        const val = myTip[q.id] || "";
        const isLateTip = !!myTip[`${q.id}_late`];
        const hasValidTip = val && !isLateTip;
        const isDisabled = isLateTime && hasValidTip;
        const res = sonderResults?.[q.id];
        const isCorrect = !!(res && val && val === res);
        const isWrong = !!(res && val && val !== res);
        const options =
          q.type === "group"
            ? groupNames
            : q.type === "stage"
              ? STAGE_OPTIONS
              : q.minStr
                ? teamNames.filter((t) => (TEAMS[t]?.strength || 0) >= q.minStr)
                : q.id === "finalist" && myTip.weltmeister
                  ? (() => {
                      const wg = TEAM_TO_GROUP[myTip.weltmeister];
                      const wH1 = wg && BRACKET_HALF1.has(wg);
                      return teamNames.filter((t) => {
                        if (t === myTip.weltmeister) return false;
                        const tg = TEAM_TO_GROUP[t];
                        return !tg || BRACKET_HALF1.has(tg) !== wH1;
                      });
                    })()
                  : teamNames;
        return (
          <div
            key={q.id}
            className={`sonder-card${isCorrect ? " s-correct" : isWrong ? " s-wrong" : ""}`}
          >
            <div className="sonder-card-top">
              <span className="sonder-q-icon">{q.icon}</span>
              <div className="sonder-q-info">
                <div className="sonder-q-label">{q.label}</div>
                <div className="sonder-q-desc">{q.desc}</div>
              </div>
              <div className="sonder-pts-badge">
                {q.pts}
                <span className="sonder-pts-sub"> Pkt</span>
              </div>
            </div>
            <div className="sonder-card-body">
              {res ? (
                <div className="sonder-answer-row">
                  {val ? (
                    <>
                      {q.type === "team" && TEAMS[val]?.code && (
                        <img
                          src={`https://flagcdn.com/w20/${TEAMS[val].code}.webp`}
                          className="sonder-ans-flag"
                          alt=""
                        />
                      )}
                      {q.type === "stage" && (
                        <span className="sonder-ans-stage-icon">📍</span>
                      )}
                      <span className="sonder-ans-val">{val}</span>
                      {isLateTip && (
                        <span
                          className="sonder-verdict sonder-wrong"
                          style={{ marginLeft: 8 }}
                        >
                          ⏱️ Zu spät (0 Pkt)
                        </span>
                      )}
                      {isCorrect && !isLateTip && (
                        <span className="sonder-verdict sonder-correct">
                          ✓ +{q.pts} Pkt
                        </span>
                      )}
                      {isWrong && !isLateTip && (
                        <>
                          <span className="sonder-verdict sonder-wrong">✗</span>
                          {res && (
                            <span className="sonder-verdict-hint">
                              {" "}
                              → {res}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <span className="sonder-no-pick">Kein Tipp abgegeben</span>
                  )}
                </div>
              ) : (
                <>
                  <select
                    className="sonder-select"
                    value={val}
                    onChange={(e) => {
                      const isLate = now >= SONDER_LOCK;
                      const updateData = {
                        [q.id]: e.target.value,
                        updatedAt: serverTimestamp(),
                      };
                      if (isLate) updateData[`${q.id}_late`] = true;
                      setMyTip((prev) => ({ ...prev, ...updateData }));
                      setDoc(doc(db, "sondertips", uid), updateData, {
                        merge: true,
                      });
                    }}
                    disabled={isDisabled}
                  >
                    <option value="">— Bitte wählen —</option>
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {q.type === "team"
                          ? `${o} (${TEAMS[o]?.strength})`
                          : `Gruppe ${o}`}
                      </option>
                    ))}
                  </select>
                  {isLateTip && val && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--red)",
                        marginTop: 4,
                      }}
                    >
                      ⏱️ Zu spät eingetragen (0 Punkte)
                    </div>
                  )}
                  {isDisabled && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--green)",
                        marginTop: 4,
                      }}
                    >
                      ✓ Rechtzeitig abgegeben.
                    </div>
                  )}
                  {q.id === "finalist" && myTip.weltmeister && (
                    <div className="sonder-bracket-hint flex gap-1.5 items-start">
                      <Info size={12} className="shrink-0 mt-0.5" />{" "}
                      <span>
                        Nur Teams aus der anderen Bracket-Hälfte –{" "}
                        {myTip.weltmeister} kann nicht gleichzeitig Weltmeister
                        und Platz 2 sein
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      </section>

      <div className="sonder-era-divider" role="separator">
        <span>Frühere Runde</span>
      </div>

      <section className="sonder-section sonder-section-current">
        <div className="sonder-section-heading current">
          <div>
            <span className="sonder-section-eyebrow">Aktuelle Runde</span>
            <h2>🔥 K.-o.-Sondertipps</h2>
            <p>Drei neue Fragen für die entscheidende Turnierphase.</p>
          </div>
          <span className="sonder-section-progress current">
            {currentCompleted}/{SONDER_KO.length}
          </span>
        </div>
      <div className="sonder-info-row" style={{ marginBottom: 16 }}>
        <div className="sonder-info-text">
          Deadline für diese Tipps: <b>28. Juni 21:00 CEST</b>.
        </div>
        <div
          className={`sonder-lock-badge${now >= SONDER_KO_LOCK ? " locked" : ""}`}
        >
          {now >= SONDER_KO_LOCK
            ? "🔒 Wertung geschlossen"
            : "Offen bis 28.06. 21:00"}
        </div>
      </div>
      <div className="sonder-qualified-note">
        <CheckCircle2 size={18} strokeWidth={1.8} />
        <span>
          <strong>Nur noch qualifizierte Teams</strong>
          Die Auswahl aktualisiert sich aus den K.-o.-Paarungen.
        </span>
        <b>{knockoutTeamNames.length}</b>
      </div>
      {SONDER_KO.map((q) => {
        const val = myTip[q.id] || "";
        const isLateTimeKO = now >= SONDER_KO_LOCK;
        const isLateTip = !!myTip[`${q.id}_late`];
        const hasValidTip = val && !isLateTip;
        const isDisabled = isLateTimeKO && hasValidTip;
        const res = sonderResults?.[q.id];
        const isCorrect = !!(res && val && val === res);
        const isWrong = !!(res && val && val !== res);
        const options =
          q.type === "number"
            ? Array.from({ length: 31 }, (_, i) => String(i))
            : knockoutTeamNames;
        return (
          <div
            key={q.id}
            className={`sonder-card${isCorrect ? " s-correct" : isWrong ? " s-wrong" : ""}`}
          >
            <div className="sonder-card-top">
              <span className="sonder-q-icon">{q.icon}</span>
              <div className="sonder-q-info">
                <div className="sonder-q-label">{q.label}</div>
                <div className="sonder-q-desc">{q.desc}</div>
              </div>
              <div className="sonder-pts-badge">
                {q.pts}
                <span className="sonder-pts-sub"> Pkt</span>
              </div>
            </div>
            <div className="sonder-card-body">
              {res ? (
                <div className="sonder-answer-row">
                  {val ? (
                    <>
                      {q.type === "team" && TEAMS[val]?.code && (
                        <img
                          src={`https://flagcdn.com/w20/${TEAMS[val].code}.webp`}
                          className="sonder-ans-flag"
                          alt=""
                        />
                      )}
                      <span className="sonder-ans-val">{val}</span>
                      {isLateTip && (
                        <span
                          className="sonder-verdict sonder-wrong"
                          style={{ marginLeft: 8 }}
                        >
                          ⏱️ Zu spät (0 Pkt)
                        </span>
                      )}
                      {isCorrect && !isLateTip && (
                        <span className="sonder-verdict sonder-correct">
                          ✓ +{q.pts} Pkt
                        </span>
                      )}
                      {isWrong && !isLateTip && (
                        <>
                          <span className="sonder-verdict sonder-wrong">✗</span>
                          {res && (
                            <span className="sonder-verdict-hint">
                              {" "}
                              → {res}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <span className="sonder-no-pick">Kein Tipp abgegeben</span>
                  )}
                </div>
              ) : (
                <>
                  {q.type === "team" ? (
                    <SonderTeamPicker
                      options={options}
                      value={val}
                      onChange={(team) =>
                        saveTip(q.id, team, SONDER_KO_LOCK)
                      }
                      disabled={isDisabled}
                    />
                  ) : (
                    <select
                      className="sonder-select"
                      value={val}
                      onChange={(e) =>
                        saveTip(q.id, e.target.value, SONDER_KO_LOCK)
                      }
                      disabled={isDisabled}
                    >
                      <option value="">— Bitte wählen —</option>
                      {options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}
                  {isLateTip && val && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--red)",
                        marginTop: 4,
                      }}
                    >
                      ⏱️ Zu spät eingetragen (0 Punkte)
                    </div>
                  )}
                  {isDisabled && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--green)",
                        marginTop: 4,
                      }}
                    >
                      ✓ Rechtzeitig abgegeben.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      </section>
    </div>
  );
}

function TippenTab({ uid, results, onTeamClick: onMatchClick }) {
  const [tips, setTips] = useState({});
  const [allTips, setAllTips] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allEvents, setAllEvents] = useState({});
  const [filter, setFilter] = useState(() => {
    const f = localStorage.getItem("tippen_goto_filter");
    if (f) {
      localStorage.removeItem("tippen_goto_filter");
      return f;
    }
    return "NEXT";
  });
  const sliderRef = useRef(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!uid) return;
    const unsubTips = onSnapshot(collection(db, "tips"), (snap) => {
      const t = {},
        all = [];
      snap.docs.forEach((d) => {
        const data = d.data();
        all.push(data);
        if (data.uid === uid) t[data.matchId] = data;
      });
      setTips(t);
      setAllTips(all);
    });
    const unsubEvents = onSnapshot(collection(db, "events"), (snap) => {
      const evs = {};
      snap.docs.forEach((d) => (evs[d.id] = d.data().events || []));
      setAllEvents(evs);
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setAllUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
    return () => {
      unsubTips();
      unsubEvents();
      unsubUsers();
    };
  }, [uid]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "events"), (snap) => {
      const e = {};
      snap.docs.forEach((d) => {
        e[d.id] = d.data().events || [];
      });
      setAllEvents(e);
    });
    return unsub;
  }, []);

  useEffect(() => {
    getDocs(collection(db, "users")).then((snap) =>
      setAllUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    );
  }, []);

  async function saveTip(matchId, homeGoals, awayGoals, penaltyWinner = null) {
    if (homeGoals === "" || awayGoals === "") return;
    const data = {
      uid,
      matchId,
      homeGoals: +homeGoals,
      awayGoals: +awayGoals,
      updatedAt: serverTimestamp(),
    };
    if (penaltyWinner) data.penaltyWinner = penaltyWinner;
    await setDoc(doc(db, "tips", `${uid}__${matchId}`), data);
  }

  const allParsed = MATCHES.map((m) => ({ ...m, kickoff: parseMatchDate(m) }));
  const liveMatches = allParsed.filter(
    (m) =>
      (now >= m.kickoff &&
        now.getTime() <= m.kickoff.getTime() + 115 * 60 * 1000) ||
      results[m.id]?.status === "LIVE",
  );

  // Auto-switch to LIVE if there are live matches and we just mounted
  useEffect(() => {
    if (
      filter === "NEXT" &&
      liveMatches.length > 0 &&
      !localStorage.getItem("tippen_goto_filter_handled")
    ) {
      setFilter("LIVE");
      localStorage.setItem("tippen_goto_filter_handled", "true");
    } else if (filter === "LIVE" && liveMatches.length === 0) {
      setFilter("NEXT");
    }
  }, [liveMatches.length]);

  return (
    <div>
      {/* Navigation */}
      <div
        className="tippen-nav"
        style={{
          padding: "12px",
          borderBottom: "1px solid var(--dark-4)",
          background: "var(--dark-2)",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {liveMatches.length > 0 && (
          <button
            className={`filter-btn${filter === "LIVE" ? " active" : ""}`}
            style={
              filter === "LIVE"
                ? {
                    background: "var(--red)",
                    color: "#fff",
                    borderColor: "var(--red)",
                  }
                : {}
            }
            onClick={() => setFilter("LIVE")}
          >
            <Activity size={14} strokeWidth={1.5} /> Live
          </button>
        )}
        <button
          className={`filter-btn${filter === "NEXT" ? " active" : ""}`}
          onClick={() => setFilter("NEXT")}
        >
          <Zap size={14} strokeWidth={1.5} /> Nächste
        </button>
        <button
          className={`filter-btn${filter === "SONDER" ? " active" : ""}`}
          onClick={() => setFilter("SONDER")}
        >
          <Star size={14} strokeWidth={1.5} /> Sonder
        </button>
        <button
          className={`filter-btn${filter === "OFFEN" ? " active" : ""}`}
          onClick={() => setFilter("OFFEN")}
        >
          <FileEdit size={14} strokeWidth={1.5} /> Offen
        </button>
        <button
          className={`filter-btn${filter === "GETIPPT" ? " active" : ""}`}
          onClick={() => setFilter("GETIPPT")}
        >
          <CheckCircle2 size={14} strokeWidth={1.5} /> Getippt
        </button>
      </div>

      {/* Content */}
      <div style={{ marginTop: 12 }}>
        {filter === "LIVE" && (
          <LiveView
            tips={tips}
            results={results}
            now={now}
            uid={uid}
            onSave={saveTip}
            onMatchClick={onMatchClick}
            allTips={allTips}
            allUsers={allUsers}
            allEvents={allEvents}
          />
        )}
        {filter === "NEXT" && (
          <NextView
            tips={tips}
            results={results}
            now={now}
            uid={uid}
            onSave={saveTip}
            onMatchClick={onMatchClick}
            allTips={allTips}
            allUsers={allUsers}
            allEvents={allEvents}
          />
        )}
        {filter === "SONDER" && (
          <SonderView uid={uid} now={now} results={results} />
        )}
        {filter === "OFFEN" && (
          <CombinedMatchesView
            type="OFFEN"
            tips={tips}
            results={results}
            now={now}
            uid={uid}
            onSave={saveTip}
            onMatchClick={onMatchClick}
            allTips={allTips}
            allUsers={allUsers}
            allEvents={allEvents}
          />
        )}
        {filter === "GETIPPT" && (
          <CombinedMatchesView
            type="GETIPPT"
            tips={tips}
            results={results}
            now={now}
            uid={uid}
            onSave={saveTip}
            onMatchClick={onMatchClick}
            allTips={allTips}
            allUsers={allUsers}
            allEvents={allEvents}
          />
        )}
      </div>

      <div
        className="pts-legend"
        style={{
          marginTop: 30,
          background: "transparent",
          border: "none",
          borderTop: "1px solid var(--dark-4)",
        }}
      >
        <span className="pts-legend-item">
          <span className="pts-3">⭐ 5</span> Exaktes Resultat
        </span>
        <span className="pts-legend-sep">·</span>
        <span className="pts-legend-item">
          <span className="pts-2">✓ 3</span> Tordifferenz / ein Torwert
        </span>
        <span className="pts-legend-sep">·</span>
        <span className="pts-legend-item">
          <span className="pts-1">~ 1</span> Nur Sieger
        </span>
      </div>
    </div>
  );
}

// ── PLAYER STAT TABLE ─────────────────────────────────────────────────────────
function PlayerStatTable({ title, icon, rows, cols }) {
  if (!rows?.length) return null;
  const TEAMS_DATA = Object.entries(TEAMS);
  function getFlagCode(teamDE) {
    const entry = TEAMS_DATA.find(([name]) => name === teamDE);
    return entry?.[1]?.code || null;
  }
  return (
    <div className="pst-block">
      <div className="pst-title">
        {icon} {title}
      </div>
      <div className="pst-table">
        <div className="pst-head">
          <span className="pst-c pst-rank">#</span>
          <span className="pst-c pst-name-h">Spieler</span>
          {cols.map((c) => (
            <span key={c.key} className="pst-c pst-num">
              {c.label}
            </span>
          ))}
        </div>
        {rows.map((r, i) => {
          const flagCode = getFlagCode(r.team);
          return (
            <div key={i} className={`pst-row${i % 2 === 0 ? "" : " alt"}`}>
              <span className="pst-c pst-rank">{i + 1}</span>
              <span className="pst-c pst-name">
                {flagCode && (
                  <img
                    src={`https://flagcdn.com/w20/${flagCode}.webp`}
                    className="pst-flag"
                    alt={r.team}
                  />
                )}
                {r.name}
              </span>
              {cols.map((c) => (
                <span key={c.key} className="pst-c pst-num pst-val">
                  {r[c.key] ?? 0}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KO BRACKET ────────────────────────────────────────────────────────────────
// Display order follows the official FIFA match path, not kickoff chronology.
// Every adjacent pair feeds the match at the same vertical position next round.
const BRACKET_DISPLAY_ORDER = {
  R32: [
    "R32_3", "R32_6", // M74/M77 -> M89
    "R32_1", "R32_4", // M73/M75 -> M90
    "R32_12", "R32_11", // M83/M84 -> M93
    "R32_10", "R32_9", // M81/M82 -> M94
    "R32_2", "R32_5", // M76/M78 -> M91
    "R32_7", "R32_8", // M79/M80 -> M92
    "R32_15", "R32_14", // M86/M88 -> M95
    "R32_13", "R32_16", // M85/M87 -> M96
  ],
  R16: [
    "R16_2", "R16_1", "R16_5", "R16_6",
    "R16_3", "R16_4", "R16_7", "R16_8",
  ],
  QF: ["QF1", "QF2", "QF3", "QF4"],
  SF: ["SF1", "SF2"],
  FIN: ["FIN"],
};

function KoBracket({ results, onTeamClick, onShowTips }) {
  const scrollRef = useRef(null);
  const roundRefs = useRef({});
  const [activeRound, setActiveRound] = useState("R32");
  const rounds = [
    { key: "R32", short: "1/16", label: "Sechzehntelfinale" },
    { key: "R16", short: "1/8", label: "Achtelfinale" },
    { key: "QF", short: "1/4", label: "Viertelfinale" },
    { key: "SF", short: "1/2", label: "Halbfinale" },
    { key: "FIN", short: "Final", label: "Finale" },
  ];

  function getRoundMatches(roundKey) {
    const byId = new Map(MATCHES.map((match) => [match.id, match]));
    return (BRACKET_DISPLAY_ORDER[roundKey] || []).map((id) => byId.get(id));
  }

  function getDisplayMatch(match) {
    const result = results[match.id] || {};
    return {
      ...match,
      home: result.koHome || match.home,
      away: result.koAway || match.away,
      date: result.koDate || match.date,
      time: result.koTime || match.time,
      result,
    };
  }

  function goToRound(key) {
    setActiveRound(key);
    const container = scrollRef.current;
    const column = roundRefs.current[key];
    if (!container || !column) return;
    container.scrollTo({ left: column.offsetLeft - 10, behavior: "smooth" });
  }

  function handleTreeScroll() {
    const container = scrollRef.current;
    if (!container) return;
    let closest = rounds[0].key;
    let distance = Number.POSITIVE_INFINITY;
    rounds.forEach(({ key }) => {
      const column = roundRefs.current[key];
      if (!column) return;
      const currentDistance = Math.abs(column.offsetLeft - container.scrollLeft);
      if (currentDistance < distance) {
        closest = key;
        distance = currentDistance;
      }
    });
    setActiveRound(closest);
  }

  function BracketTeam({
    name,
    score,
    penaltyScore,
    winner,
    loser,
    penaltyWinner,
  }) {
    const code = TEAMS[name]?.code;
    const clickable = !!(code && onTeamClick);
    const content = (
      <>
        {code ? (
          <img src={flagUrl(code)} className="kt-flag" alt="" />
        ) : (
          <span className="kt-flag-placeholder">?</span>
        )}
        <span className="kt-team-name">{name}</span>
        {penaltyWinner && <span className="kt-penalty">i.E.</span>}
        {score != null && (
          <span className="kt-score">
            {score}
            {penaltyScore != null && <small>({penaltyScore})</small>}
          </span>
        )}
      </>
    );
    return clickable ? (
      <button
        type="button"
        className={`kt-team${winner ? " winner" : ""}${loser ? " loser" : ""}`}
        onClick={() => onTeamClick(name)}
      >
        {content}
      </button>
    ) : (
      <div className={`kt-team${winner ? " winner" : ""}${loser ? " loser" : ""}`}>
        {content}
      </div>
    );
  }

  function BracketMatch({ match, roundKey }) {
    const displayMatch = getDisplayMatch(match);
    const { result } = displayMatch;
    const hasScore = hasMatchScore(result);
    const live = result.status === "LIVE";
    const done = hasScore && !live;
    const draw = done && result.homeGoals === result.awayGoals;
    const homeWon =
      done &&
      (result.homeGoals > result.awayGoals ||
        (draw && result.penaltyWinner === "home"));
    const awayWon =
      done &&
      (result.awayGoals > result.homeGoals ||
        (draw && result.penaltyWinner === "away"));
    const tipsUnlocked =
      done || Date.now() >= parseMatchDate(displayMatch).getTime();

    return (
      <article className={`kt-match-card${done ? " completed" : ""}${live ? " live" : ""}`}>
        <div className="kt-match-meta">
          <span>{match.id.replace("_", " ")}</span>
          <span className="kt-meta-actions">
          {live ? (
            <span className="kt-live"><span /> LIVE</span>
          ) : done ? (
            <span className="kt-finished">Endstand</span>
          ) : (
            <span>{displayMatch.date.slice(0, 5)} · {displayMatch.time}</span>
          )}
            {tipsUnlocked && onShowTips && (
              <button
                type="button"
                className="kt-tips-trigger"
                onClick={() => onShowTips(displayMatch)}
              >
                Tipps
              </button>
            )}
          </span>
        </div>
        <BracketTeam
          name={displayMatch.home}
          score={hasScore ? result.homeGoals : null}
          penaltyScore={
            hasPenaltyScore(result) ? result.penaltyHomeGoals : null
          }
          winner={homeWon}
          loser={awayWon}
          penaltyWinner={draw && result.penaltyWinner === "home"}
        />
        <div className="kt-team-divider" />
        <BracketTeam
          name={displayMatch.away}
          score={hasScore ? result.awayGoals : null}
          penaltyScore={
            hasPenaltyScore(result) ? result.penaltyAwayGoals : null
          }
          winner={awayWon}
          loser={homeWon}
          penaltyWinner={draw && result.penaltyWinner === "away"}
        />
        {roundKey !== "FIN" && <span className="kt-connector-out" />}
        {roundKey !== "R32" && <span className="kt-connector-in" />}
      </article>
    );
  }

  const r32Matches = getRoundMatches("R32");
  const r32Played = r32Matches.filter((match) => {
    const result = results[match.id];
    return hasMatchScore(result) && result.status !== "LIVE";
  }).length;

  return (
    <section className="ko-tree">
      <div className="kt-hero">
        <div>
          <span className="kt-kicker">WM 2026 · K.-o.-Phase</span>
          <h2>Der Weg zum Titel</h2>
          <p>Alle Resultate ab dem Sechzehntelfinale auf einen Blick.</p>
        </div>
        <div className="kt-progress">
          <strong>{r32Played}</strong>
          <span>von 16<br />entschieden</span>
        </div>
      </div>

      <nav className="kt-round-nav" aria-label="Turnierrunden">
        {rounds.map((round) => {
          const roundMatches = getRoundMatches(round.key);
          const played = roundMatches.filter((match) => {
            const result = results[match.id];
            return hasMatchScore(result) && result.status !== "LIVE";
          }).length;
          return (
            <button
              type="button"
              key={round.key}
              className={activeRound === round.key ? "active" : ""}
              onClick={() => goToRound(round.key)}
            >
              <span>{round.short}</span>
              <small>{played}/{roundMatches.length}</small>
            </button>
          );
        })}
      </nav>

      <div className="kt-swipe-hint">Seitlich wischen, um den Turnierweg zu verfolgen →</div>
      <div className="kt-scroll" ref={scrollRef} onScroll={handleTreeScroll}>
        <div className="kt-board">
          {rounds.map((round) => {
            const roundMatches = getRoundMatches(round.key);
            return (
              <section
                key={round.key}
                className={`kt-round kt-round-${round.key.toLowerCase()}`}
                ref={(node) => {
                  roundRefs.current[round.key] = node;
                }}
                style={{ "--round-matches": roundMatches.length }}
              >
                <header>
                  <span>{round.short}</span>
                  <h3>{round.label}</h3>
                  <small>{roundMatches.length} Spiele</small>
                </header>
                <div className="kt-match-list">
                  {roundMatches.map((match) => (
                    <BracketMatch
                      key={match.id}
                      match={match}
                      roundKey={round.key}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div className="kt-footer">
        <span><i className="winner-dot" /> Sieger</span>
        <span><i className="live-dot-small" /> Live</span>
        <span>Quelle: OpenLigaDB</span>
      </div>
    </section>
  );
}

// ── TABELLE TAB ───────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: "pts", label: "Meiste Punkte" },
  { id: "gf", label: "Meiste Tore" },
  { id: "ga", label: "Wenigste Gegentore" },
  { id: "gd", label: "Beste Tordifferenz" },
  { id: "s", label: "Meiste Siege" },
  { id: "sp", label: "Meiste Spiele" },
];

function LegacyTabelleTab({ results, onTeamClick }) {
  const [view, setView] = useState("groups"); // 'groups' | 'turnier' | 'spieler' | 'bracket'
  const [sortBy, setSortBy] = useState("pts");
  const [playerStats, setPlayerStats] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "playerstats", "wm2026"), (snap) => {
      if (snap.exists()) setPlayerStats(snap.data());
    });
    return unsub;
  }, []);

  // All 48 teams across all groups
  const allTeams = Object.keys(GROUPS).flatMap((g) =>
    calcStandings(g, results).map((t) => ({ ...t, group: g })),
  );

  const sorted = [...allTeams].sort((a, b) => {
    if (sortBy === "pts") return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf;
    if (sortBy === "gf") return b.gf - a.gf || b.pts - a.pts;
    if (sortBy === "ga") return a.ga - b.ga || b.pts - a.pts;
    if (sortBy === "gd") return b.gd - a.gd || b.pts - a.pts;
    if (sortBy === "s") return b.s - a.s || b.pts - a.pts;
    if (sortBy === "sp") return b.sp - a.sp || b.pts - a.pts;
    return 0;
  });

  return (
    <div>
      {/* View switcher */}
      <div className="tab-switcher">
        <button
          className={`tab-sw-btn${view === "groups" ? " active" : ""}`}
          onClick={() => setView("groups")}
        >
          Gruppen A–L
        </button>
        <button
          className={`tab-sw-btn${view === "turnier" ? " active" : ""}`}
          onClick={() => setView("turnier")}
        >
          Turnier-Ranking
        </button>
        <button
          className={`tab-sw-btn${view === "spieler" ? " active" : ""}`}
          onClick={() => setView("spieler")}
        >
          Spieler
        </button>
        <button
          className={`tab-sw-btn${view === "bracket" ? " active" : ""}`}
          onClick={() => setView("bracket")}
        >
          Turnierplan
        </button>
      </div>

      {/* ALL GROUPS */}
      {view === "groups" && (
        <div>
          {Object.keys(GROUPS).map((g) => (
            <div key={g} className="tabelle-group-block">
              <div className="tabelle-group-header">
                <span className="group-tag">{g}</span>
                <span className="tabelle-group-title">Gruppe {g}</span>
                <div className="tabelle-group-flags">
                  {GROUPS[g].map(
                    (t) =>
                      TEAMS[t]?.code && (
                        <img
                          key={t}
                          src={flagUrl(TEAMS[t].code)}
                          className="tabelle-mini-flag"
                          alt={t}
                          title={t}
                        />
                      ),
                  )}
                </div>
              </div>
              <GroupTable
                group={g}
                results={results}
                onTeamClick={onTeamClick || (() => {})}
              />
              {/* Matches summary for this group */}
              <div className="tabelle-match-summary">
                {MATCHES.filter((m) => m.group === g).map((m) => {
                  const r = results[m.id];
                  return (
                    <div key={m.id} className="tabelle-match-row">
                      <span className="tms-date">{m.date.slice(0, 5)}</span>
                      <span className="tms-home">{m.home}</span>
                      <span className="tms-score">
                        {r && r.homeGoals != null
                          ? `${r.homeGoals}:${r.awayGoals}`
                          : `${m.time}`}
                      </span>
                      <span className="tms-away">{m.away}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TOURNAMENT RANKING */}
      {view === "turnier" && (
        <div>
          <div className="sort-bar">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.id}
                className={`filter-btn${sortBy === o.id ? " active" : ""}`}
                onClick={() => setSortBy(o.id)}
              >
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
              const td = TEAMS[t.name];
              const sc = strengthColor(td?.strength || 0);
              return (
                <div
                  key={t.name}
                  className="tt-row"
                  onClick={() => onTeamClick && onTeamClick(t.name)}
                >
                  <span className="tt-c tt-pos tt-pos-n">{i + 1}</span>
                  <span className="tt-c">
                    {td?.code && (
                      <img
                        src={flagUrl(td.code)}
                        className="tt-flag"
                        alt={t.name}
                      />
                    )}
                  </span>
                  <span className="tt-c tt-name">{t.name}</span>
                  <span className="tt-c tt-grp">
                    <span className="grp-pill">{t.group}</span>
                  </span>
                  <span className="tt-c">{t.sp}</span>
                  <span className="tt-c tt-s">{t.s}</span>
                  <span className="tt-c">{t.u}</span>
                  <span className="tt-c tt-n">{t.n}</span>
                  <span className="tt-c tt-goals">
                    {t.gf}:{t.ga}
                  </span>
                  <span
                    className="tt-c"
                    style={{
                      color:
                        t.gd > 0
                          ? "var(--green)"
                          : t.gd < 0
                            ? "var(--red)"
                            : "var(--muted)",
                      fontWeight: 700,
                      fontSize: 11,
                    }}
                  >
                    {t.gd > 0 ? "+" : ""}
                    {t.gd}
                  </span>
                  <span className="tt-c tt-pts-val">{t.pts}</span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "var(--muted)",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Klick auf eine Mannschaft für Details
          </div>
        </div>
      )}

      {/* SPIELER STATS */}
      {view === "spieler" && (
        <div className="player-stats">
          {!playerStats && <div className="loading">Lade Statistiken…</div>}
          {playerStats && !playerStats.topscorers?.length && (
            <div
              className="sp-no-games"
              style={{ textAlign: "center", padding: "48px 20px" }}
            >
              ⚽ Noch keine Tore erfasst.
              <br />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Erscheint, sobald die ersten WM-Tore fallen.
              </span>
            </div>
          )}
          {playerStats && playerStats.topscorers?.length > 0 && (
            <>
              <PlayerStatTable
                title="Torschützenkönig"
                icon="⚽"
                rows={playerStats.topscorers || []}
                cols={[
                  { key: "goals", label: "Tore" },
                  { key: "penalties", label: "Elfm." },
                ]}
              />
              <div className="sp-stats-note">
                Datenquelle: OpenLigaDB · Vorlagen, Karten &
                Torhüter-Statistiken sind dort nicht verfügbar.
              </div>
            </>
          )}
        </div>
      )}

      {/* KO BRACKET */}
      {view === "bracket" && <KoBracket results={results} />}
    </div>
  );
}

function BracketTipsModal({ state, onClose }) {
  if (!state) return null;
  const { match, tips, users, loading, error } = state;
  return (
    <div className="modal-overlay bracket-tips-overlay" onClick={onClose}>
      <div
        className="bracket-tips-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose}>✕</button>
        <span className="bracket-tips-kicker">Abgegebene Tipps</span>
        <h3>{match.home} – {match.away}</h3>
        <p>Resultat und gewählter Elfmetersieger werden unverändert angezeigt.</p>
        {loading ? (
          <div className="bracket-tips-state">Tipps werden geladen…</div>
        ) : error ? (
          <div className="bracket-tips-state error">{error}</div>
        ) : tips.length === 0 ? (
          <div className="bracket-tips-state">
            Für dieses Spiel wurde kein Tipp abgegeben.
          </div>
        ) : (
          <div className="tips-list bracket-tips-list">
            <TipRows
              matchTips={tips}
              allUsers={users}
              result={state.result}
              match={match}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabelleTab({ results, onTeamClick }) {
  const [tipsModal, setTipsModal] = useState(null);
  const tipsRequestRef = useRef(0);

  async function showTips(match) {
    const requestId = ++tipsRequestRef.current;
    setTipsModal({
      match,
      result: results[match.id] || null,
      tips: [],
      users: [],
      loading: true,
      error: "",
    });
    try {
      const tipsSnapshot = await getDocs(
        query(collection(db, "tips"), where("matchId", "==", match.id)),
      );
      const tips = tipsSnapshot.docs.map((document) => document.data());
      const userIds = [...new Set(tips.map((tip) => tip.uid))];
      const userDocuments = await Promise.all(
        userIds.map((uid) => getDoc(doc(db, "users", uid))),
      );
      const users = userDocuments.map((document, index) => ({
        uid: userIds[index],
        ...(document.exists() ? document.data() : {}),
      }));
      if (tipsRequestRef.current !== requestId) return;
      tips.sort((left, right) => {
        const leftName =
          users.find((user) => user.uid === left.uid)?.displayName || "";
        const rightName =
          users.find((user) => user.uid === right.uid)?.displayName || "";
        return leftName.localeCompare(rightName, "de");
      });
      setTipsModal({
        match,
        result: results[match.id] || null,
        tips,
        users,
        loading: false,
        error: "",
      });
    } catch {
      if (tipsRequestRef.current !== requestId) return;
      setTipsModal((current) => ({
        ...current,
        loading: false,
        error: "Tipps konnten nicht geladen werden.",
      }));
    }
  }

  function closeTips() {
    tipsRequestRef.current += 1;
    setTipsModal(null);
  }

  return (
    <>
      <KoBracket
        results={results}
        onTeamClick={onTeamClick}
        onShowTips={showTips}
      />
      <BracketTipsModal state={tipsModal} onClose={closeTips} />
    </>
  );
}

// ── USER STATS MODAL ──────────────────────────────────────────────────────────
function UserStatsModal({ user, allTips, results, board, onClose }) {
  const myTips = allTips.filter((t) => t.uid === user.uid);
  const tippedPlayed = myTips.filter((t) => {
    const r = results[t.matchId];
    return r && r.homeGoals != null;
  });
  const pts = tippedPlayed.reduce(
    (s, t) => s + (calcPoints(t, results[t.matchId]) || 0),
    0,
  );
  const maxPts = tippedPlayed.length * 5;
  const exact = tippedPlayed.filter(
    (t) => calcPoints(t, results[t.matchId]) === 5,
  ).length;
  const scored = tippedPlayed.filter(
    (t) => (calcPoints(t, results[t.matchId]) || 0) > 0,
  ).length;
  const quote =
    tippedPlayed.length > 0
      ? Math.round((scored / tippedPlayed.length) * 100)
      : 0;
  const sortedByDate = [...tippedPlayed].sort((a, b) => {
    const ma = MATCHES.find((m) => m.id === a.matchId),
      mb = MATCHES.find((m) => m.id === b.matchId);
    return (ma?.date + ma?.time || "").localeCompare(mb?.date + mb?.time || "");
  });
  let cur = 0;
  sortedByDate.forEach((t) => {
    const p = calcPoints(t, results[t.matchId]) || 0;
    if (p > 0) cur++;
    else cur = 0;
  });
  const rank = board.findIndex((u) => u.uid === user.uid) + 1;

  // Nur durchgespielte Spiele (mit Ergebnis), neueste zuerst — NIE laufende/zukünftige Tipps
  const playedMatches = MATCHES.filter((m) => {
    const r = results[m.id];
    return r && r.homeGoals != null;
  }).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="modal-head">
          <InitialsAvatar
            name={user.displayName || "?"}
            uid={user.uid}
            size={52}
          />
          <div>
            <h2 className="modal-team-name">{user.displayName}</h2>
            <span className="modal-strength" style={{ color: "var(--gold)" }}>
              Rang #{rank}
            </span>
          </div>
        </div>
        <div className="my-stats-grid">
          <div className="my-stat">
            <div className="my-stat-val">
              {pts}
              <span className="my-stat-max">/{maxPts}</span>
            </div>
            <div className="my-stat-lbl">Punkte</div>
          </div>
          <div className="my-stat">
            <div className="my-stat-val">
              {quote}
              <span className="my-stat-max">%</span>
            </div>
            <div className="my-stat-lbl">Tipp-Quote</div>
          </div>
          <div className="my-stat">
            <div className="my-stat-val">{exact}</div>
            <div className="my-stat-lbl">Exakt (5P)</div>
          </div>
          <div className="my-stat">
            <div className="my-stat-val">
              {myTips.length}
              <span className="my-stat-max">/{MATCHES.length}</span>
            </div>
            <div className="my-stat-lbl">Getippt</div>
          </div>
          <div className="my-stat">
            <div className="my-stat-val">{cur}</div>
            <div className="my-stat-lbl">Aktuelle Serie</div>
          </div>
          <div className="my-stat">
            <div className="my-stat-val">#{rank}</div>
            <div className="my-stat-lbl">Rang</div>
          </div>
        </div>

        <div className="th-title">
          Tipp-Verlauf <span className="th-sub">· nur gespielte Spiele</span>
        </div>
        {playedMatches.length === 0 && (
          <div className="th-empty">Noch keine Spiele beendet.</div>
        )}
        <div className="th-list">
          {playedMatches.map((m) => {
            const r = results[m.id];
            const t = myTips.find((x) => x.matchId === m.id);
            const p = t ? calcPoints(t, r) : null;
            const hc = TEAMS[m.home]?.code,
              ac = TEAMS[m.away]?.code;
            return (
              <div key={m.id} className="th-row">
                <div className="th-teams">
                  <span className="th-team th-home">
                    <span className="th-tn">{m.home}</span>
                    {hc && <img src={flagUrl(hc)} className="th-flag" alt="" />}
                  </span>
                  <span className="th-res">
                    {r.homeGoals}:{r.awayGoals}
                  </span>
                  <span className="th-team th-away">
                    {ac && <img src={flagUrl(ac)} className="th-flag" alt="" />}
                    <span className="th-tn">{m.away}</span>
                  </span>
                </div>
                <div className="th-tip">
                  {t ? (
                    <>
                      <span className="th-tip-detail">
                        <span className="th-tipval">
                          {t.homeGoals}:{t.awayGoals}
                        </span>
                        {t.penaltyWinner && (
                          <small className="th-tip-penalty">
                            {t.penaltyWinner === "home" ? m.home : m.away} i.E.
                          </small>
                        )}
                      </span>
                      <span className={`th-pts th-pts-${p}`}>
                        {p === 5
                          ? "⭐5"
                          : p === 3
                            ? "✓3"
                            : p === 1
                              ? "~1"
                              : "✗0"}
                      </span>
                    </>
                  ) : (
                    <span className="th-notip">kein Tipp</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── RANGLISTEN-VERLAUF ────────────────────────────────────────────────────────
function RangVerlauf({ board, allTips, results, uid }) {
  const [open, setOpen] = useState(false);

  // Played matches sorted chronologically
  const played = MATCHES.filter((m) => {
    const r = results[m.id];
    return r && r.homeGoals != null;
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  if (played.length < 2) return null;

  // Compute rank history: for each checkpoint, cumulative pts per user → rank
  const checkpoints = played.map((_, i) => {
    const subset = played.slice(0, i + 1);
    const ptsByUid = {};
    board.forEach((u) => {
      ptsByUid[u.uid] = 0;
    });
    allTips.forEach((t) => {
      if (!ptsByUid.hasOwnProperty(t.uid)) return;
      const match = subset.find((m) => m.id === t.matchId);
      if (!match) return;
      const r = results[t.matchId];
      if (r) ptsByUid[t.uid] += calcPoints(t, r) || 0;
    });
    const sorted = Object.entries(ptsByUid).sort((a, b) => b[1] - a[1]);
    const rankMap = {};
    sorted.forEach(([uid], i) => {
      rankMap[uid] = i + 1;
    });
    return rankMap;
  });

  const n = checkpoints.length;
  const userCount = board.length;
  // Feste Pixel-Höhe (skaliert NICHT mit der Breite) → HTML-Labels bleiben lesbar, egal ob Mobile oder Desktop.
  const rowH = userCount <= 6 ? 28 : userCount <= 9 ? 23 : 19;
  const padT = 12,
    padB = 12;
  const H = padT + padB + (userCount - 1) * rowH;
  const xPos = (i) => (n > 1 ? 2 + (i / (n - 1)) * 96 : 50); // in % (SVG wird horizontal gestreckt)
  const yPos = (rank) => padT + (rank - 1) * rowH; // in px (Höhe ist fix)

  // 12 gut unterscheidbare Farben (vorher nur 8 → Wiederholungen)
  const COLORS = [
    "#FFD700",
    "#4CC9F0",
    "#F72585",
    "#06D6A0",
    "#9B5DE5",
    "#FB8500",
    "#4895EF",
    "#80ED99",
    "#FF6B6B",
    "#C77DFF",
    "#FFC857",
    "#B0B8D8",
  ];

  return (
    <div className="rang-verlauf">
      <button
        className="rang-verlauf-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        Ranglisten-Verlauf{" "}
        <span className={`tips-chevron${open ? " open" : ""}`}>›</span>
      </button>
      {open && (
        <div className="rv-wrap">
          <div className="rv-ranks" style={{ height: H }}>
            {Array.from({ length: userCount }, (_, i) => (
              <span key={i} className="rv-rank" style={{ top: yPos(i + 1) }}>
                {i + 1}
              </span>
            ))}
          </div>
          <div className="rv-plot" style={{ height: H }}>
            <svg
              className="rv-svg"
              viewBox={`0 0 100 ${H}`}
              preserveAspectRatio="none"
            >
              {board.map((_, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={yPos(i + 1)}
                  x2="100"
                  y2={yPos(i + 1)}
                  style={{ stroke: "var(--dark-4)" }}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {board.map((u, ui) => {
                const ranks = checkpoints.map((cp) => cp[u.uid] || userCount);
                const me = u.uid === uid;
                return (
                  <polyline
                    key={u.uid}
                    points={ranks
                      .map((r, i) => `${xPos(i)},${yPos(r)}`)
                      .join(" ")}
                    fill="none"
                    stroke={COLORS[ui % COLORS.length]}
                    strokeWidth={me ? 3.2 : 2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    opacity={me ? 1 : 0.92}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
            <div className="rv-days">
              {checkpoints.map((_, i) => (
                <span
                  key={i}
                  className="rv-day"
                  style={{ left: `${xPos(i)}%` }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
          <div className="rv-names" style={{ height: H }}>
            {board.map((u, ui) => {
              const ranks = checkpoints.map((cp) => cp[u.uid] || userCount);
              const lastRank = ranks[ranks.length - 1];
              const me = u.uid === uid;
              const color = COLORS[ui % COLORS.length];
              return (
                <span
                  key={u.uid}
                  className={`rv-name${me ? " me" : ""}`}
                  style={{ top: yPos(lastRank) }}
                >
                  <span className="rv-dot" style={{ background: color }} />
                  <span className="rv-nm" style={{ color }}>
                    {u.displayName?.split(" ")[0]}
                  </span>
                  {me && <span className="rv-me">◄</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── RANGLISTE ─────────────────────────────────────────────────────────────────
function RanglisteTab({ uid, results }) {
  const [users, setUsers] = useState([]);
  const [allTips, setAllTips] = useState([]);
  const [allSonderTips, setAllSonderTips] = useState([]);
  const [sonderResults, setSonderResults] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  useEffect(() => {
    const u1 = onSnapshot(collection(db, "users"), (snap) =>
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    );
    const u2 = onSnapshot(collection(db, "tips"), (snap) =>
      setAllTips(snap.docs.map((d) => d.data())),
    );
    const u3 = onSnapshot(collection(db, "sondertips"), (snap) =>
      setAllSonderTips(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    );
    const u4 = onSnapshot(doc(db, "results", "sonder"), (snap) => {
      if (snap.exists()) setSonderResults(snap.data());
    });
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, []);
  const board = users
    .map((u) => {
      const myTips = allTips.filter((t) => t.uid === u.uid);
      const matchPts = myTips.reduce((s, t) => {
        const r = results[t.matchId],
          p = r ? calcPoints(t, r) : 0;
        return s + (p || 0);
      }, 0);
      const mySonder = allSonderTips.find((s) => s.uid === u.uid) || {};
      const sonderPts = calcSonderPoints(mySonder, sonderResults);
      return {
        ...u,
        pts: matchPts + sonderPts,
        sonderPts,
        tipCount: myTips.length,
      };
    })
    .sort((a, b) => b.pts - a.pts);

  // Achievements
  const achievements = (() => {
    if (!board.length) return [];
    const stats = board.map((u) => {
      const myT = allTips.filter((t) => t.uid === u.uid);
      const played = myT.filter((t) => {
        const r = results[t.matchId];
        return r && r.homeGoals != null;
      });
      const exact = played.filter(
        (t) => calcPoints(t, results[t.matchId]) === 5,
      ).length;
      const zeros = played.filter(
        (t) => (calcPoints(t, results[t.matchId]) || 0) === 0,
      ).length;
      const scored = played.filter(
        (t) => (calcPoints(t, results[t.matchId]) || 0) > 0,
      ).length;
      const quote = played.length > 0 ? scored / played.length : 0;
      const sorted = [...played].sort((a, b) => {
        const ma = MATCHES.find((m) => m.id === a.matchId),
          mb = MATCHES.find((m) => m.id === b.matchId);
        return (ma?.date + ma?.time || "").localeCompare(
          mb?.date + mb?.time || "",
        );
      });
      let cur = 0;
      sorted.forEach((t) => {
        const p = calcPoints(t, results[t.matchId]) || 0;
        p > 0 ? cur++ : (cur = 0);
      });
      return { ...u, exact, zeros, quote, scored, cur, played: played.length };
    });
    const best = (key, min = 0) => {
      const s = [...stats].sort((a, b) => b[key] - a[key]);
      return s[0]?.[key] >= min ? s[0] : null;
    };
    const list = [];
    const sh = best("quote", 0.01);
    if (sh)
      list.push({
        icon: <Crosshair size={18} strokeWidth={1.5} />,
        title: "Scharfschütze",
        desc: "Beste Trefferquote",
        user: sh,
      });
    const ex = best("exact", 1);
    if (ex)
      list.push({
        icon: <Star size={18} strokeWidth={1.5} />,
        title: "Exaktester",
        desc: "Meiste exakte Treffer",
        user: ex,
      });
    const fi = best("cur", 1);
    if (fi)
      list.push({
        icon: <Flame size={18} strokeWidth={1.5} />,
        title: "On Fire",
        desc: "Längste aktuelle Serie",
        user: fi,
      });
    const pb = best("zeros", 1);
    if (pb)
      list.push({
        icon: <Skull size={18} strokeWidth={1.5} />,
        title: "Pechvogel",
        desc: "Meiste Nieten",
        user: pb,
      });
    const fl = best("tipCount", 1);
    if (fl)
      list.push({
        icon: <PenLine size={18} strokeWidth={1.5} />,
        title: "Fleissigster",
        desc: "Meiste Tipps abgegeben",
        user: fl,
      });
    return list;
  })();

  // Podium order: 2nd left, 1st center, 3rd right
  const top = board.slice(0, Math.min(3, board.length));
  const podiumOrder =
    top.length >= 3
      ? [top[1], top[0], top[2]]
      : top.length === 2
        ? [top[1], top[0]]
        : [top[0]];
  const podiumRank =
    top.length >= 3 ? [2, 1, 3] : top.length === 2 ? [2, 1] : [1];

  const leaderPts = board[0]?.pts || 0;
  const playedCount = MATCHES.filter((m) => {
    const r = results[m.id];
    return r && r.homeGoals != null;
  }).length;

  return (
    <div className="rangliste-wrap">
      {board.length === 0 && <div className="loading">Laden…</div>}
      {board.length > 0 && (
        <>
          <div className="rl-head">
            <span className="rl-title">Rangliste</span>
            <span className="rl-sub">
              {board.length} Spieler · {playedCount}{" "}
              {playedCount === 1 ? "Spiel" : "Spiele"} gewertet
            </span>
          </div>

          {/* Podium 2-1-3 */}
          <div className="podium">
            {podiumOrder.map((u, i) => {
              const rank = podiumRank[i];
              return (
                <div
                  key={u.uid}
                  className={`pod2-slot pod2-r${rank}${u.uid === uid ? " me" : ""}`}
                  onClick={() => setSelectedUser(u)}
                >
                  {rank === 1 && (
                    <div className="pod2-crown">
                      <Crown size={20} strokeWidth={2} fill="currentColor" />
                    </div>
                  )}
                  <InitialsAvatar
                    name={u.displayName || "?"}
                    uid={u.uid}
                    size={rank === 1 ? 60 : 46}
                  />
                  <div className="pod2-name">{u.displayName}</div>
                  <div className="pod2-pts">
                    {u.pts}
                    <span>Pkt</span>
                  </div>
                  <div className="pod2-base">
                    <span className="pod2-rank">{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rest 4+ */}
          {board.length > 3 && (
            <div className="rank-list">
              {board.slice(3).map((u, i) => {
                const rank = i + 4;
                const pct =
                  leaderPts > 0 ? Math.round((u.pts / leaderPts) * 100) : 0;
                const diff = leaderPts - u.pts;
                return (
                  <div
                    key={u.uid}
                    className={`rank-item${u.uid === uid ? " me" : ""}`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <span className="rank-fill" style={{ width: `${pct}%` }} />
                    <div className="rank-pos">{rank}</div>
                    <InitialsAvatar
                      name={u.displayName || "?"}
                      uid={u.uid}
                      size={34}
                    />
                    <div className="rank-name">
                      {u.displayName}
                      {u.uid === uid && <span className="rank-you">DU</span>}
                    </div>
                    <span className="rank-diff">
                      {diff > 0 ? `−${diff}` : ""}
                    </span>
                    <div className="rank-pts">{u.pts}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Abzeichen */}
          {achievements.length > 0 && (
            <div className="achievements">
              <div className="achievements-title">Auszeichnungen</div>
              <div className="achievements-list">
                {achievements.map((a) => (
                  <div key={a.title} className="ach-row">
                    <span className="ach-icon">{a.icon}</span>
                    <div className="ach-info">
                      <span className="ach-title">{a.title}</span>
                      <span className="ach-desc">{a.desc}</span>
                    </div>
                    <div className="ach-holder">
                      <InitialsAvatar
                        name={a.user.displayName || "?"}
                        uid={a.user.uid}
                        size={22}
                      />
                      <span>{a.user.displayName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {board.length > 1 && (
            <RangVerlauf
              board={board}
              allTips={allTips}
              results={results}
              uid={uid}
            />
          )}
        </>
      )}
      {selectedUser && (
        <UserStatsModal
          user={selectedUser}
          allTips={allTips}
          results={results}
          board={board}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

// ── PROFIL ────────────────────────────────────────────────────────────────────
function ProfilTab({ user, profile, results, onProfileUpdate }) {
  const [name, setName] = useState(profile?.displayName || "");
  const [oldPw, setOldPw] = useState(""),
    [newPw, setNewPw] = useState("");
  const [showOld, setShowOld] = useState(false),
    [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState(""),
    [err, setErr] = useState("");
  const [myTips, setMyTips] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allTips, setAllTips] = useState([]);
  useEffect(() => {
    setName(profile?.displayName || "");
  }, [profile]);
  useEffect(() => {
    const u1 = onSnapshot(collection(db, "tips"), (snap) => {
      const all = snap.docs.map((d) => d.data());
      setAllTips(all);
      setMyTips(all.filter((t) => t.uid === user.uid));
    });
    const u2 = onSnapshot(collection(db, "users"), (snap) =>
      setAllUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    );
    return () => {
      u1();
      u2();
    };
  }, [user.uid]);

  const playedMatches = MATCHES.filter((m) => {
    const r = results[m.id];
    return r && r.homeGoals != null;
  });
  const tippedPlayed = myTips.filter((t) => {
    const r = results[t.matchId];
    return r && r.homeGoals != null;
  });
  const pts = tippedPlayed.reduce(
    (s, t) => s + (calcPoints(t, results[t.matchId]) || 0),
    0,
  );
  const maxPts = tippedPlayed.length * 5;
  const exact = tippedPlayed.filter(
    (t) => calcPoints(t, results[t.matchId]) === 5,
  ).length;
  const scored = tippedPlayed.filter(
    (t) => (calcPoints(t, results[t.matchId]) || 0) > 0,
  ).length;
  const quote =
    tippedPlayed.length > 0
      ? Math.round((scored / tippedPlayed.length) * 100)
      : 0;

  const sortedByDate = [...tippedPlayed].sort((a, b) => {
    const ma = MATCHES.find((m) => m.id === a.matchId),
      mb = MATCHES.find((m) => m.id === b.matchId);
    return (ma?.date + ma?.time || "").localeCompare(mb?.date + mb?.time || "");
  });
  let streak = 0,
    maxStreak = 0,
    cur = 0;
  sortedByDate.forEach((t) => {
    const p = calcPoints(t, results[t.matchId]) || 0;
    if (p > 0) {
      cur++;
      maxStreak = Math.max(maxStreak, cur);
    } else {
      cur = 0;
    }
  });
  streak = cur;

  const board = allUsers
    .map((u) => {
      const p = allTips
        .filter((t) => t.uid === u.uid)
        .reduce((s, t) => {
          const r = results[t.matchId];
          return s + (r ? calcPoints(t, r) || 0 : 0);
        }, 0);
      return { uid: u.uid, pts: p };
    })
    .sort((a, b) => b.pts - a.pts);
  const rank = board.findIndex((u) => u.uid === user.uid) + 1;
  async function saveProfile() {
    setMsg("");
    setErr("");
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { displayName: name },
        { merge: true },
      );
      await updateProfile(user, { displayName: name });
      onProfileUpdate({ displayName: name });
      setMsg("Gespeichert ✓");
    } catch {
      setErr("Fehler beim Speichern");
    }
  }
  async function changePw() {
    setMsg("");
    setErr("");
    if (newPw.length < 6) return setErr("Passwort min. 6 Zeichen");
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, oldPw),
      );
      await updatePassword(user, newPw);
      setMsg("Passwort geändert ✓");
      setOldPw("");
      setNewPw("");
    } catch {
      setErr("Aktuelles Passwort falsch");
    }
  }
  return (
    <div>
      <div className="profile-section">
        <h3>Meine Statistik</h3>
        <div className="profile-card">
          <div className="my-stats-grid">
            <div className="my-stat">
              <div className="my-stat-val">
                {pts}
                <span className="my-stat-max">/{maxPts}</span>
              </div>
              <div className="my-stat-lbl">Punkte</div>
            </div>
            <div className="my-stat">
              <div className="my-stat-val">
                {quote}
                <span className="my-stat-max">%</span>
              </div>
              <div className="my-stat-lbl">Tipp-Quote</div>
            </div>
            <div className="my-stat">
              <div className="my-stat-val">{exact}</div>
              <div className="my-stat-lbl">Exakt (5P)</div>
            </div>
            <div className="my-stat">
              <div className="my-stat-val">
                {myTips.length}
                <span className="my-stat-max">/{MATCHES.length}</span>
              </div>
              <div className="my-stat-lbl">Getippt</div>
            </div>
            <div className="my-stat">
              <div className="my-stat-val">{streak}</div>
              <div className="my-stat-lbl">Aktuelle Serie</div>
            </div>
            <div className="my-stat">
              <div className="my-stat-val">{rank > 0 ? `#${rank}` : "–"}</div>
              <div className="my-stat-lbl">Rang</div>
            </div>
          </div>
        </div>
      </div>
      <div className="profile-section">
        <h3>Name</h3>
        <div className="profile-card">
          <div className="profile-avatar-big">
            <InitialsAvatar
              name={name || profile?.displayName || "?"}
              uid={user.uid}
              size={64}
            />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Anzeigename</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {msg && <p className="success-msg">{msg}</p>}
          {err && <p className="err">{err}</p>}
          <button className="save-btn" onClick={saveProfile}>
            Speichern
          </button>
        </div>
      </div>
      <div className="profile-section">
        <h3>Passwort ändern</h3>
        <div className="profile-card">
          <div className="field">
            <label>Aktuelles Passwort</label>
            <div className="pw-wrap">
              <input
                type={showOld ? "text" : "password"}
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
                placeholder="••••••"
              />
              <button
                type="button"
                className="pw-eye"
                onClick={() => setShowOld((v) => !v)}
              >
                <Eye show={showOld} />
              </button>
            </div>
          </div>
          <div className="field">
            <label>Neues Passwort</label>
            <div className="pw-wrap">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Min. 6 Zeichen"
              />
              <button
                type="button"
                className="pw-eye"
                onClick={() => setShowNew((v) => !v)}
              >
                <Eye show={showNew} />
              </button>
            </div>
          </div>
          <button className="save-btn" onClick={changePw}>
            Passwort ändern
          </button>
        </div>
      </div>
      <div className="profile-section">
        <h3>App Code kopieren (App.jsx)</h3>
        <div className="profile-card">
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Da GitHub auf dem Smartphone etwas unhandlich ist, kannst du hier
            den kompletten Code kopieren und in der Datei{" "}
            <code>src/App.jsx</code> in deinem Repository überschreiben.
          </p>
          <button
            className="save-btn"
            style={{
              width: "100%",
              background: "var(--blue)",
              display: "flex",
              justifyContent: "center",
            }}
            onClick={() => {
              navigator.clipboard.writeText(appCodeRaw);
              alert(
                "Code der App.jsx wurde in die Zwischenablage kopiert! Füge ihn nun in GitHub am Handy ein.",
              );
            }}
          >
            <Download size={18} /> App.jsx Code Kopieren
          </button>
        </div>
      </div>
      <div className="profile-section">
        <h3>Freunde einladen</h3>
        <EinladenTab profile={profile} />
      </div>
    </div>
  );
}

// ── EINLADEN ──────────────────────────────────────────────────────────────────
function EinladenTab({ profile }) {
  const [copied, setCopied] = useState(false);
  const code = profile?.inviteCode || "------";
  const url = `${window.location.origin}?code=${code}`;
  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div>
      <div className="invite-code-box">
        <div className="invite-code">{code}</div>
        <div className="invite-url">{url}</div>
        <button className="copy-btn" onClick={copy}>
          {copied ? "✓ Kopiert!" : "🔗 Link kopieren"}
        </button>
      </div>
      <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
        Teile diesen Link oder Code mit Freunden. Sie können sich damit
        registrieren.
      </p>
    </div>
  );
}

// ── GLOBAL BACKGROUND SYNC ────────────────────────────────────────────────────────────
function BackgroundSyncer({ results }) {
  const resultsRef = useRef(results);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    let timer;
    async function doSync() {
      try {
        const r = await fetch(
          `https://api.openligadb.de/getmatchdata/wm26/2026`,
        );
        if (!r.ok) return;
        const data = await r.json();
        const currentResults = resultsRef.current;

        const TEAM_FIX = {
          "Bosnien und Herzegowina": "Bosnien-Herzegowina",
          "Saudi Arabien": "Saudi-Arabien",
        };
        const fixTeam = (t) => TEAM_FIX[t] || t || "";
        const LOOKUP = {};
        MATCHES.forEach((m) => {
          LOOKUP[`${m.home}|${m.away}`] = m.id;
        });

        // 1. Dynamic KO Stage Syncing
        const groupMap = {
          4: "R32",
          5: "R16",
          6: "QF",
          7: "SF",
          8: "P3",
          9: "FIN",
        };
        const koMapList = { R32: [], R16: [], QF: [], SF: [], P3: [], FIN: [] };
        for (const x of data) {
          const goId = x.group?.groupOrderID;
          if (goId >= 4 && groupMap[goId]) koMapList[groupMap[goId]].push(x);
        }
        for (const round of ["R32", "R16", "QF", "SF", "P3", "FIN"]) {
          const apiMatches = koMapList[round];
          if (!apiMatches || !apiMatches.length) continue;
          apiMatches.sort(
            (a, b) =>
              new Date(a.matchDateTimeUTC) - new Date(b.matchDateTimeUTC),
          );

          for (const [i, x] of apiMatches.entries()) {
            let myId = `${round}${i + 1}`;
            if (round === "R32" || round === "R16")
              myId = `${round}_${i + 1}`;
            if (round === "P3" || round === "FIN") myId = round;

            const t1 = fixTeam(x.team1?.teamName);
            const t2 = fixTeam(x.team2?.teamName);
            const m = MATCHES.find((mx) => mx.id === myId);

            if (m) {
              const apiDate = x.matchDateTime.split("T")[0];
              const apiTime = x.matchDateTime.split("T")[1].substring(0, 5);
              const dStr = `${apiDate.split("-")[2]}.${apiDate.split("-")[1]}.${apiDate.split("-")[0]}`;

              const existing = currentResults[myId] || {};
              const updates = {};

              if (t1 && t1 !== m.home && TEAMS[t1]) {
                m.home = t1;
                updates.koHome = t1;
              } else if (existing.koHome) m.home = existing.koHome; // Restore from cache

              if (t2 && t2 !== m.away && TEAMS[t2]) {
                m.away = t2;
                updates.koAway = t2;
              } else if (existing.koAway) m.away = existing.koAway;

              if (dStr && dStr !== m.date) {
                m.date = dStr;
                updates.koDate = dStr;
              } else if (existing.koDate) m.date = existing.koDate;

              if (apiTime && apiTime !== m.time) {
                m.time = apiTime;
                updates.koTime = apiTime;
              } else if (existing.koTime) m.time = existing.koTime;

              if (Object.keys(updates).length > 0) {
                await setDoc(
                  doc(db, "results", myId),
                  { ...updates, updatedAt: serverTimestamp() },
                  { merge: true },
                );
              }

              // Update LOOKUP with the latest dynamic team names so result syncing works
              LOOKUP[`${m.home}|${m.away}`] = m.id;
            }
          }
        }

        // 2. Results & Events Syncing
        for (const x of data) {
          const t1 = fixTeam(x.team1?.teamName),
            t2 = fixTeam(x.team2?.teamName);
          let matchId = LOOKUP[`${t1}|${t2}`],
            swap = false;
          if (!matchId) {
            matchId = LOOKUP[`${t2}|${t1}`];
            swap = true;
          }
          if (!matchId) continue;

          const matchResults = x.matchResults || [];
          const resultByType = (type) =>
            matchResults.find((result) => Number(result.resultTypeID) === type);
          const latestResult = [...matchResults].sort(
            (a, b) =>
              Number(b.resultOrderID || 0) - Number(a.resultOrderID || 0),
          )[0];
          const officialResult = resultByType(2);
          const extraTimeResult = resultByType(4);
          const shootoutResult = resultByType(5);
          const kickoffMs = new Date(
            x.matchDateTimeUTC || x.matchDateTime,
          ).getTime();
          const nowMs = Date.now();
          const started = nowMs >= kickoffMs;
          const hasResultEvidence =
            matchResults.length > 0 || (x.goals || []).length > 0;
          const timedOut =
            started &&
            hasResultEvidence &&
            nowMs >= kickoffMs + 4 * 60 * 60 * 1000;
          const finished = Boolean(x.matchIsFinished || timedOut);

          // Fixture metadata was already handled above. Avoid one Firestore
          // write per future match from every open browser.
          if (
            !started &&
            !x.matchIsFinished &&
            matchResults.length === 0 &&
            (x.goals || []).length === 0
          )
            continue;

          const goalsByTime = [...(x.goals || [])].sort(
            (a, b) => Number(a.matchMinute || 0) - Number(b.matchMinute || 0),
          );
          const latestGoal = goalsByTime[goalsByTime.length - 1];
          let scoreResult = null;
          if (x.matchIsFinished) {
            scoreResult = latestGoal
              ? {
                  pointsTeam1: latestGoal.scoreTeam1,
                  pointsTeam2: latestGoal.scoreTeam2,
                }
              : extraTimeResult || officialResult || latestResult;
          } else if (timedOut) {
            scoreResult = latestGoal
              ? {
                  pointsTeam1: latestGoal.scoreTeam1,
                  pointsTeam2: latestGoal.scoreTeam2,
                }
              : extraTimeResult || officialResult || latestResult;
          } else if (started) {
            scoreResult = latestGoal
              ? {
                  pointsTeam1: latestGoal.scoreTeam1,
                  pointsTeam2: latestGoal.scoreTeam2,
                }
              : latestResult || { pointsTeam1: 0, pointsTeam2: 0 };
          }

          const existing = currentResults[matchId] || {};
          const resultUpdate = {
            matchId,
            source: "openligadb",
            sourceMatchId: x.matchID,
            status: finished ? "FT" : started ? "LIVE" : "SCHEDULED",
          };
          if (
            scoreResult?.pointsTeam1 != null &&
            scoreResult?.pointsTeam2 != null
          ) {
            resultUpdate.homeGoals = swap
              ? scoreResult.pointsTeam2
              : scoreResult.pointsTeam1;
            resultUpdate.awayGoals = swap
              ? scoreResult.pointsTeam1
              : scoreResult.pointsTeam2;
          }
          if (
            shootoutResult?.pointsTeam1 != null &&
            shootoutResult?.pointsTeam2 != null
          ) {
            const penaltyHomeGoals = swap
              ? shootoutResult.pointsTeam2
              : shootoutResult.pointsTeam1;
            const penaltyAwayGoals = swap
              ? shootoutResult.pointsTeam1
              : shootoutResult.pointsTeam2;
            if (penaltyHomeGoals !== penaltyAwayGoals) {
              resultUpdate.penaltyWinner =
                penaltyHomeGoals > penaltyAwayGoals ? "home" : "away";
              resultUpdate.penaltyHomeGoals = penaltyHomeGoals;
              resultUpdate.penaltyAwayGoals = penaltyAwayGoals;
            }
          }

          // Update events
          let s1 = 0,
            s2 = 0;
          const eventsOut = [];
          for (const g of goalsByTime) {
            const d1 = (g.scoreTeam1 ?? s1) - s1;
            s1 = g.scoreTeam1 ?? s1;
            s2 = g.scoreTeam2 ?? s2;
            const scoringTeam = d1 > 0 ? t1 : t2;
            const team = g.isOwnGoal
              ? scoringTeam === t1
                ? t2
                : t1
              : scoringTeam;
            eventsOut.push({
              time: g.matchMinute || 0,
              extra: g.matchMinuteExtraTime ?? null,
              type: "Goal",
              detail: g.isOwnGoal
                ? "Own Goal"
                : g.isPenalty
                  ? "Penalty"
                  : "Normal Goal",
              player: (g.goalGetterName || "").trim() || "—",
              assist: g.goalGetterAssistName?.trim() || null,
              teamName: team,
              scoringTeam,
            });
          }

          const eventPayload = JSON.stringify(eventsOut);
          let eventHash = 2166136261;
          for (let i = 0; i < eventPayload.length; i++) {
            eventHash ^= eventPayload.charCodeAt(i);
            eventHash = Math.imul(eventHash, 16777619);
          }
          const eventsVersion = `${eventsOut.length}-${(eventHash >>> 0).toString(36)}`;
          if (eventsOut.length > 0) resultUpdate.eventsVersion = eventsVersion;

          const resultChanged = Object.entries(resultUpdate).some(
            ([key, value]) => existing[key] !== value,
          );
          if (resultChanged) {
            await setDoc(
              doc(db, "results", matchId),
              { ...resultUpdate, updatedAt: serverTimestamp() },
              { merge: true },
            );
          }

          if (
            eventsOut.length > 0 &&
            existing.eventsVersion !== eventsVersion
          ) {
            await setDoc(
              doc(db, "events", matchId),
              {
                matchId,
                events: eventsOut,
                source: "openligadb",
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }
        }

      } catch (e) {
        console.error("LigaSync Error", e);
      }
      scheduleNext();
    }

    function scheduleNext() {
      clearTimeout(timer);
      const now = new Date();

      const allParsed = MATCHES.map((m) => parseMatchDate(m));

      let isLive = Object.values(resultsRef.current).some(
        (result) => result.status === "LIVE",
      );
      let nextMatchStart = null;
      let nextMatchEnd = null;

      for (const ko of allParsed) {
        const mEnd = new Date(ko.getTime() + 115 * 60000);

        if (now >= ko && now <= mEnd) {
          isLive = true;
        }
        if (ko > now) {
          if (!nextMatchStart || ko < nextMatchStart) nextMatchStart = ko;
        }
        if (mEnd > now) {
          if (!nextMatchEnd || mEnd < nextMatchEnd) nextMatchEnd = mEnd;
        }
      }

      let dt = 60000 * 60; // Default 1 hour if nothing is happening

      if (isLive) {
        // If a game is live, sync every minute
        dt = 60000;
      } else {
        // Next event is either a match starting or ending.
        // Wake up 1 minute after match ends, or exactly when next match starts
        const nextEvent =
          nextMatchStart && nextMatchEnd
            ? nextMatchStart < nextMatchEnd
              ? nextMatchStart
              : nextMatchEnd
            : nextMatchStart || nextMatchEnd;

        if (nextEvent) {
          let diff = nextEvent.getTime() - now.getTime();

          // If the next event is a match ENDING (115mins), check exactly 1 min after ending
          if (nextEvent.getTime() === nextMatchEnd?.getTime()) {
            diff += 60000; // wait 1 min after match completion to check OpenLigaDB
          }

          // Max wait 1 hour just to refresh
          if (diff > 0 && diff < dt) {
            dt = diff;
          }
        }
      }

      // Max wait 1 hour before next sync check
      dt = Math.max(10000, Math.min(dt, 60000 * 60));
      timer = setTimeout(doSync, dt);
    }

    // Initial sync when opening app, then it schedules automatically
    // but to spread load let's random wait 1-3 seconds on startup
    timer = setTimeout(doSync, 1000 + Math.random() * 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function AdminTab({ results }) {
  const [filter, setFilter] = useState("A");
  const keys = [
    ...Object.keys(GROUPS),
    "R32",
    "R16",
    "QF",
    "SF",
    "P3",
    "FIN",
    "SONDER",
  ];
  const handleCopyCode = () => {
    navigator.clipboard.writeText(appCodeRaw);
    alert(
      "Code wurde in die Zwischenablage kopiert! Füge ihn nun in GitHub am Handy ein.",
    );
  };
  return (
    <div>
      <div className="section-title">⚙️ Admin</div>
      <div
        style={{
          background: "var(--card-bg)",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid var(--border)",
        }}
      >
        <h4 style={{ margin: "0 0 8px 0", fontSize: "1rem" }}>
          Mobile Code Export
        </h4>
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: "0.85rem",
            color: "var(--muted)",
          }}
        >
          Da am Smartphone Git-Push schwierig ist, kannst du hier den kompletten
          Code kopieren und auf der GitHub Seite direkt einfügen.
        </p>
        <button
          className="btn"
          onClick={handleCopyCode}
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <Download size={18} /> App.jsx Code Kopieren
        </button>
      </div>
      <div className="group-filter-slider">
        {keys.map((k) => (
          <button
            key={k}
            className={`filter-btn${filter === k ? " active" : ""}`}
            onClick={() => setFilter(k)}
          >
            {k === "SONDER" ? (
              <>
                <Star size={14} strokeWidth={1.5} /> Sonder
              </>
            ) : (
              k
            )}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        {filter === "SONDER" ? (
          <AdminSonderCard />
        ) : (
          MATCHES.filter((m) => m.group === filter).map((m) => (
            <AdminMatchCard key={m.id} match={m} result={results[m.id]} />
          ))
        )}
      </div>
    </div>
  );
}

function AdminSonderCard() {
  const [vals, setVals] = useState({});
  const [saved, setSaved] = useState(false);
  const teamNames = Object.keys(TEAMS).sort(
    (a, b) => TEAMS[b].strength - TEAMS[a].strength,
  );
  const groupNames = Object.keys(GROUPS);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "results", "sonder"), (snap) => {
      if (snap.exists()) setVals(snap.data());
    });
    return unsub;
  }, []);

  async function save() {
    const data = { ...vals, updatedAt: serverTimestamp() };
    await setDoc(doc(db, "results", "sonder"), data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="admin-match">
      <div className="admin-match-title flex items-center gap-1.5">
        <Star size={16} strokeWidth={1.5} /> Sondertipp-Ergebnisse setzen
      </div>
      {[...SONDER, ...SONDER_KO].map((q) => {
        const options =
          q.type === "group"
            ? groupNames
            : q.type === "stage"
              ? STAGE_OPTIONS
              : q.type === "number"
                ? Array.from({ length: 31 }, (_, i) => String(i))
                : teamNames;
        return (
          <div key={q.id} style={{ marginBottom: 12 }}>
            <div
              style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}
            >
              {q.icon} {q.label} ({q.pts} Pkt)
            </div>
            <select
              className="sonder-select"
              value={vals[q.id] || ""}
              onChange={(e) =>
                setVals((prev) => ({ ...prev, [q.id]: e.target.value }))
              }
            >
              <option value="">— Noch kein Ergebnis —</option>
              {options.map((o) => (
                <option key={o} value={o}>
                  {q.type === "team"
                    ? `${o} (${TEAMS[o]?.strength})`
                    : q.type === "group"
                      ? `Gruppe ${o}`
                      : o}
                </option>
              ))}
            </select>
          </div>
        );
      })}
      <div style={{ marginTop: 16 }}>
        {saved ? (
          <span className="saved-badge">✓ Gespeichert</span>
        ) : (
          <button className="save-result-btn" onClick={save}>
            Alle speichern
          </button>
        )}
      </div>
    </div>
  );
}
function AdminMatchCard({ match, result }) {
  const [h, setH] = useState(result?.homeGoals ?? ""),
    [a, setA] = useState(result?.awayGoals ?? ""),
    [saved, setSaved] = useState(false);
  const [penWinner, setPenWinner] = useState(result?.penaltyWinner || null);
  const isKoGroup = KO_GROUPS.includes(match.group);
  const isDraw = h !== "" && a !== "" && +h === +a;
  useEffect(() => {
    setH(result?.homeGoals ?? "");
    setA(result?.awayGoals ?? "");
    setPenWinner(result?.penaltyWinner || null);
  }, [result]);
  async function save() {
    if (h === "" || a === "") return;
    const data = {
      homeGoals: +h,
      awayGoals: +a,
      matchId: match.id,
      updatedAt: serverTimestamp(),
    };
    if (isKoGroup && isDraw && penWinner) data.penaltyWinner = penWinner;
    await setDoc(doc(db, "results", match.id), data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div className="admin-match">
      <div className="admin-match-title">
        {match.home} vs {match.away} · {match.date} {match.time}
      </div>
      <div className="admin-score-row">
        <input
          className="admin-input"
          type="number"
          min="0"
          max="99"
          value={h}
          onChange={(e) => setH(e.target.value)}
          placeholder="–"
        />
        <span style={{ color: "var(--muted)", textAlign: "center" }}>:</span>
        <input
          className="admin-input"
          type="number"
          min="0"
          max="99"
          value={a}
          onChange={(e) => setA(e.target.value)}
          placeholder="–"
        />
        {saved ? (
          <span className="saved-badge">✓</span>
        ) : (
          <button className="save-result-btn" onClick={save}>
            Speichern
          </button>
        )}
      </div>
      {isKoGroup && isDraw && (
        <div className="pen-row" style={{ marginTop: 8 }}>
          <span className="pen-label">Elfmeter-Gewinner</span>
          <button
            className={`pen-btn${penWinner === "home" ? " active" : ""}`}
            onClick={() => setPenWinner("home")}
          >
            {match.home}
          </button>
          <button
            className={`pen-btn${penWinner === "away" ? " active" : ""}`}
            onClick={() => setPenWinner("away")}
          >
            {match.away}
          </button>
        </div>
      )}
    </div>
  );
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }) {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [pw, setPw] = useState(""),
    [pw2, setPw2] = useState("");
  const [code, setCode] = useState(""),
    [showPw, setShowPw] = useState(false),
    [showPw2, setShowPw2] = useState(false);
  const [err, setErr] = useState(""),
    [loading, setLoading] = useState(false);
  const urlCode = new URLSearchParams(window.location.search).get("code") || "";
  useEffect(() => {
    if (urlCode) setCode(urlCode);
  }, [urlCode]);
  async function handleRegister(e) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Name erforderlich");
    if (pw !== pw2) return setErr("Passwörter stimmen nicht überein");
    if (pw.length < 6) return setErr("Passwort min. 6 Zeichen");
    const inv = code.trim().toUpperCase();
    if (email.toLowerCase() !== ADMIN_EMAIL) {
      if (!inv) return setErr("Einladungscode erforderlich");
      const snap = await getDocs(collection(db, "users"));
      if (!snap.docs.some((d) => d.data().inviteCode === inv))
        return setErr("Ungültiger Code");
    }
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, pw);
      await updateProfile(user, { displayName: name.trim() });
      await sendEmailVerification(user);
      await setDoc(doc(db, "users", user.uid), {
        displayName: name.trim(),
        email: email.toLowerCase(),
        inviteCode: genCode(),
        invitedBy: inv || null,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      setErr(
        e.code === "auth/email-already-in-use"
          ? "E-Mail bereits registriert"
          : e.message,
      );
      setLoading(false);
    }
  }
  return (
    <form className="auth-card" onSubmit={handleRegister}>
      <h2>Registrieren</h2>
      <div className="field">
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
        />
      </div>
      <div className="field">
        <label>E-Mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@email.com"
        />
      </div>
      <div className="field">
        <label>Passwort</label>
        <div className="pw-wrap">
          <input
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Min. 6 Zeichen"
          />
          <button
            type="button"
            className="pw-eye"
            onClick={() => setShowPw((v) => !v)}
          >
            <Eye show={showPw} />
          </button>
        </div>
      </div>
      <div className="field">
        <label>Bestätigen</label>
        <div className="pw-wrap">
          <input
            type={showPw2 ? "text" : "password"}
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Wiederholen"
          />
          <button
            type="button"
            className="pw-eye"
            onClick={() => setShowPw2((v) => !v)}
          >
            <Eye show={showPw2} />
          </button>
        </div>
      </div>
      {email.toLowerCase() !== ADMIN_EMAIL && (
        <div className="field">
          <label>Einladungscode</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
          />
        </div>
      )}
      {err && <p className="err">{err}</p>}
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Wird registriert…" : "Registrieren"}
      </button>
      <div className="auth-switch">
        Bereits registriert?{" "}
        <button type="button" onClick={onSwitch}>
          Anmelden
        </button>
      </div>
    </form>
  );
}
function LoginForm({ onSwitch }) {
  const [email, setEmail] = useState(""),
    [pw, setPw] = useState(""),
    [showPw, setShowPw] = useState(false),
    [keep, setKeep] = useState(false),
    [err, setErr] = useState(""),
    [loading, setLoading] = useState(false);
  async function handleLogin(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await setPersistence(
        auth,
        keep ? browserLocalPersistence : browserSessionPersistence,
      );
      await signInWithEmailAndPassword(auth, email, pw);
    } catch {
      setErr("E-Mail oder Passwort falsch");
      setLoading(false);
    }
  }
  return (
    <form className="auth-card" onSubmit={handleLogin} autoComplete="on">
      <h2>Anmelden</h2>
      <div className="field">
        <label>E-Mail</label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@email.com"
        />
      </div>
      <div className="field">
        <label>Passwort</label>
        <div className="pw-wrap">
          <input
            type={showPw ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Passwort"
          />
          <button
            type="button"
            className="pw-eye"
            onClick={() => setShowPw((v) => !v)}
          >
            <Eye show={showPw} />
          </button>
        </div>
      </div>
      <label className="keep-login">
        <input
          type="checkbox"
          checked={keep}
          onChange={(e) => setKeep(e.target.checked)}
        />{" "}
        Angemeldet bleiben
      </label>
      {err && <p className="err">{err}</p>}
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "Anmeldung…" : "Anmelden"}
      </button>
      <div className="auth-switch">
        Noch kein Konto?{" "}
        <button type="button" onClick={onSwitch}>
          Registrieren
        </button>
      </div>
    </form>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
// ── SONDER POPUP ─────────────────────────────────────────────────────────────
function SonderPopup({ onClose, onGo }) {
  return (
    <div className="sonder-popup-overlay" onClick={onClose}>
      <div className="sonder-popup" onClick={(e) => e.stopPropagation()}>
        <div className="sonder-popup-kicker">Neu · 3 Sonderfragen</div>
        <div className="sonder-popup-icon">🔥</div>
        <div className="sonder-popup-title">K.-o.-Sondertipps sind da!</div>
        <div className="sonder-popup-text">
          Tippe auf Tore, Karten und Elfmeter-Dramen. Bei der Teamwahl siehst du
          nur Mannschaften, die noch im Turnier sind.
        </div>
        <div className="sonder-popup-deadline">
          <span aria-hidden="true">⏳</span>
          <div>
            <small>Abgabeschluss</small>
            <strong>Heute · 21:00 Uhr</strong>
          </div>
        </div>
        <button className="sonder-popup-cta" onClick={onGo}>
          Sondertipps abgeben
        </button>
        <button className="sonder-popup-dismiss" onClick={onClose}>
          Später
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState(undefined),
    [profile, setProfile] = useState(null),
    [results, setResults] = useState({});
  const [tab, setTab] = useState(
      () => localStorage.getItem("activeTab") || "tippen",
    ),
    [authMode, setAuthMode] = useState("login");
  const [showSonderPopup, setShowSonderPopup] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  async function handleInstall() {
    if (isIos) {
      setShowIosHint((v) => !v);
      return;
    }
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstallPrompt(null);
  }
  useEffect(() => {
    localStorage.setItem("activeTab", tab);
  }, [tab]);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setAuthUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) setProfile(snap.data());
        else setProfile(null);
        // Popup nur zeigen, wenn KO-Sondertipps noch offen sind, NICHT bereits alle ausgefüllt und < 3x gezeigt
        const sonderSnap = await getDoc(doc(db, "sondertips", u.uid));
        const sonderData = sonderSnap.exists() ? sonderSnap.data() : {};
        const allKOFilled = SONDER_KO.every((q) => sonderData[q.id]);
        const shownKO = parseInt(
          localStorage.getItem(SONDER_KO_POPUP_KEY) || "0",
        );
        if (new Date() < SONDER_KO_LOCK && !allKOFilled && shownKO < 3) {
          setShowSonderPopup(true);
          localStorage.setItem(SONDER_KO_POPUP_KEY, String(shownKO + 1));
        }
      } else setProfile(null);
    });
    return unsub;
  }, []);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "results"), (snap) => {
      const r = {};
      snap.docs.forEach((d) => {
        r[d.id] = d.data();
      });
      setResults(r);
    });
    return unsub;
  }, []);
  const [untippedCount, setUntippedCount] = useState(0);
  useEffect(() => {
    if (!authUser?.uid) {
      setUntippedCount(0);
      return;
    }
    const uid = authUser.uid;
    const unsub = onSnapshot(collection(db, "tips"), (snap) => {
      const tipped = new Set();
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.uid === uid) tipped.add(data.matchId);
      });
      const now2 = new Date();
      setUntippedCount(
        MATCHES.filter(
          (m) =>
            !KO_GROUPS.includes(m.group) &&
            parseMatchDate(m) > now2 &&
            !tipped.has(m.id),
        ).length,
      );
    });
    return unsub;
  }, [authUser?.uid]);
  if (authUser === undefined) return <div className="loading">⚽ Laden…</div>;
  if (!authUser)
    return (
      <div className="auth-wrap">
        <div className="auth-logo">TippLiga WM26</div>
        <div className="auth-sub">Fussball-WM 2026 Tippspiel</div>
        {authMode === "login" ? (
          <LoginForm onSwitch={() => setAuthMode("register")} />
        ) : (
          <RegisterForm onSwitch={() => setAuthMode("login")} />
        )}
      </div>
    );
  if (!authUser.emailVerified)
    return (
      <div className="auth-wrap">
        <div className="auth-logo">TippLiga WM26</div>
        <div className="verify-wrap">
          <h2>✉️ E-Mail bestätigen</h2>
          <p>
            Wir haben eine Bestätigungs-E-Mail an{" "}
            <strong>{authUser.email}</strong> gesendet.
          </p>
          <button
            className="btn"
            onClick={async () => {
              await sendEmailVerification(authUser);
              alert("E-Mail erneut gesendet!");
            }}
          >
            E-Mail erneut senden
          </button>
          <button className="btn-ghost" onClick={() => signOut(auth)}>
            Abmelden
          </button>
        </div>
      </div>
    );
  const isAdmin = authUser.email?.toLowerCase() === ADMIN_EMAIL;
  function dismissSonderPopup() {
    setShowSonderPopup(false);
  }
  function goToSonder() {
    localStorage.setItem("tippen_goto_filter", "SONDER");
    setShowSonderPopup(false);
    setTab("tippen");
  }
  const navItems = [
    {
      id: "tippen",
      icon: <Target size={20} strokeWidth={1.5} />,
      label: "Tippen",
      badge: untippedCount || null,
    },
    {
      id: "spielplan",
      icon: <CalendarDays size={20} strokeWidth={1.5} />,
      label: "Spielplan",
    },
    {
      id: "tabelle",
      icon: <BarChart3 size={20} strokeWidth={1.5} />,
      label: "Tabelle",
    },
    {
      id: "rangliste",
      icon: <Trophy size={20} strokeWidth={1.5} />,
      label: "Rangliste",
    },
    {
      id: "profil",
      icon: <User size={20} strokeWidth={1.5} />,
      label: "Profil",
    },
    ...(isAdmin
      ? [
          {
            id: "admin",
            icon: <Settings size={20} strokeWidth={1.5} />,
            label: "Admin",
          },
        ]
      : []),
  ];
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">TippLiga WM26</div>
        {!isStandalone && (installPrompt || isIos) && (
          <button
            className="theme-btn"
            onClick={handleInstall}
            title="App installieren"
          >
            <Download size={18} strokeWidth={1.5} />
          </button>
        )}
        <button
          className="theme-btn"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          title="Theme wechseln"
        >
          {theme === "dark" ? (
            <Sun size={18} strokeWidth={1.5} />
          ) : (
            <Moon size={18} strokeWidth={1.5} />
          )}
        </button>
        <button
          className="logout-btn"
          onClick={() => signOut(auth)}
          title="Abmelden"
        >
          ✕
        </button>
      </header>
      {showIosHint && (
        <div className="ios-hint">
          <Share size={14} /> Tippe auf <strong>Teilen</strong> →{" "}
          <strong>Zum Home-Bildschirm</strong>
          <button onClick={() => setShowIosHint(false)}>✕</button>
        </div>
      )}
      <BackgroundSyncer results={results} />
      {showSonderPopup && (
        <SonderPopup onClose={dismissSonderPopup} onGo={goToSonder} />
      )}
      <div className="app-content">
        {tab === "tippen" && (
          <TippenTab
            uid={authUser.uid}
            results={results}
            onTeamClick={setSelectedTeam}
          />
        )}
        {tab === "spielplan" && (
          <SpielplanTab results={results} onTeamClick={setSelectedTeam} />
        )}
        {tab === "tabelle" && (
          <TabelleTab results={results} onTeamClick={setSelectedTeam} />
        )}
        {tab === "rangliste" && (
          <RanglisteTab uid={authUser.uid} results={results} />
        )}
        {tab === "profil" && (
          <ProfilTab
            user={authUser}
            profile={profile}
            results={results}
            onProfileUpdate={(p) => setProfile((prev) => ({ ...prev, ...p }))}
          />
        )}
        {tab === "admin" && isAdmin && <AdminTab results={results} />}
      </div>
      {selectedTeam && (
        <MatchModal
          match={selectedTeam}
          onClose={() => setSelectedTeam(null)}
          results={results}
        />
      )}
      <nav className="bottom-nav">
        {navItems.map((n) => (
          <button
            key={n.id}
            className={`nav-btn${tab === n.id ? " active" : ""}`}
            onClick={() => setTab(n.id)}
          >
            <span className="nav-icon">
              {n.badge && (
                <span className="nav-badge">
                  {n.badge > 9 ? "9+" : n.badge}
                </span>
              )}
              {n.icon}
            </span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
