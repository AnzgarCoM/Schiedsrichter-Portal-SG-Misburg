import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let allData = { spiele: [], turniere: [] };

window.handleLogin = function() {
    const input = document.getElementById("pwInput").value;
    if (input === ADMIN_PW) { userRole = 'admin'; startApp(); }
    else if (input === SCHIRI_PW) { userRole = 'schiri'; startApp(); }
    else { document.getElementById("errorMsg").innerText = "Falsches Passwort!"; }
};

function startApp() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    document.getElementById("userStatus").innerText = userRole === 'admin' ? "Modus: Admin" : "Modus: Schiri";

    if (userRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }

    onSnapshot(doc(db, "plan", "neue_struktur"), (docSnap) => {
        if (docSnap.exists()) {
            allData = docSnap.data();
            renderAll();
        } else {
            setDoc(doc(db, "plan", "neue_struktur"), { spiele: [], turniere: [] });
        }
    });
}

function renderAll() {
    // Sortieren nach Datum
    allData.spiele.sort((a,b) => new Date(a.date) - new Date(b.date));
    allData.turniere.sort((a,b) => new Date(a.date) - new Date(b.date));

    renderTable("spieleTable", allData.spiele, "spiele");
    renderTable("turnierTable", allData.turniere, "turniere");
    renderDashboard();
}

function renderTable(tableId, data, type) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = "";
    const isAdmin = (userRole === 'admin');

    data.forEach((item, i) => {
        const tr = document.createElement("tr");
        if (type === "spiele") {
            tr.innerHTML = `
                <td><input type="date" value="${item.date}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'date',this.value)"></td>
                <td><input type="text" value="${item.time}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'time',this.value)"></td>
                <td><input value="${item.hall}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'hall',this.value)"></td>
                <td><input value="${item.age}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'age',this.value)"></td>
                <td><input value="${item.note}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'note',this.value)"></td>
                <td><input value="${item.jsrs}" ${!isAdmin?'disabled':''} placeholder="Namen..." onchange="updateRow('${type}',${i},'jsrs',this.value)"></td>
                <td><select ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'status',this.value)">
                    <option ${item.status==='Offen'?'selected':''}>Offen</option>
                    <option ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
                </select></td>
                ${isAdmin ? `<td><button onclick="deleteEntry('${type}',${i})" style="color:red">X</button></td>` : ''}
            `;
        } else {
            tr.innerHTML = `
                <td><input type="date" value="${item.date}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'date',this.value)"></td>
                <td><input type="text" value="${item.time}" ${!isAdmin?'disabled':''} placeholder="z.B. 10-15 Uhr" onchange="updateRow('${type}',${i},'time',this.value)"></td>
                <td><input value="${item.hall}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'hall',this.value)"></td>
                <td><input value="${item.name}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'name',this.value)"></td>
                <td><input value="${item.jsrs}" ${!isAdmin?'disabled':''} placeholder="Wer pfeift?" onchange="updateRow('${type}',${i},'jsrs',this.value)"></td>
                <td><select ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'status',this.value)">
                    <option ${item.status==='Offen'?'selected':''}>Offen</option>
                    <option ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
                </select></td>
                ${isAdmin ? `<td><button onclick="deleteEntry('${type}',${i})" style="color:red">X</button></td>` : ''}
            `;
        }
        tbody.appendChild(tr);
    });
}

window.updateRow = async (type, i, key, val) => {
    if(userRole !== 'admin') return;
    allData[type][i][key] = val;
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

window.addEntry = async (type) => {
    const newItem = type === "spiele" 
        ? {date:"", time:"", hall:"", age:"", note:"", jsrs:"", status:"Offen"}
        : {date:"", time:"", hall:"", name:"", jsrs:"", status:"Offen"};
    allData[type].push(newItem);
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

window.deleteEntry = async (type, i) => {
    if(!confirm("Löschen?")) return;
    allData[type].splice(i, 1);
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

function renderDashboard() {
    const offeneSpiele = allData.spiele.filter(s => s.status === "Offen").length;
    const offeneTurniere = allData.turniere.filter(t => t.status === "Offen").length;
    document.getElementById("dashboard").innerHTML = `
        <div class="statBox">Offene Spiele: ${offeneSpiele}</div>
        <div class="statBox">Offene Turniere: ${offeneTurniere}</div>
    `;
}

window.exportPDF = () => {
    const el = document.getElementById("mainContent");
    html2pdf().from(el).set({ margin: 5, filename: 'JSR-Plan.pdf', html2canvas: { scale: 2 } }).save();
};



