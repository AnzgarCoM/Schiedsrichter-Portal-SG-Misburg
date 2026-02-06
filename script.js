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

window.addEventListener('online', () => document.getElementById('onlineIndicator').className = 'status-dot online');
window.addEventListener('offline', () => document.getElementById('onlineIndicator').className = 'status-dot offline');

window.handleLogin = function() {
    const pw = document.getElementById("pwInput").value;
    if (pw === ADMIN_PW) { userRole = 'admin'; startApp(); }
    else if (pw === SCHIRI_PW) { userRole = 'schiri'; startApp(); }
    else { document.getElementById("errorMsg").innerText = "Falsch!"; }
};

function startApp() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    document.getElementById("userStatus").innerText = userRole === 'admin' ? "Admin" : "Schiedsrichter";

    const isMobile = window.innerWidth < 800;
    calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        initialView: isMobile ? 'listMonth' : 'dayGridMonth',
        locale: 'de',
        height: 'auto',
        headerToolbar: { left: 'prev,next today', center: 'title', right: isMobile ? '' : 'dayGridMonth,listMonth' }
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

    renderTable("spieleTable", allData.spiele, "spiele");
    renderTable("turnierTable", allData.turniere, "turniere");
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
        let h = '';
        fields.forEach(f => h += `<td><input type="${f==='date'?'date':'text'}" value="${item[f]||''}" ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'${f}',this.value)"></td>`);
        h += `<td><select ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'status',this.value)"><option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option><option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option></select></td>`;
        if(isAdmin) h += `<td><button onclick="deleteEntry('${type}',${i})">🗑️</button></td>`;
        tr.innerHTML = h; tbody.appendChild(tr);
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
        fields.forEach(f => h += `<div class="card-item"><label>${f[0]}</label><input type="${f[2]}" value="${item[f[1]]||''}" ${userRole!=='admin'?'disabled':''} onchange="updateRow('${type}',${i},'${f[1]}',this.value)"></div>`);
        h += `<div class="card-item full"><label>Status</label><select ${userRole!=='admin'?'disabled':''} onchange="updateRow('${type}',${i},'status',this.value)"><option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option><option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option></select></div></div>`;
        if(userRole==='admin') h += `<span onclick="deleteEntry('${type}',${i})" style="position:absolute;top:10px;right:10px;">🗑️</span>`;
        div.innerHTML = h; container.appendChild(div);
    });
}

function updateDashboard() {
    const offen = allData.spiele.filter(s => s.status === 'Offen').length + allData.turniere.filter(t => t.status === 'Offen').length;
    const gesamt = allData.spiele.length + allData.turniere.length;
    document.getElementById("dashboard").innerHTML = `
        <div class="stat-card blue-card"><span class="stat-num">${gesamt}</span><span class="stat-label">Termine</span></div>
        <div class="stat-card ${offen>0?'red-card':'green-card'}"><span class="stat-num">${offen}</span><span class="stat-label">Offen</span></div>
        <div class="stat-card green-card"><span class="stat-num">${gesamt-offen}</span><span class="stat-label">Besetzt</span></div>`;
}

window.updateRow = async (t, i, k, v) => { if(userRole==='admin'){ allData[t][i][k]=v; await setDoc(doc(db,"plan","neue_struktur"),allData); }};
window.addEntry = async (t) => { const e = t==='spiele'?{date:"",time:"",hall:"",age:"",jsr1:"",jsr2:"",bemerkung:"",status:"Offen"}:{date:"",time:"",hall:"",name:"",jsr1:"",jsr2:"",jsr3:"",status:"Offen"}; allData[t].push(e); await setDoc(doc(db,"plan","neue_struktur"),allData); };
window.deleteEntry = async (t, i) => { if(confirm("Löschen?")){ allData[t].splice(i,1); await setDoc(doc(db,"plan","neue_struktur"),allData); }};

function updateCalendar() {
    calendar.removeAllEvents();
    allData.spiele.concat(allData.turniere).forEach(item => {
        if(item.date) calendar.addEvent({ title: (item.age || item.name) + " (" + (item.jsr1||'?') + ")", start: item.date, color: item.status==='Offen'?'#e53e3e':'#3182ce' });
    });
}

function updateChart() {
    const s = {}; allData.spiele.concat(allData.turniere).forEach(i => { [i.jsr1, i.jsr2, i.jsr3].forEach(n => { if(n) s[n] = (s[n]||0)+1; })});
    const ctx = document.getElementById('statsChart'); if(myChart) myChart.destroy();
    myChart = new Chart(ctx, { type:'pie', data:{ labels:Object.keys(s), datasets:[{data:Object.values(s), backgroundColor:['#3182ce','#38a169','#e53e3e','#ecc94b']}] }});
}

window.exportPDF = () => html2pdf().from(document.getElementById("mainContent")).save();