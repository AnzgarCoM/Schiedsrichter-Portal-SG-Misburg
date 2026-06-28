import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, collection, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC27vfNJL-mxl5wtg69WsWPkaceEP6yUjs",
    authDomain: "jsr-1-d3000.firebaseapp.com",
    projectId: "jsr-1-d3000",
    storageBucket: "jsr-1-d3000.firebasestorage.app",
    messagingSenderId: "909465128275",
    appId: "1:909465128275:web:7729bcda224ae767ff65a6",
    measurementId: "G-1M0XS7JMGW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Zwei verschiedene Speicherorte in der Datenbank
const SAISON_REF = doc(db, "plan", "test_struktur");
const TURNIER_REF = doc(db, "turnier_plan", "spielstruktur");

const ADMIN_UID = "2SN0Uscvh6OQbAKvriVfOW49ecD3";
const WHATSAPP_NUMMER = "4915204500763"; 

let currentUserInfo = null;
let userRole = null; 
let currentView = 'saison'; // Startansicht

let saisonData = { spiele: [] };
let turnierData = { spiele: [] };
let allUsers = [];

setPersistence(auth, browserLocalPersistence).catch((e) => console.error("Persistence-Fehler:", e));

// --- NAVIGATION SWITCH ---
window.switchView = (view) => {
    currentView = view;
    if (view === 'saison') {
        document.getElementById("viewSaison").style.display = "block";
        document.getElementById("viewTurnier").style.display = "none";
        document.getElementById("tabSaisonBtn").classList.add("active");
        document.getElementById("tabTurnierBtn").classList.remove("active");
    } else {
        document.getElementById("viewSaison").style.display = "none";
        document.getElementById("viewTurnier").style.display = "block";
        document.getElementById("tabSaisonBtn").classList.remove("active");
        document.getElementById("tabTurnierBtn").classList.add("active");
    }
    updateDashboard();
};

// --- GOOGLE LOGIN ---
const loginWithGoogle = () => {
    signInWithPopup(auth, provider)
        .then(async (result) => { await handleUserDatabaseEntry(result.user); })
        .catch((e) => {
            signInWithRedirect(auth, provider).catch(err => alert("Login fehlgeschlagen: " + err.message));
        });
};

async function handleUserDatabaseEntry(user) {
    const isAdmin = (user.uid === ADMIN_UID);
    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName || "Unbekannter Schiri",
        email: user.email,
        approved: isAdmin
    }, { merge: true });
}

window.handleLogout = () => signOut(auth).then(() => { location.reload(); });

// --- AUTH STATUS ÜBERWACHUNG ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.uid === ADMIN_UID) {
            userRole = 'admin';
            currentUserInfo = { name: "Admin", approved: true };
            startApp();
        } else {
            onSnapshot(doc(db, "users", user.uid), (userSnap) => {
                if (userSnap.exists()) {
                    currentUserInfo = userSnap.data();
                    userRole = currentUserInfo.approved ? 'schiri' : 'unapproved';
                } else {
                    handleUserDatabaseEntry(user);
                    userRole = 'unapproved';
                }
                startApp();
            });
        }
    } else {
        showSection("loginSection"); hideSection("mainContent"); hideSection("approvalWaitSection"); hideSection("logoutBtn");
    }
});

function showSection(id) { const el = document.getElementById(id); if (el) el.style.display = "block"; }
function hideSection(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

function startApp() {
    hideSection("loginSection");
    if (userRole === 'unapproved') {
        showSection("approvalWaitSection"); hideSection("mainContent"); showSection("logoutBtn"); return;
    }
    showSection("mainContent"); showSection("logoutBtn");
    
    document.getElementById("userStatus").innerText = userRole === 'admin' ? `👑 Admin Modus` : `🏃 Schiri Bereich`;
    
    if (userRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'block');
        onSnapshot(query(collection(db, "users")), (snaps) => {
            allUsers = []; snaps.forEach(d => allUsers.push(d.data())); renderUsersTable();
        });
    }

    // Beide Datenbank-Inhalte gleichzeitig live überwachen
    onSnapshot(SAISON_REF, (snap) => {
        if (snap.exists()) saisonData.spiele = Array.isArray(snap.data().spiele) ? snap.data().spiele : [];
        renderSaisonTables(); updateDashboard();
    });

    onSnapshot(TURNIER_REF, (snap) => {
        if (snap.exists()) turnierData.spiele = Array.isArray(snap.data().spiele) ? snap.data().spiele : [];
        renderTurnierTables(); updateDashboard();
    });
}

function renderUsersTable() {
    const tbody = document.querySelector("#usersTable tbody"); if (!tbody) return; tbody.innerHTML = "";
    allUsers.forEach((u) => {
        if (u.uid === ADMIN_UID) return;
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><b>${u.name}</b></td><td>${u.email}</td>
            <td><select onchange="updateUserApproval('${u.uid}', this.value)" class="status-select ${u.approved?'green':'red'}">
                <option value="false" ${!u.approved?'selected':''}>❌ Wartend</option><option value="true" ${u.approved?'selected':''}>✅ Aktiv</option>
            </select></td>`;
        tbody.appendChild(tr);
    });
}
window.updateUserApproval = async (uid, val) => {
    if (userRole !== 'admin') return;
    await setDoc(doc(db, "users", uid), { approved: (val === "true") }, { merge: true });
};

// ================= RENDERING: SAISON MODE =================
function renderSaisonTables() {
    const heute = new Date().toISOString().split('T')[0];
    const isAdmin = (userRole === 'admin');
    let gefilterte = [...saisonData.spiele].sort((a,b) => (a.date || "").localeCompare(b.date || "") || (a.time || "").localeCompare(b.time || "")).filter(s => (s.date || "") >= heute);

    const bMeister = document.querySelector("#tableMeisterschaft tbody");
    const bTurnier = document.querySelector("#tableTurniere tbody");
    const bTest = document.querySelector("#tableTestspiele tbody");
    if(bMeister) bMeister.innerHTML = ""; if(bTurnier) bTurnier.innerHTML = ""; if(bTest) bTest.innerHTML = "";

    gefilterte.forEach((item) => {
        const realIdx = saisonData.spiele.indexOf(item);
        const tr = document.createElement("tr");
        const typ = item.type || 'meisterschaft';

        if (typ === 'turnier') {
            tr.innerHTML = `
                <td><input type="date" value="${item.date||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'date',this.value)"></td>
                <td><input type="text" value="${item.time||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'time',this.value)"></td>
                <td><input type="text" value="${item.hall||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'hall',this.value)"></td>
                <td><select ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'age',this.value)">
                    <option value="mE-Jugend Turnier" ${item.age==='mE-Jugend Turnier'?'selected':''}>mE-Jugend Turnier</option>
                    <option value="wE-Jugend Turnier" ${item.age==='wE-Jugend Turnier'?'selected':''}>wE-Jugend Turnier</option>
                </select></td>
                <td><input type="text" value="${item.jsr1||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'jsr1',this.value)"></td>
                <td><input type="text" value="${item.jsr2||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'jsr2',this.value)"></td>
                <td><input type="text" value="${item.jsr3||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'jsr3',this.value)"></td>
                <td><select ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'status',this.value)" class="status-select ${item.status==='Offen'?'red':'green'}"><option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option><option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option></select></td>
                <td>${item.status==='Offen'?`<button class="whatsapp-btn" onclick="sendWhatsAppSaison('${item.date}','${item.time}','${item.hall}','${item.age}')">Melden 🟢</button>`:'Besetzt'}</td>
                ${isAdmin?`<td><button onclick="deleteSaisonEntry(${realIdx})">🗑️</button></td>`:''} `;
            if (bTurnier) bTurnier.appendChild(tr);
        } else {
            tr.innerHTML = `
                <td><input type="date" value="${item.date||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'date',this.value)"></td>
                <td><input type="text" value="${item.time||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'time',this.value)"></td>
                <td><input type="text" value="${item.hall||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'hall',this.value)"></td>
                <td><select ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'age',this.value)">
                    <option value="mD-Jugend" ${item.age==='mD-Jugend'?'selected':''}>mD-Jugend</option>
                    <option value="wD-Jugend" ${item.age==='wD-Jugend'?'selected':''}>wD-Jugend</option>
                </select></td>
                <td><input type="text" value="${item.jsr1||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'jsr1',this.value)"></td>
                <td><input type="text" value="${item.jsr2||''}" ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'jsr2',this.value)"></td>
                <td><select ${!isAdmin?'disabled':''} onchange="updateSaisonRow(${realIdx},'status',this.value)" class="status-select ${item.status==='Offen'?'red':'green'}"><option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option><option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option></select></td>
                <td>${item.status==='Offen'?`<button class="whatsapp-btn" onclick="sendWhatsAppSaison('${item.date}','${item.time}','${item.hall}','${item.age}')">Melden 🟢</button>`:'Besetzt'}</td>
                ${isAdmin?`<td><button onclick="deleteSaisonEntry(${realIdx})">🗑️</button></td>`:''} Meso`;
            if (typ === 'testspiel' && bTest) bTest.appendChild(tr);
            else if (bMeister) bMeister.appendChild(tr);
        }
    });
}

window.updateSaisonRow = async (idx, key, val) => { if (userRole === 'admin') { saisonData.spiele[idx][key] = val; await setDoc(SAISON_REF, { spiele: saisonData.spiele }); } };
window.addSaisonEntry = async (typ) => { if (userRole === 'admin') { saisonData.spiele.push({ date: "", time: "10:00", hall: "", age: "", jsr1: "", jsr2: "", status: "Offen", type: typ }); await setDoc(SAISON_REF, { spiele: saisonData.spiele }); } };
window.deleteSaisonEntry = async (idx) => { if (confirm("Löschen?") && userRole === 'admin') { saisonData.spiele.splice(idx, 1); await setDoc(SAISON_REF, { spiele: saisonData.spiele }); } };
window.sendWhatsAppSaison = (d,t,h,a) => { window.open(`https://wa.me/${WHATSAPP_NUMMER}?text=${encodeURIComponent("Hallo, hier ist "+currentUserInfo.name+". Melde mich für Spiel:\nSaison-Plan am: "+d+" um "+t+" - "+a)}`, '_blank'); };

// ================= RENDERING: TURNIER MODE =================
function renderTurnierTables() {
    const isAdmin = (userRole === 'admin');
    let sortierte = [...turnierData.spiele].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    const bTag1 = document.querySelector("#tableTag1 tbody"); const bTag2 = document.querySelector("#tableTag2 tbody");
    if(bTag1) bTag1.innerHTML = ""; if(bTag2) bTag2.innerHTML = "";

    sortierte.forEach((item) => {
        const realIdx = turnierData.spiele.indexOf(item);
        const tr = document.createElement("tr");
        const turnierTag = item.type || 'tag1';

        const altersOptionen = turnierTag === 'tag1' ? `
            <option value="mC-Jugend" ${item.age==='mC-Jugend'?'selected':''}>mC-Jugend</option>
            <option value="mB-Jugend" ${item.age==='mB-Jugend'?'selected':''}>mB-Jugend</option>
            <option value="Herren" ${item.age==='Herren'?'selected':''}>Herren (Senioren)</option>
        ` : `
            <option value="mE-Jugend" ${item.age==='mE-Jugend'?'selected':''}>mE-Jugend</option>
            <option value="mD-Jugend" ${item.age==='mD-Jugend'?'selected':''}>mD-Jugend</option>
        `;

        tr.innerHTML = `
            <td><input type="text" value="${item.time||''}" ${!isAdmin?'disabled':''} onchange="updateTurnierRow(${realIdx},'time',this.value)"></td>
            <td><input type="text" value="${item.hall||''}" ${!isAdmin?'disabled':''} onchange="updateTurnierRow(${realIdx},'hall',this.value)"></td>
            <td><select ${!isAdmin?'disabled':''} onchange="updateTurnierRow(${realIdx},'age',this.value)"><option value="">- Wählen -</option>${altersOptionen}</select></td>
            <td><input type="text" value="${item.teams||''}" ${!isAdmin?'disabled':''} onchange="updateTurnierRow(${realIdx},'teams',this.value)"></td>
            <td><input type="text" value="${item.jsr1||''}" ${!isAdmin?'disabled':''} onchange="updateTurnierRow(${realIdx},'jsr1',this.value)"></td>
            <td><input type="text" value="${item.jsr2||''}" ${!isAdmin?'disabled':''} onchange="updateTurnierRow(${realIdx},'jsr2',this.value)"></td>
            <td><select ${!isAdmin?'disabled':''} onchange="updateTurnierRow(${realIdx},'status',this.value)" class="status-select ${item.status==='Offen'?'red':'green'}"><option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option><option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option></select></td>
            <td>${item.status==='Offen'?`<button class="whatsapp-btn" onclick="sendWhatsAppTurnier('${turnierTag}','${item.time}','${item.hall}','${item.age}','${item.teams}')">Melden 🟢</button>`:'Besetzt'}</td>
            ${isAdmin?`<td><button onclick="deleteTurnierEntry(${realIdx})">🗑️</button></td>`:''}`;
        
        if (turnierTag === 'tag1' && bTag1) bTag1.appendChild(tr);
        else if (turnierTag === 'tag2' && bTag2) bTag2.appendChild(tr);
    });
}

window.updateTurnierRow = async (idx, key, val) => { if (userRole === 'admin') { turnierData.spiele[idx][key] = val; await setDoc(TURNIER_REF, { spiele: turnierData.spiele }); } };
window.addTurnierEntry = async (tag) => { if (userRole === 'admin') { turnierData.spiele.push({ time: "09:00", hall: "", age: "", teams: "", jsr1: "", jsr2: "", status: "Offen", type: tag }); await setDoc(TURNIER_REF, { spiele: turnierData.spiele }); } };
window.deleteTurnierEntry = async (idx) => { if (confirm("Löschen?") && userRole === 'admin') { turnierData.spiele.splice(idx, 1); await setDoc(TURNIER_REF, { spiele: turnierData.spiele }); } };
window.sendWhatsAppTurnier = (tag,zeit,feld,jugend,teams) => { window.open(`https://wa.me/${WHATSAPP_NUMMER}?text=${encodeURIComponent("Hallo, hier ist "+currentUserInfo.name+". Melde mich für Turnierspiel:\n"+tag+" um "+zeit+" Uhr auf "+feld+" - "+jugend+" ("+teams+")")}`, '_blank'); };

// ================= DASHBOARD MANAGER =================
function updateDashboard() {
    const dash = document.getElementById("dashboard"); if (!dash) return;
    const datenquelle = (currentView === 'saison') ? saisonData.spiele : turnierData.spiele;
    const gesamt = datenquelle.length;
    const offen = datenquelle.filter(s => s.status === 'Offen').length;
    const modusName = (currentView === 'saison') ? "Saison" : "Turnier";
    
    dash.innerHTML = `
        <div class="stat-card" style="background:var(--primary-blue)"><b>${gesamt}</b> Sp. im ${modusName}-Plan</div>
        <div class="stat-card" style="background:var(--danger-red)"><b>${offen}</b> Offene Posten</div>
        <div class="stat-card" style="background:var(--success-green)"><b>${gesamt - offen}</b> Besetzte Spiele</div>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("googleLoginBtn"); if (btn) btn.addEventListener("click", loginWithGoogle);
});