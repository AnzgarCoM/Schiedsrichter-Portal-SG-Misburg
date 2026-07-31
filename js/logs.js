// ======================================
// SG MISBURG JSR PORTAL
// SYSTEM LOGS
// ======================================


import {db} from "./firebase.js";



import {

collection,
getDocs,
addDoc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";







export async function loadLogs(){



const list =
document.getElementById(
"logList"
);



if(!list)
return;




const snapshot =
await getDocs(

collection(
db,
"logs"
)

);





list.innerHTML="";




snapshot.forEach(

(log)=>{


const l =
log.data();




list.innerHTML += `


<div class="card">


<p>

<b>

${l.action || "Aktion"}

</b>

</p>



<p>

${l.date || ""}

</p>


</div>


`;



});



}










export async function createLog(text){



await addDoc(

collection(
db,
"logs"
),

{


action:text,


date:
new Date()
.toLocaleString(
"de-DE"
)



}

);


}