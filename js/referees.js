// ======================================
// SG MISBURG JSR PORTAL
// JSR KARTEI
// ======================================


import {db} from "./firebase.js";


import {

collection,
addDoc,
getDocs,
doc,
deleteDoc,
updateDoc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";





const refereeCollection =
collection(
db,
"referees"
);








// ======================================
// JSR LADEN
// ======================================


export async function loadReferees(){


const list =
document.getElementById(
"refereeList"
);



if(!list)
return;



list.innerHTML =
"⏳ Lade Jungschiedsrichter...";




const snapshot =
await getDocs(
refereeCollection
);



list.innerHTML="";




snapshot.forEach(
(item)=>{


const r =
item.data();




list.innerHTML += `


<div class="card">


<h3>

${r.firstname}
${r.lastname}

</h3>


<p>
📧 ${r.email}
</p>


<p>
📞 ${r.phone || "-"}
</p>



<p>

🧑‍⚖️ Klasse:
${r.level}

</p>



<p>

Status:
<b>
${r.status}
</b>

</p>



<button 
onclick="editReferee('${item.id}')">

Bearbeiten

</button>



<button

onclick="removeReferee('${item.id}')">

Löschen

</button>



<button

onclick="createPass('${item.id}')">

📄 Digitaler Pass

</button>


</div>


`;



});


}












// ======================================
// JSR ERSTELLEN
// ======================================


document
.addEventListener(

"DOMContentLoaded",

()=>{


const button =
document.getElementById(
"newRef"
);



if(button){


button.onclick =
createReferee;


}



});








async function createReferee(){



const firstname =
prompt(
"Vorname:"
);



const lastname =
prompt(
"Nachname:"
);



const email =
prompt(
"E-Mail:"
);



const level =
prompt(
"Einsatzklasse:"
);





if(
!firstname ||
!lastname
)
return;






await addDoc(

refereeCollection,

{


firstname,

lastname,

email,


level,


phone:"",


club:"SG Misburg",


status:"Aktiv",


created:
new Date()



}


);





alert(
"JSR gespeichert"
);



loadReferees();


}












// ======================================
// LÖSCHEN
// ======================================


window.removeReferee =
async function(id){



if(
!confirm(
"JSR wirklich löschen?"
)
)
return;





await deleteDoc(

doc(

db,

"referees",

id

)

);




loadReferees();


};












// ======================================
// BEARBEITEN
// ======================================


window.editReferee =
async function(id){



const status =
prompt(

"Neuer Status:",

"Aktiv"

);




if(!status)
return;




await updateDoc(

doc(

db,

"referees",

id

),


{


status:status


}


);





loadReferees();


};












// ======================================
// DIGITALER PASS
// ======================================


window.createPass =
function(id){



alert(

"Digitaler Jungschiedsrichter-Ausweis\n\nID: "
+
id

);



};