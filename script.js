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
            
            // Profil in der Datenbank anlegen/aktualisieren
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
            renderSpieleTable();
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

function renderSpieleTable() {
    const tbody = document.querySelector("#spieleTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const isAdmin = (userRole === 'admin');
    const heute = new Date().toISOString().split('T')[0];

    let anzeigeListe = [...allData.spiele].sort((a, b) => new Date(a.date) - new Date(b.date));
    anzeigeListe = anzeigeListe.filter(s => s.date >= heute);

    anzeigeListe.forEach((item) => {
        const realIdx = allData.spiele.indexOf(item);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="date" value="${item.date || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'date',this.value)"></td>
            <td><input type="text" value="${item.time || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'time',this.value)"></td>
            <td><input type="text" value="${item.hall || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'hall',this.value)"></td>
            <td><input type="text" value="${item.age || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'age',this.value)"></td>
            <td><input type="text" value="${item.jsr1 || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr1',this.value)"></td>
            <td><input type="text" value="${item.jsr2 || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'jsr2',this.value)"></td>
            <td>
                <select ${!isAdmin?'disabled':''} onchange="updateRow(${realIdx},'status',this.value)" class="status-select ${item.status==='Offen'?'red':'green'}">
                    <option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option>
                    <option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
                </select>
            </td>
            <td>
                ${item.status === 'Offen' ? `<button class="whatsapp-btn" onclick="sendWhatsApp('${item.date}','${item.time}','${item.hall}','${item.age}')">Melden 🟢</button>` : 'Eingeteilt'}
            </td>
            ${isAdmin ? `<td><button style="background:none; border:none; cursor:pointer;" onclick="deleteEntry(${realIdx})">🗑️</button></td>` : ''}
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
    allData.spiele.push({ date: morgen.toISOString().split('T')[0], time: "10:00", hall: "", age: "", jsr1: "", jsr2: "", status: "Offen" });
    await setDoc(DOC_REF, { spiele: allData.spiele });
};

window.deleteEntry = async (idx) => {
    if (confirm("Spiel löschen?")) {
        allData.spiele.splice(idx, 1);
        await setDoc(DOC_REF, { spiele: allData.spiele });
    }
};

window.sendWhatsApp = (d, t, h, a) => {
    const msg = encodeURIComponent(`Hallo! Hier ist ${currentUserInfo.name}.\nIch möchte mich für das Spiel am ${d} um ${t} Uhr in der Halle ${h} (${a}) melden.`);
    window.open(`https://wa.me/${WHATSAPP_NUMMER}?text=${msg}`, '_blank');
};

function updateDashboard() {
    const dash = document.getElementById("dashboard");
    if (!dash) return;
    const gesamt = allData.spiele.length;
    const offen = allData.spiele.filter(s => s.status === 'Offen').length;
    dash.innerHTML = `
        <div class="stat-card" style="background:var(--primary-blue)"><b>${gesamt}</b> Spiele</div>
        <div class="stat-card" style="background:var(--danger-red)"><b>${offen}</b> Offen</div>
        <div class="stat-card" style="background:var(--success-green)"><b>${gesamt - offen}</b> Besetzt</div>
    `;
}