// ======================================
// SG MISBURG JSR PORTAL
// BENUTZERVERWALTUNG
// ======================================


import {db} from "./firebase.js";


import {

collection,
getDocs,
addDoc,
deleteDoc,
doc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";





const usersCollection =
collection(
db,
"users"
);







export async function loadUsers(){



const list =
document.getElementById(
"userList"
);



if(!list)
return;




list.innerHTML =
"⏳ Lade Benutzer...";




const snapshot =
await getDocs(
usersCollection
);




list.innerHTML="";




snapshot.forEach(

(user)=>{


const u =
user.data();




list.innerHTML += `


<div class="card">


<h3>

${u.name || "Benutzer"}

</h3>



<p>

📧 ${u.email}

</p>



<p>

Rolle:

<b>

${u.role || "Viewer"}

</b>

</p>



<button

onclick="deleteUser('${user.id}')">

Löschen

</button>



</div>



`;


});



}









window.deleteUser =
async function(id){



if(
!confirm(
"Benutzer löschen?"
)

)

return;



await deleteDoc(

doc(

db,

"users",

id

)

);



loadUsers();



};