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
let myChart = null;

window.handleLogin = function() {
    const input = document.getElementById("pwInput").value;
    if (input === ADMIN_PW) { userRole = 'admin'; startApp(); }
    else if (input === SCHIRI_PW) { userRole = 'schiri'; startApp(); }
    else { document.getElementById("errorMsg").innerText = "Falsches Passwort!"; }
};

function startApp() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    document.getElementById("userStatus").innerText = userRole === 'admin' ? "Admin" : "Schiedsrichter";

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
    allData.spiele.sort((a,b) => new Date(a.date) - new Date(b.date));
    allData.turniere.sort((a,b) => new Date(a.date) - new Date(b.date));

    renderTable("spieleTable", allData.spiele, "spiele");
    renderTable("turnierTable", allData.turniere, "turniere");
    renderDashboard();
    updateChart();

    if (userRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = (el.tagName === 'TH' || el.tagName === 'TD') ? 'table-cell' : 'block';
        });
    }
}

function renderTable(tableId, data, type) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = "";
    const isAdmin = (userRole === 'admin');

    data.forEach((item, i) => {
        const tr = document.createElement("tr");
        if (type === "spiele") {
            tr.innerHTML = `
                <td><input type="date" value="${item.date||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'date',this.value)"></td>
                <td><input type="text" value="${item.time||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'time',this.value)"></td>
                <td><input value="${item.hall||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'hall',this.value)"></td>
                <td><input value="${item.age||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'age',this.value)"></td>
                <td><input value="${item.note||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'note',this.value)"></td>
                <td><input value="${item.jsr1||''}" ${!isAdmin?'disabled':''} placeholder="JSR 1" onchange="updateRow('${type}',${i},'jsr1',this.value)"></td>
                <td><input value="${item.jsr2||''}" ${!isAdmin?'disabled':''} placeholder="JSR 2" onchange="updateRow('${type}',${i},'jsr2',this.value)"></td>
                <td><input value="${item.bemerkung||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'bemerkung',this.value)"></td>
                <td><select ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'status',this.value)">
                    <option ${item.status==='Offen'?'selected':''}>Offen</option>
                    <option ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
                </select></td>
                ${isAdmin ? `<td><button onclick="deleteEntry('${type}',${i})" style="color:red">X</button></td>` : ''}
            `;
        } else {
            tr.innerHTML = `
                <td><input type="date" value="${item.date||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'date',this.value)"></td>
                <td><input type="text" value="${item.time||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'time',this.value)"></td>
                <td><input value="${item.hall||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'hall',this.value)"></td>
                <td><input value="${item.name||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'name',this.value)"></td>
                <td><input value="${item.jsr1||''}" ${!isAdmin?'disabled':''} placeholder="JSR 1" onchange="updateRow('${type}',${i},'jsr1',this.value)"></td>
                <td><input value="${item.jsr2||''}" ${!isAdmin?'disabled':''} placeholder="JSR 2" onchange="updateRow('${type}',${i},'jsr2',this.value)"></td>
                <td><input value="${item.jsr3||''}" ${!isAdmin?'disabled':''} placeholder="JSR 3" onchange="updateRow('${type}',${i},'jsr3',this.value)"></td>
                <td><input value="${item.bemerkung||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'bemerkung',this.value)"></td>
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
        ? {date:"", time:"", hall:"", age:"", note:"", jsr1:"", jsr2:"", bemerkung:"", status:"Offen"}
        : {date:"", time:"", hall:"", name:"", jsr1:"", jsr2:"", jsr3:"", bemerkung:"", status:"Offen"};
    allData[type].push(newItem);
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

window.deleteEntry = async (type, i) => {
    if(!confirm("Löschen?")) return;
    allData[type].splice(i, 1);
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

function renderDashboard() {
    const dash = document.getElementById("dashboard");
    const offeneSpiele = allData.spiele.filter(s => s.status === "Offen").length;
    const offeneTurniere = allData.turniere.filter(t => t.status === "Offen").length;
    const gesamt = allData.spiele.length + allData.turniere.length;
    const offen = offeneSpiele + offeneTurniere;

    dash.innerHTML = `
        <div class="stat-card blue-card"><span class="stat-num">${gesamt}</span><span class="stat-label">Termine</span></div>
        <div class="stat-card ${offen > 0 ? 'red-card' : 'green-card'}"><span class="stat-num">${offen}</span><span class="stat-label">Dringend</span></div>
        <div class="stat-card green-card"><span class="stat-num">${gesamt - offen}</span><span class="stat-label">Besetzt</span></div>
    `;
}

function updateChart() {
    const ctx = document.getElementById('statsChart');
    if (!ctx) return;
    const stats = {};
    [...allData.spiele, ...allData.turniere].forEach(item => {
        [item.jsr1, item.jsr2, item.jsr3].forEach(name => {
            if (name && name.trim() !== "") {
                const n = name.trim();
                stats[n] = (stats[n] || 0) + 1;
            }
        });
    });
    if (myChart) myChart.destroy();
    if (Object.keys(stats).length === 0) return;
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(stats),
            datasets: [{
                data: Object.values(stats),
                backgroundColor: ['#4299e1', '#48bb78', '#f6ad55', '#ed64a6', '#9f7aea', '#667eea']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

window.exportPDF = () => {
    const el = document.getElementById("mainContent");
    html2pdf().from(el).set({ margin: 5, filename: 'JSR_Plan.pdf', html2canvas: { scale: 2 } }).save();
};
