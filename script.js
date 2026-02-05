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
let userRole = null, allData = { spiele: [], turniere: [] }, myChart = null, calendar = null;

window.handleLogin = function() {
    const pw = document.getElementById("pwInput").value;
    if (pw === ADMIN_PW) { userRole = 'admin'; startApp(); }
    else if (pw === SCHIRI_PW) { userRole = 'schiri'; startApp(); }
    else { document.getElementById("errorMsg").innerText = "Falsch!"; }
};

function startApp() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    
    calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: window.innerWidth < 800 ? 'listMonth' : 'dayGridMonth',
        locale: 'de',
        height: 'auto'
    });
    calendar.render();

    onSnapshot(doc(db, "plan", "neue_struktur"), (docSnap) => {
        if (docSnap.exists()) {
            allData = docSnap.data();
            renderAll();
        }
    });
}

function renderAll() {
    allData.spiele.sort((a,b) => new Date(a.date) - new Date(b.date));
    allData.turniere.sort((a,b) => new Date(a.date) - new Date(b.date));

    // PC Render
    renderTable("spieleTable", allData.spiele, "spiele");
    renderTable("turnierTable", allData.turniere, "turniere");

    // Mobile Render
    renderMobileCards("spieleMobile", allData.spiele, "spiele");
    renderMobileCards("turniereMobile", allData.turniere, "turniere");

    updateDashboard();
    updateCalendar();
    if(userRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(e => e.style.display = 'block');
        updateChart();
    }
}

function renderTable(id, data, type) {
    const tbody = document.querySelector(`#${id} tbody`);
    tbody.innerHTML = "";
    data.forEach((item, i) => {
        const tr = document.createElement("tr");
        const isAdmin = userRole === 'admin';
        const fields = type === 'spiele' ? ['date','time','hall','age','jsr1','jsr2','bemerkung'] : ['date','time','hall','name','jsr1','jsr2','jsr3','bemerkung'];
        
        let html = '';
        fields.forEach(f => {
            html += `<td><input type="${f==='date'?'date':'text'}" value="${item[f]||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'${f}',this.value)"></td>`;
        });
        html += `<td class="status-col"><select ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'status',this.value)">
            <option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option>
            <option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
        </select></td>`;
        if(isAdmin) html += `<td><button onclick="deleteEntry('${type}',${i})">🗑️</button></td>`;
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

function renderMobileCards(containerId, data, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    data.forEach((item, i) => {
        const div = document.createElement("div");
        div.className = `mobile-card ${item.status === 'Offen' ? 'offen' : 'besetzt'}`;
        const fields = type === 'spiele' ? [['Datum','date','date'],['Zeit','time','text'],['Halle','hall','text'],['Klasse','age','text'],['JSR 1','jsr1','text'],['JSR 2','jsr2','text']] : [['Datum','date','date'],['Zeit','time','text'],['Halle','hall','text'],['Turnier','name','text'],['JSR 1','jsr1','text'],['JSR 2','jsr2','text'],['JSR 3','jsr3','text']];
        
        let h = `<div class="card-grid">`;
        fields.forEach(f => {
            h += `<div class="card-item"><label>${f[0]}</label><input type="${f[2]}" value="${item[f[1]]||''}" ${userRole!=='admin'?'disabled':''} onchange="updateRow('${type}',${i},'${f[1]}',this.value)"></div>`;
        });
        h += `<div class="card-item full"><label>Status</label><select ${userRole!=='admin'?'disabled':''} onchange="updateRow('${type}',${i},'status',this.value)"><option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option><option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option></select></div></div>`;
        if(userRole==='admin') h += `<span class="delete-btn-mobile" onclick="deleteEntry('${type}',${i})">🗑️</span>`;
        div.innerHTML = h;
        container.appendChild(div);
    });
}

window.updateRow = async (type, i, key, val) => {
    if(userRole !== 'admin') return;
    allData[type][i][key] = val;
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

window.addEntry = async (type) => {
    const empty = type === 'spiele' ? {date:"",time:"",hall:"",age:"",jsr1:"",jsr2:"",bemerkung:"",status:"Offen"} : {date:"",time:"",hall:"",name:"",jsr1:"",jsr2:"",jsr3:"",bemerkung:"",status:"Offen"};
    allData[type].push(empty);
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

window.deleteEntry = async (type, i) => {
    if(confirm("Löschen?")) { allData[type].splice(i,1); await setDoc(doc(db, "plan", "neue_struktur"), allData); }
};

function updateDashboard() {
    const offen = allData.spiele.filter(s => s.status === 'Offen').length + allData.turniere.filter(t => t.status === 'Offen').length;
    const gesamt = allData.spiele.length + allData.turniere.length;
    document.getElementById("dashboard").innerHTML = `<div class="stat-card blue-card"><span>${gesamt}</span><br>Gesamt</div><div class="stat-card ${offen>0?'red-card':'green-card'}"><span>${offen}</span><br>Offen</div><div class="stat-card green-card"><span>${gesamt-offen}</span><br>Besetzt</div>`;
}

function updateCalendar() {
    calendar.removeAllEvents();
    allData.spiele.concat(allData.turniere).forEach(item => {
        if(item.date) calendar.addEvent({ title: (item.age || item.name) + " - " + (item.jsr1 || "Offen"), start: item.date, color: item.status === 'Offen' ? '#e53e3e' : '#3182ce' });
    });
}

function updateChart() {
    const stats = {};
    allData.spiele.concat(allData.turniere).forEach(item => {
        [item.jsr1, item.jsr2, item.jsr3].forEach(name => {
            if(name && name.trim()) stats[name.trim()] = (stats[name.trim()]||0) + 1;
        });
    });
    const ctx = document.getElementById('statsChart');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'pie',
        data: { labels: Object.keys(stats).map(n => `${n} (${stats[n]})`), datasets: [{ data: Object.values(stats), backgroundColor: ['#3182ce','#38a169','#e53e3e','#ecc94b','#9f7aea','#ed8936'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

window.exportPDF = () => {
    html2pdf().from(document.getElementById("mainContent")).set({ margin: 5, filename: 'JSR_Plan.pdf' }).save();
};