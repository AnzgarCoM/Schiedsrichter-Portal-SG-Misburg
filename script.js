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
    else { document.getElementById("errorMsg").innerText = "Falsches Passwort!"; }
};

function startApp() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    document.getElementById("userStatus").innerText = userRole === 'admin' ? "Modus: Admin" : "Modus: Schiedsrichter";

    const calEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calEl, {
        initialView: window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth',
        locale: 'de',
        firstDay: 1,
        headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
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

    renderTable("spieleTable", allData.spiele, "spiele");
    renderTable("turnierTable", allData.turniere, "turniere");
    renderDashboard();
    updateCalendar();

    if (userRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        updateChart();
    }
}

function updateCalendar() {
    calendar.removeAllEvents();
    allData.spiele.forEach(s => {
        if (s.date) {
            const schiris = [s.jsr1, s.jsr2].filter(n => n).join(" & ");
            calendar.addEvent({
                title: `${s.time || ''} | ${s.age || ''} | ${s.hall || ''}\nJSR: ${schiris || 'Offen'}`,
                start: s.date,
                color: s.status === 'Offen' ? '#e53e3e' : '#3182ce'
            });
        }
    });
    allData.turniere.forEach(t => {
        if (t.date) {
            const schiris = [t.jsr1, t.jsr2, t.jsr3].filter(n => n).join(", ");
            calendar.addEvent({
                title: `🏆 ${t.name || 'Turnier'}\n${t.time || ''} | ${t.hall || ''}\nJSR: ${schiris || 'Offen'}`,
                start: t.date,
                color: '#ed8936'
            });
        }
    });
}

function renderTable(tableId, data, type) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = "";
    const isAdmin = (userRole === 'admin');

    data.forEach((item, i) => {
        const tr = document.createElement("tr");
        const fields = type === 'spiele' 
            ? ['date','time','hall','age','jsr1','jsr2','bemerkung']
            : ['date','time','hall','name','jsr1','jsr2','jsr3','bemerkung'];
        
        let html = '';
        fields.forEach(f => {
            let ph = f.startsWith('jsr') ? 'JSR Name' : (f === 'time' ? 'Uhrzeit' : '');
            let extraClass = (f === 'time') ? 'class="time-col"' : '';
            html += `<td ${extraClass}><input type="${f==='date'?'date':'text'}" value="${item[f]||''}" ${!isAdmin?'disabled':''} placeholder="${ph}" onchange="updateRow('${type}',${i},'${f}',this.value)"></td>`;
        });
        
        html += `<td class="status-col"><select ${!isAdmin?'disabled':''} onchange="updateRow('${type}',${i},'status',this.value)">
            <option value="Offen" ${item.status==='Offen'?'selected':''}>Offen</option>
            <option value="Besetzt" ${item.status==='Besetzt'?'selected':''}>Besetzt</option>
        </select></td>`;
        
        if(isAdmin) html += `<td><button onclick="deleteEntry('${type}',${i})" style="background:none; border:none; color:red; cursor:pointer; font-size:1.2rem;">🗑️</button></td>`;
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

window.updateRow = async (type, i, key, val) => {
    if(userRole !== 'admin') return;
    allData[type][i][key] = val;
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

window.addEntry = async (type) => {
    const empty = type === 'spiele' 
        ? {date:"",time:"",hall:"",age:"",jsr1:"",jsr2:"",bemerkung:"",status:"Offen"}
        : {date:"",time:"",hall:"",name:"",jsr1:"",jsr2:"",jsr3:"",bemerkung:"",status:"Offen"};
    allData[type].push(empty);
    await setDoc(doc(db, "plan", "neue_struktur"), allData);
};

window.deleteEntry = async (type, i) => {
    if(confirm("Diesen Eintrag wirklich löschen?")) {
        allData[type].splice(i,1);
        await setDoc(doc(db, "plan", "neue_struktur"), allData);
    }
};

function renderDashboard() {
    const offen = allData.spiele.filter(s => s.status === 'Offen').length + allData.turniere.filter(t => t.status === 'Offen').length;
    const gesamt = allData.spiele.length + allData.turniere.length;
    document.getElementById("dashboard").innerHTML = `
        <div class="stat-card blue-card"><span class="stat-num">${gesamt}</span>Gesamt</div>
        <div class="stat-card ${offen>0?'red-card':'green-card'}"><span class="stat-num">${offen}</span>Offen</div>
        <div class="stat-card green-card"><span class="stat-num">${gesamt-offen}</span>Besetzt</div>
    `;
}

function updateChart() {
    const stats = {};
    [...allData.spiele, ...allData.turniere].forEach(item => {
        [item.jsr1, item.jsr2, item.jsr3].forEach(name => {
            if(name && name.trim()) stats[name.trim()] = (stats[name.trim()]||0) + 1;
        });
    });
    const ctx = document.getElementById('statsChart');
    if (myChart) myChart.destroy();
    if (Object.keys(stats).length === 0) return;
    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(stats).map(n => `${n} (${stats[n]})`),
            datasets: [{ data: Object.values(stats), backgroundColor: ['#3182ce','#38a169','#e53e3e','#ecc94b','#9f7aea','#ed8936'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

window.exportPDF = () => {
    const el = document.getElementById("mainContent");
    html2pdf().from(el).set({ margin: 5, filename: 'JSR_Plan.pdf', html2canvas: { scale: 2 } }).save();
};
