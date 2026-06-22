import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, collection, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- DEINE FIREBASE CONFIGURATION ---
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
const DOC_REF = doc(db, "plan", "test_struktur");

const ADMIN_EMAIL = "sgmisburgjsr@outlook.de";
const WHATSAPP_NUMMER = "4915204500763"; 

let currentUserInfo = null;
let userRole = null; 
let isLoginMode = true;
let allData = { spiele: [] };
let allUsers = [];

// --- GLOBAL BINDEN (BEHEBT DAS INITIALISIERUNGS-PROBLEM) ---
window.toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    const title = document.getElementById("authTitle");
    const btn = document.getElementById("mainAuthBtn");
    const toggleBtn = document.getElementById("toggleAuthBtn");
    const nameInp = document.getElementById("nameInput");

    if (!title || !btn || !toggleBtn || !nameInp) return;

    if (isLoginMode) {
        title.innerText = "Anmelden";
        btn.innerText = "Einloggen";
        btn.onclick = window.handleLogin;
        toggleBtn.innerText = "Noch kein Konto? Hier registrieren";
        nameInp.style.display = "none";
    } else {
        title.innerText = "Konto erstellen";
        btn.innerText = "Registrieren";
        btn.onclick = window.handleRegister;
        toggleBtn.innerText = "Bereits ein Konto? Hier einloggen";
        nameInp.style.display = "block";
    }
};

window.handleLogin = () => {
    const email = document.getElementById("emailInput").value.trim().toLowerCase();
    const pw = document.getElementById("pwInput").value;
    if (!email || !pw) return alert("Bitte alle Felder ausfüllen.");
    signInWithEmailAndPassword(auth, email, pw).catch(e => alert("Login-Fehler: " + e.message));
};

window.handleRegister = () => {
    const name = document.getElementById("nameInput").value.trim();
    const email = document.getElementById("emailInput").value.trim().toLowerCase();
    const pw = document.getElementById("pwInput").value;
    
    if (!name) return alert("Bitte gib deinen echten Vor- und Nachnamen an.");
    if (!email || !pw) return alert("Bitte alle Felder ausfüllen.");
    if (pw.length < 6) return alert("Das Passwort muss mindestens 6 Zeichen lang sein.");

    createUserWithEmailAndPassword(auth, email, pw)
        .then(async (cred) => {
            const isAdmin = (email === ADMIN_EMAIL.toLowerCase());
            await setDoc(doc(db, "users", cred.user.uid), {
                uid: cred.user.uid,
                name: name,
                email: email,
                approved: isAdmin 
            });
            alert("Konto erfolgreich registriert!");
        })
        .catch(e => alert("Registrierungs-Fehler: " + e.message));
};

window.handleLogout = () => signOut(auth).then(() => location.reload());

// --- AUTOMATISCHE ÜBERWACHUNG DES AUTH-STATUS ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userEmailClean = user.email ? user.email.trim().toLowerCase() : "";
        
        // KORREKTUR: Knallharter, direkter Vergleich für Admin-E-Mail
        if (userEmailClean === ADMIN_EMAIL.toLowerCase()) {
            userRole = 'admin';
            currentUserInfo = { name: "Haupt-Admin", email: user.email, approved: true };
            
            // Backup: Falls das Profildokument fehlt, erzwingen wir es hier
            setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: "Haupt-Admin",
                email: user.email,
                approved: true
            }, { merge: true });
            
            startApp();
        } else {
            // Normale Schiedsrichter über Firestore prüfen
            onSnapshot(doc(db, "users", user.uid), (userSnap) => {
                if (userSnap.exists()) {
                    currentUserInfo = userSnap.data();
                    userRole = currentUserInfo.approved ? 'schiri' : 'unapproved';
                    startApp();
                } else {
                    userRole = 'unapproved';
                    startApp();
                }
            });
        }
    } else {
        document.getElementById("loginSection").style.display = "block";
        document.getElementById("mainContent").style.display = "none";
        document.getElementById("approvalWaitSection").style.display = "none";
        document.getElementById("logoutBtn").style.display = "none";
    }
});

// --- PORTAL-ANWENDUNG STARTEN ---
function startApp() {
    document.getElementById("loginSection").style.display = "none";
    
    if (userRole === 'unapproved') {
        document.getElementById("approvalWaitSection").style.display = "block";
        document.getElementById("mainContent").style.display = "none";
        document.getElementById("logoutBtn").style.display = "block";
        return;
    }

    document.getElementById("approvalWaitSection").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    document.getElementById("logoutBtn").style.display = "block";
    
    document.getElementById("userStatus").innerText = userRole === 'admin' 
        ? `👑 Admin-Modus (${currentUserInfo?.name || 'Admin'})` 
        : `🏃 JSR-Bereich (Eingeloggt als: ${currentUserInfo?.name || 'Schiedsrichter'})`;
    
    if (userRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'block');
        
        // Holt die Schiedsrichter-Registrierungen live ab
        onSnapshot(query(collection(db, "users")), (snaps) => {
            allUsers = [];
            snaps.forEach(d => allUsers.push(d.data()));
            renderUsersTable();
        });
    }

    // Spielplan live laden
    onSnapshot(DOC_REF, (snap) => {
        if (snap.exists()) {
            allData.spiele = Array.isArray(snap.data().spiele) ? snap.data().spiele : [];
            renderSpieleTable();
            updateDashboard();
        } else if (userRole === 'admin') {
            setDoc(DOC_REF, { spiele: [] });
        }
    });
}

// --- ADMIN: SCHIEDSRICHTER FREISCHALTEN ---
function renderUsersTable() {
    const tbody = document.querySelector("#usersTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    allUsers.forEach((u) => {
        if (u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return; 
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${u.name}</b></td>
            <td>${u.email}</td>
            <td>
                <select onchange="updateUserApproval('${u.uid}', this.value)" class="status-select ${u.approved?'green':'red'}" style="width:auto;">
                    <option value="false" ${!u.approved?'selected':''}>❌ Gesperrt / Neu</option>
                    <option value="true" ${u.approved?'selected':''}>✅ Freigeschaltet</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateUserApproval = async (uid, val) => {
    if (userRole !== 'admin') return;
    const isApproved = (val === "true");
    await setDoc(doc(db, "users", uid), { approved: isApproved }, { merge: true });
};

// --- SPIELPLAN RENDERN ---
function renderSpieleTable() {
    const tbody = document.querySelector("#spieleTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const isAdmin = (userRole === 'admin');
    const heute = new Date().toISOString().split('T')[0];

    let anzeigeListe = [...allData.spiele].sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return (a.time || "").localeCompare(b.time || "");
    });

    anzeigeListe = anzeigeListe.filter(s => s.date >= heute);

    anzeigeListe.forEach((item) => {
        const realIdx = allData.spiele.indexOf(item);
        const tr = document.createElement("tr");
        if (item.age && item.age.toLowerCase().includes("turnier")) tr.classList.add("is-tournament");

        tr.innerHTML = `
            <td><input type="date" value="${item.date || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'date',this.value)"></td>
            <td><input type="text" value="${item.time || ''}" placeholder="00:00" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'time',this.value)"></td>
            <td><input type="text" value="${item.hall || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'hall',this.value)"></td>
            <td><input type="text" value="${item.age || ''}" placeholder="z.B. mB-Jugend" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'age',this.value)"></td>
            <td><input type="text" value="${item.jsr1 || ''}" placeholder="Keiner" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr1',this.value)"></td>
            <td><input type="text" value="${item.jsr2 || ''}" placeholder="Keiner" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr2',this.value)"></td>
            <td>
                <select ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'status',this.value)" class="status-select ${item.status==='Offen'?'red':'green'}">
                    <option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option>
                    <option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
                </select>
            </td>
            <td>
                ${item.status === 'Offen' ? 
                `<button class="whatsapp-btn" onclick="sendWhatsApp('${item.date}','${item.time}','${item.hall}','${item.age}')">Melden 🟢</button>` : 
                '<span class="badge-besetzt">Eingeteilt</span>'}
            </td>
            ${isAdmin ? `<td><button class="add-btn" style="background:none; border:none; padding:0; cursor:pointer; font-size:1.2rem;" onclick="deleteEntry(${realIdx})">🗑️</button></td>` : ''}
        `;
        tbody.appendChild(tr);
    });
}

window.updateRow = async (idx, key, val) => {
    if (userRole !== 'admin') return;
    allData.spiele[idx][key] = val;
    await setDoc(DOC_REF, { spiele: allData.spiele });
};

window.addEntry = async () => {
    if (userRole !== 'admin') return;
    
    const morgen = new Date();
    morgen.setDate(morgen.getDate() + 1);
    const datumString = morgen.toISOString().split('T')[0];
    
    allData.spiele.push({ date: datumString, time: "10:00", hall: "", age: "", jsr1: "", jsr2: "", status: "Offen" });
    await setDoc(DOC_REF, { spiele: allData.spiele });
};

window.deleteEntry = async (idx) => {
    if (confirm("Dieses Spiel wirklich unwiderruflich aus der Datenbank löschen?")) {
        allData.spiele.splice(idx, 1);
        await setDoc(DOC_REF, { spiele: allData.spiele });
    }
};

window.sendWhatsApp = (d, t, h, a) => {
    const meinName = currentUserInfo ? currentUserInfo.name : "Ein Schiedsrichter";
    const msg = encodeURIComponent(`Hallo! Hier ist ${meinName}.\nIch möchte mich für folgendes Spiel pfeifen melden:\n\n📅 Datum: ${d}\n⏰ Zeit: ${t} Uhr\n🏢 Halle: ${h}\n⚽ Spiel/Turnier: ${a}\n\nIst das Spiel noch frei und kann ich eingeteilt werden?`);
    window.open(`https://wa.me/${WHATSAPP_NUMMER}?text=${msg}`, '_blank');
};

function updateDashboard() {
    const dash = document.getElementById("dashboard");
    if (!dash) return;
    const gesamtSpiele = allData.spiele.length;
    const offen = allData.spiele.filter(s => s.status === 'Offen').length;
    const besetzt = gesamtSpiele - offen;

    dash.innerHTML = `
        <div class="stat-card" style="background:var(--primary-blue)"><b>${gesamtSpiele}</b> Gesamt (Saison)</div>
        <div class="stat-card" style="background:var(--danger-red)"><b>${offen}</b> Aktuell Offen</div>
        <div class="stat-card" style="background:var(--success-green)"><b>${besetzt}</b> Besetzt</div>
    `;
}