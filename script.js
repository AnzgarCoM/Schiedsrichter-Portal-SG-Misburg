import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Deine Firebase Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyC27vfNJL-mxl5wtg69WsWPkaceEP6yUjs",
  authDomain: "jsr-1-d3000.firebaseapp.com",
  projectId: "jsr-1-d3000",
  storageBucket: "jsr-1-d3000.firebasestorage.app",
  messagingSenderId: "909465128275",
  appId: "1:909465128275:web:7729bcda224ae767ff65a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_PW = "admin2025";
const SCHIRI_PW = "schiri2025";

let userRole = null;
let currentPlan = [];

// LOGIN FUNKTION (Global verfügbar machen)
window.handleLogin = function() {
    const input = document.getElementById("pwInput").value;
    const error = document.getElementById("errorMsg");

    if (input === ADMIN_PW) {
        userRole = 'admin';
        startApp();
    } else if (input === SCHIRI_PW) {
        userRole = 'schiri';
        startApp();
    } else {
        error.innerText = "Falsches Passwort!";
    }
};

async function startApp() {
    // Elemente ein/ausblenden
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    
    document.getElementById("userStatus").innerText = userRole === 'admin' ? "Modus: Administrator" : "Modus: Schiedsrichter";

    // Admin-spezifische Elemente zeigen
    if (userRole === 'admin') {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            if (el.tagName === 'TH' || el.tagName === 'TD') {
                el.style.display = 'table-cell';
            } else {
                el.style.display = 'block';
            }
        });
    }

    // Live-Verbindung zu Firebase Firestore
    onSnapshot(doc(db, "plan", "spiele"), (docSnap) => {
        if (docSnap.exists()) {
            currentPlan = docSnap.data().liste || [];
            renderTable();
        } else {
            // Initiales Dokument erstellen falls leer
            setDoc(doc(db, "plan", "spiele"), { liste: [] });
        }
    });
}

function renderTable() {
    const tbody = document.querySelector("#mainTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    const isAdmin = (userRole === 'admin');

    currentPlan.forEach((g, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="date" value="${g.date || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${i},'date',this.value)"></td>
            <td><input type="text" value="${g.time || ''}" ${!isAdmin?'disabled':''} style="width:80px" onchange="updateRow(${i},'time',this.value)"></td>
            <td><input value="${g.hall || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${i},'hall',this.value)"></td>
            <td><input value="${g.age || ''}" ${!isAdmin?'disabled':''} style="width:60px" onchange="updateRow(${i},'age',this.value)"></td>
            <td><input value="${g.note || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${i},'note',this.value)"></td>
            <td><input value="${g.jsr1 || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${i},'jsr1',this.value)"></td>
            <td><input value="${g.jsr2 || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${i},'jsr2',this.value)"></td>
            <td><input value="${g.jsr3 || ''}" ${!isAdmin?'disabled':''} onchange="updateRow(${i},'jsr3',this.value)"></td>
            <td>
                <select ${!isAdmin?'disabled':''} onchange="updateRow(${i},'status',this.value)">
                    <option ${g.status==='Offen'?'selected':''}>Offen</option>
                    <option ${g.status==='Besetzt'?'selected':''}>Besetzt</option>
                </select>
            </td>
            ${isAdmin ? `<td><button onclick="deleteGame(${i})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px;">X</button></td>` : ''}
        `;
        tbody.appendChild(tr);
    });
    renderDashboard();
}

// DATENÄNDERUNG (Global)
window.updateRow = async (i, key, val) => {
    if(userRole !== 'admin') return;
    currentPlan[i][key] = val;
    await updateDoc(doc(db, "plan", "spiele"), { liste: currentPlan });
};

window.addGame = async () => {
    if(userRole !== 'admin') return;
    currentPlan.push({date:"", time:"", hall:"", age:"", note:"", jsr1:"", jsr2:"", jsr3:"", status:"Offen"});
    await updateDoc(doc(db, "plan", "spiele"), { liste: currentPlan });
};

window.deleteGame = async (i) => {
    if(userRole !== 'admin' || !confirm("Eintrag löschen?")) return;
    currentPlan.splice(i, 1);
    await updateDoc(doc(db, "plan", "spiele"), { liste: currentPlan });
};

function renderDashboard() {
    const dash = document.getElementById("dashboard");
    if (!dash) return;
    const offen = currentPlan.filter(g => g.status === "Offen").length;
    dash.innerHTML = `
        <div class="statBox">Gesamt-Spiele: ${currentPlan.length}</div>
        <div class="statBox" style="color:red; border-color:red;">Noch offen: ${offen}</div>
    `;
}

window.exportPDF = () => {
    const el = document.getElementById("mainContent");
    if (el) html2pdf().from(el).save("Schiriplan_Misburg.pdf");
};



