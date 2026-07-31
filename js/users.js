// =====================================
// SG MISBURG JSR PORTAL
// BENUTZERVERWALTUNG
// =====================================


import {

db

}

from "./firebase.js";



import {

collection,
getDocs,
doc,
deleteDoc,
updateDoc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";





const usersCollection =
collection(
db,
"users"
);








// =====================================
// BENUTZER LADEN
// =====================================


export async function loadUsers(){



const list =
document.getElementById(
"userList"
);



if(!list)
return;




list.innerHTML =
"⏳ Lade Benutzer...";




try{


const snapshot =
await getDocs(
usersCollection
);



list.innerHTML="";



let count=0;




snapshot.forEach(
(user)=>{


count++;


const u =
user.data();



const id =
user.id;




list.innerHTML += `


<div class="user-card">



<div class="user-header">


<div class="avatar">

${

u.name ?

u.name.charAt(0)

:

"U"

}

</div>



<div>


<h3>

${u.name || "Unbekannter Benutzer"}

</h3>



<span class="role">

${u.role || "Viewer"}

</span>


</div>


</div>





<div class="user-info">


<p>
📧 ${u.email || "-"}
</p>



<p>
🔐 Rolle:
<b>
${u.role}
</b>
</p>



<p>

Status:

<span class="
${u.active ? "active":"inactive"}
">

${u.active ? "Aktiv":"Gesperrt"}

</span>


</p>


</div>






<div class="actions">


${

window.checkAdmin()

?

`

<button
onclick="changeRole('${id}')">

⚙ Rolle ändern

</button>



<button
class="danger"

onclick="deleteUser('${id}')">

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






window.userCount =
count;



if(window.updateDashboard)

window.updateDashboard();




if(count===0){


list.innerHTML=

`

<div class="empty">

Keine Benutzer vorhanden.

</div>

`;


}




}

catch(error){


console.error(
"Benutzer Fehler:",
error
);



list.innerHTML =
"Fehler beim Laden";


}




}











// =====================================
// ROLLE ÄNDERN
// =====================================


window.changeRole =
async function(id){



if(!window.checkAdmin()){


alert(
"Keine Berechtigung"
);


return;


}





const role =
prompt(

"Neue Rolle:\n\nAdmin\nManagement\nViewer"

);



if(
!role
)
return;




if(
!

[
"Admin",
"Management",
"Viewer"

]
.includes(role)

){


alert(
"Ungültige Rolle"
);


return;


}




await updateDoc(

doc(
db,
"users",
id
),

{


role:role


}

);



loadUsers();



};











// =====================================
// BENUTZER LÖSCHEN
// =====================================


window.deleteUser =
async function(id){



if(!window.checkAdmin()){

return;

}



if(
!confirm(
"Benutzer wirklich löschen?"
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











// =====================================
// BENUTZER STATUS ÄNDERN
// =====================================


window.toggleUserStatus =
async function(id,status){



await updateDoc(

doc(
db,
"users",
id

),

{


active:status


}

);



loadUsers();



};