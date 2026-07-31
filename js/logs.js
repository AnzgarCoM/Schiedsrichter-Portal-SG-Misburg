// =====================================
// SG MISBURG JSR PORTAL
// SYSTEM LOGS
// =====================================


import {

db

}

from "./firebase.js";



import {

collection,
addDoc,
getDocs,
orderBy,
query

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";







const logCollection =
collection(
db,
"logs"
);








// =====================================
// LOG SPEICHERN
// =====================================


export async function createLog(action){



try{


await addDoc(

logCollection,

{


action:action,


user:

window.currentUser

?

window.currentUser.name

:

"System",



role:

window.currentUser

?

window.currentUser.role

:

"System",




date:

new Date()
.toLocaleString(
"de-DE"
),



timestamp:

Date.now()


}

);



}

catch(error){


console.error(
"Log Fehler:",
error
);



}



}









// =====================================
// LOGS LADEN
// =====================================


export async function loadLogs(){



const box =
document.getElementById(
"logList"
);



if(!box)
return;



box.innerHTML =
"⏳ Lade System Logs...";





try{



const logsQuery =
query(

logCollection,

orderBy(
"timestamp",
"desc"
)

);



const snapshot =
await getDocs(
logsQuery
);



box.innerHTML="";



if(snapshot.empty){



box.innerHTML = `

<div class="empty">

Keine Systemaktionen vorhanden.

</div>

`;

return;


}







snapshot.forEach(
(item)=>{


const log =
item.data();



box.innerHTML += `



<div class="log-card">


<div class="log-icon">

📋

</div>



<div>


<h3>

${log.action}

</h3>



<p>

👤 ${log.user}

</p>



<p>

🔐 ${log.role}

</p>



<span>

🕒 ${log.date}

</span>


</div>



</div>



`;



});



}



catch(error){



console.error(
"Logs Fehler:",
error
);



box.innerHTML =
"Fehler beim Laden der Logs";


}



}










// =====================================
// LOG BUTTON GLOBAL
// =====================================


window.addSystemLog =
createLog;