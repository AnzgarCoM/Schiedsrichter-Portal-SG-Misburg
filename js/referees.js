// =====================================
// SG MISBURG JSR PORTAL
// JSR KARTEI
// =====================================


import {

db

}

from "./firebase.js";



import {

collection,
addDoc,
getDocs,
doc,
deleteDoc,
updateDoc,
getDoc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";





// =====================================
// COLLECTION
// =====================================


const refereeCollection =
collection(
db,
"referees"
);








// =====================================
// JSR LADEN
// =====================================


export async function loadReferees(){



const list =
document.getElementById(
"refereeList"
);



if(!list)
return;



list.innerHTML =
`
<div class="loading">
⏳ Lade Jungschiedsrichter...
</div>
`;




try{



const snapshot =
await getDocs(
refereeCollection
);



list.innerHTML="";



let count = 0;




snapshot.forEach(
(item)=>{



count++;



const r =
item.data();



const id =
item.id;



list.innerHTML += `



<div class="ref-card">


<div class="ref-header">


<div class="avatar">

${r.firstname?.charAt(0)}
${r.lastname?.charAt(0)}

</div>


<div>

<h3>

${r.firstname}
${r.lastname}

</h3>


<span class="status ${r.status}">

${r.status}

</span>


</div>


</div>




<div class="ref-info">


<p>
📧 ${r.email}
</p>


<p>
📞 ${r.phone || "-"}
</p>


<p>
🧑‍⚖️ ${r.level}
</p>


<p>
🏠 SG Misburg
</p>


</div>




<div class="actions">


<button 
class="primary"
onclick="createPass('${id}')">

📄 Pass

</button>




<button
onclick="editReferee('${id}')">

✏️ Bearbeiten

</button>



${
window.checkAdmin()

?

`

<button
class="danger"
onclick="removeReferee('${id}')">

🗑 Löschen

</button>

`

:

""

}




</div>


</div>



`;



});





window.refereeCount =
count;



if(window.updateDashboard)

window.updateDashboard();



if(count===0){



list.innerHTML=

`

<div class="empty">

Noch keine Jungschiedsrichter eingetragen.

</div>

`;



}




}

catch(error){


console.error(
"JSR Fehler:",
error
);



list.innerHTML=

`
Fehler beim Laden.
`;



}



}










// =====================================
// JSR ERSTELLEN
// =====================================


export async function createReferee(data){



await addDoc(

refereeCollection,

{


firstname:data.firstname,

lastname:data.lastname,


birthday:data.birthday || "",


email:data.email,


phone:data.phone || "",


club:"SG Misburg",


level:data.level,


allowedClasses:data.allowedClasses || [],


status:"Aktiv",


created:
new Date()


}

);



loadReferees();



}









// =====================================
// JSR LÖSCHEN
// =====================================


window.removeReferee = async function(id){



if(
!confirm(
"Jungschiedsrichter wirklich löschen?"
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











// =====================================
// JSR BEARBEITEN
// =====================================


window.editReferee =
async function(id){



const ref =
doc(
db,
"referees",
id
);



const snap =
await getDoc(
ref
);



const data =
snap.data();




const status =
prompt(
"Neuer Status:",
data.status
);



if(!status)
return;



await updateDoc(

ref,

{


status:status


}

);



loadReferees();



};









// =====================================
// DIGITALER AUSWEIS
// =====================================


window.createPass =
async function(id){



const snap =
await getDoc(

doc(
db,
"referees",
id

)

);



const r =
snap.data();





const pass = `

SG MISBURG

JUNG-SCHIEDSRICHTER PASS


Name:
${r.firstname}
${r.lastname}


Klasse:
${r.level}


Status:
${r.status}


ID:
${id}


`;




alert(pass);



};







// =====================================
// NEUER JSR BUTTON
// =====================================


const newButton =
document.getElementById(
"newRef"
);



if(newButton){



newButton.onclick =
()=>{



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





createReferee({

firstname,
lastname,
email,
level:
"E-Jugend",
phone:""


});



};



}