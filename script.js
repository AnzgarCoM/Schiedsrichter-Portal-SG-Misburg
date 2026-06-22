import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, collection, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const DOC_REF = doc(db, "plan", "test_struktur");

const ADMIN_UID = "2SN0Uscvh6OQbAKvriVfOW49ecD3";
const WHATSAPP_NUMMER = "4915204500763"; 

let currentUserInfo = null;
let userRole = null; 
let allData = { spiele: [] };
let allUsers = [];

// --- GOOGLE LOGIN ---
window.handleGoogleLogin = () => {
    signInWithPopup(auth, provider)
        .then(async (result) => {
            const user = result.user;
            const isAdmin = (user.uid === ADMIN_UID);
            
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: user.displayName || "Unbekannter Schiri",
                email: user.email,
                approved: isAdmin
            }, { merge: true });
        })
        .catch(e => alert("Google Login fehlgeschlagen: " + e.message));
};

window.handleLogout = () => signOut(auth).then(() => location.reload());

// --- STATUS ÜBERWACHUNG ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.uid === ADMIN_UID) {
            userRole = 'admin';
            currentUserInfo = { name: user.displayName || "Admin", email: user.email, approved: true };
            startApp();
        } else {
            onSnapshot(doc(db, "users", user.uid), (userSnap) => {
                if (userSnap.exists()) {
                    currentUserInfo = userSnap.data();
                    userRole = currentUserInfo.approved ? 'schiri' : 'unapproved';
                } else {
                    userRole = 'unapproved';
                }
                startApp();
            });
        }
    } else {
        document.getElementById("loginSection").style.display = "block";
        document.getElementById("mainContent").style.display = "none";
        document.getElementById("approvalWaitSection").style.display = "none";
        document.getElementById("logoutBtn").style.display = "none";
    }
});

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
        ? `👑 Admin-Modus (${currentUserInfo.name})` 
        : `🏃 JSR-Bereich (Eingeloggt als: ${currentUserInfo.name})`;
    
    if (userRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'block');
        onSnapshot(query(collection(db, "users")), (snaps) => {
            allUsers = [];
            snaps.forEach(d => allUsers.push(d.data()));
            renderUsersTable();
        });
    }

    onSnapshot(DOC_REF, (snap) => {
        if (snap.exists()) {
            allData.spiele = Array.isArray(snap.data().spiele) ? snap.data().spiele : [];
            renderAllTables();
            updateDashboard();
        } else if (userRole === 'admin') {
            setDoc(DOC_REF, { spiele: [] });
        }
    });
}

function renderUsersTable() {
    const tbody = document.querySelector("#usersTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    allUsers.forEach((u) => {
        if (u.uid === ADMIN_UID) return; 
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${u.name}</b></td>
            <td>${u.email}</td>
            <td>
                <select onchange="updateUserApproval('${u.uid}', this.value)" class="status-select ${u.approved?'green':'red'}">
                    <option value="false" ${!u.approved?'selected':''}>❌ Gesperrt</option>
                    <option value="true" ${u.approved?'selected':''}>✅ Aktiv</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateUserApproval = async (uid, val) => {
    if (userRole !== 'admin') return;
    await setDoc(doc(db, "users", uid), { approved: (val === "true") }, { merge: true });
};

// --- SPLIT & RENDERING DER DREI BLÖCKE ---
function renderAllTables() {
    const heute = new Date().toISOString().split('T')[0];
    const isAdmin = (userRole === 'admin');

    // Sortierung nach Datum und Uhrzeit
    let sortierteSpiele = [...allData.spiele].sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return (a.time || "").localeCompare(b.time || "");
    });

    // Nur zukünftige Spiele anzeigen
    let gefilterteSpiele = sortierteSpiele.filter(s => (s.date || "") >= heute);

    // Tabellen-Bodys holen
    const bodyMeisterschaft = document.querySelector("#tableMeisterschaft tbody");
    const bodyTurniere = document.querySelector("#tableTurniere tbody");
    const bodyTestspiele = document.querySelector("#tableTestspiele tbody");

    bodyMeisterschaft.innerHTML = "";
    bodyTurniere.innerHTML = "";
    bodyTestspiele.innerHTML = "";

    gefilterteSpiele.forEach((item) => {
        const realIdx = allData.spiele.indexOf(item);
        const tr = document.createElement("tr");

        // Wenn ein alter Eintrag keinen Typ hat, Standard auf meisterschaft setzen
        const typ = item.type || 'meisterschaft';

        if (typ === 'turnier') {
            // Tabellen-Layout für Turniere (Mit 3 Schiedsrichtern!)
            tr.innerHTML = `
                <td><input type="date" value="${item.date || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'date',this.value)"></td>
                <td><input type="text" value="${item.time || ''}" placeholder="10:00" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'time',this.value)"></td>
                <td><input type="text" value="${item.hall || ''}" placeholder="Halle" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'hall',this.value)"></td>
                <td>
                    <select ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'age',this.value)">
                        <option value="" ${!item.age?'selected':''}>- Bitte wählen -</option>
                        <option value="mE-Jugend Turnier" ${item.age==='mE-Jugend Turnier'?'selected':''}>mE-Jugend Turnier</option>
                        <option value="wE-Jugend Turnier" ${item.age==='wE-Jugend Turnier'?'selected':''}>wE-Jugend Turnier</option>
                        <option value="mF-Jugend Turnier" ${item.age==='mF-Jugend Turnier'?'selected':''}>mF-Jugend Turnier</option>
                        <option value="wF-Jugend Turnier" ${item.age==='wF-Jugend Turnier'?'selected':''}>wF-Jugend Turnier</option>
                    </select>
                </td>
                <td><input type="text" value="${item.jsr1 || ''}" placeholder="JSR 1" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr1',this.value)"></td>
                <td><input type="text" value="${item.jsr2 || ''}" placeholder="JSR 2" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr2',this.value)"></td>
                <td><input type="text" value="${item.jsr3 || ''}" placeholder="JSR 3" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr3',this.value)"></td>
                <td>
                    <select ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'status',this.value)" class="status-select ${item.status==='Offen'?'red':'green'}">
                        <option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option>
                        <option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
                    </select>
                </td>
                <td>
                    ${item.status === 'Offen' ? `<button class="whatsapp-btn" onclick="sendWhatsApp('${item.date}','${item.time}','${item.hall}','${item.age}')">Melden 🟢</button>` : 'Besetzt'}
                </td>
                ${isAdmin ? `<td><button style="background:none; border:none; cursor:pointer;" onclick="deleteEntry(${realIdx})">🗑️</button></td>` : ''}
            `;
            bodyTurniere.appendChild(tr);

        } else {
            // Tabellen-Layout für Meisterschaft & Testspiele (Mit 2 Schiedsrichtern!)
            const altersOptionen = typ === 'testspiel' ? `
                <option value="mD-Jugend Testspiel" ${item.age==='mD-Jugend Testspiel'?'selected':''}>mD-Jugend Testspiel</option>
                <option value="wD-Jugend Testspiel" ${item.age==='wD-Jugend Testspiel'?'selected':''}>wD-Jugend Testspiel</option>
            ` : `
                <option value="mD-Jugend" ${item.age==='mD-Jugend'?'selected':''}>mD-Jugend</option>
                <option value="wD-Jugend" ${item.age==='wD-Jugend'?'selected':''}>wD-Jugend</option>
            `;

            tr.innerHTML = `
                <td><input type="date" value="${item.date || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'date',this.value)"></td>
                <td><input type="text" value="${item.time || ''}" placeholder="14:00" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'time',this.value)"></td>
                <td><input type="text" value="${item.hall || ''}" placeholder="Halle" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'hall',this.value)"></td>
                <td>
                    <select ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'age',this.value)">
                        <option value="" ${!item.age?'selected':''}>- Bitte wählen -</option>
                        ${altersOptionen}
                    </select>
                </td>
                <td><input type="text" value="${item.jsr1 || ''}" placeholder="JSR 1" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr1',this.value)"></td>
                <td><input type="text" value="${item.jsr2 || ''}" placeholder="JSR 2" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr2',this.value)"></td>
                <td>
                    <select ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'status',this.value)" class="status-select ${item.status==='Offen'?'red':'green'}">
                        <option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option>
                        <option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
                    </select>
                </td>
                <td>
                    ${item.status === 'Offen' ? `<button class="whatsapp-btn" onclick="sendWhatsApp('${item.date}','${item.time}','${item.hall}','${item.age}')">Melden 🟢</button>` : 'Besetzt'}
                </td>
                ${isAdmin ? `<td><button style="background:none; border:none; cursor:pointer;" onclick="deleteEntry(${realIdx})">🗑️</button></td>` : ''}
            `;

            if (typ === 'testspiel') {
                bodyTestspiele.appendChild(tr);
            } else {
                bodyMeisterschaft.appendChild(tr);
            }
        }
    });
}

window.updateRow = async (idx, key, val) => {
    if (userRole !== 'admin') return;
    allData.spiele[idx][key] = val;
    await setDoc(DOC_REF, { spiele: allData.spiele });
};

// --- HINZUFÜGEN ERWEITERT UM DEN JEWEILIGEN TYP ---
window.addEntry = async (blockTyp) => {
    if (userRole !== 'admin') return;
    const morgen = new Date();
    morgen.setDate(morgen.getDate() + 1);
    const datumString = morgen.toISOString().split('T')[0];
    
    let neuesSpiel = { 
        date: datumString, 
        time: "10:00", 
        hall: "", 
        age: "", 
        jsr1: "", 
        jsr2: "", 
        status: "Offen",
        type: blockTyp // Wichtig zur Zuordnung ('meisterschaft', 'turnier', 'testspiel')
    };

    // Für Turniere direkt den 3. Schiedsrichterplatz vorbereiten
    if (blockTyp === 'turnier') {
        neuesSpiel.jsr3 = "";
    }

    allData.spiele.push(neuesSpiel);
    await setDoc(DOC_REF, { spiele: allData.spiele });
};

window.deleteEntry = async (idx) => {
    if (confirm("Dieses Event wirklich unwiderruflich löschen?")) {
        allData.spiele.splice(idx, 1);
        await setDoc(DOC_REF, { spiele: allData.spiele });
    }
};

window.sendWhatsApp = (d, t, h, a) => {
    const msg = encodeURIComponent(`Hallo! Hier ist ${currentUserInfo.name}.\nIch möchte mich für folgende Ansetzung pfeifen melden:\n\n📅 Datum: ${d}\n⏰ Zeit: ${t} Uhr\n🏢 Halle: ${h}\n⚽ Spielbezeichnung: ${a || 'Nicht definiert'}\n\nKann ich eingeteilt werden?`);
    window.open(`https://wa.me/${WHATSAPP_NUMMER}?text=${msg}`, '_blank');
};

function updateDashboard() {
    const dash = document.getElementById("dashboard");
    if (!dash) return;
    const gesamt = allData.spiele.length;
    const offen = allData.spiele.filter(s => s.status === 'Offen').length;
    dash.innerHTML = `
        <div class="stat-card" style="background:var(--primary-blue)"><b>${gesamt}</b> Events Gesamt</div>
        <div class="stat-card" style="background:var(--danger-red)"><b>${offen}</b> Offene Ansetzungen</div>
        <div class="stat-card" style="background:var(--success-green)"><b>${gesamt - offen}</b> Besetzte Spiele</div>
    `;
}