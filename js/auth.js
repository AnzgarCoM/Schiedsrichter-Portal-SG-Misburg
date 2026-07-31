// =====================================
// SG MISBURG JSR PORTAL
// AUTHENTICATION
// =====================================


import {
    auth,
    db
}
from "./firebase.js";



import {

signInWithEmailAndPassword,
signOut,
onAuthStateChanged

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";



import {

doc,
getDoc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";






// =====================================
// LOGIN
// =====================================


const loginButton =
document.getElementById(
"loginBtn"
);



if(loginButton){


loginButton.addEventListener(
"click",
loginUser
);


}








async function loginUser(){



const email =
document
.getElementById(
"email"
)
.value
.trim();



const password =
document
.getElementById(
"password"
)
.value;



const error =
document
.getElementById(
"loginError"
);




error.innerHTML =
"";




try{



const result =
await signInWithEmailAndPassword(

auth,

email,

password

);



const user =
result.user;



console.log(
"Login:",
user.email
);



loadUserData(
user.uid
);




}

catch(error){



console.error(error);



error.innerHTML =
"❌ Login fehlgeschlagen";



}



}








// =====================================
// USER DATEN LADEN
// =====================================


async function loadUserData(uid){



try{



const userRef =
doc(
db,
"users",
uid
);



const snapshot =
await getDoc(
userRef
);




if(
snapshot.exists()
){



const data =
snapshot.data();



window.currentUser =
{

uid:uid,

...data

};




startPortal();



}

else{



alert(
"Benutzerprofil wurde nicht gefunden."
);



}



}

catch(error){


console.error(
"User Fehler:",
error
);


}




}








// =====================================
// PORTAL STARTEN
// =====================================


function startPortal(){



document
.getElementById(
"loginPage"
)
.classList.add(
"hidden"
);



document
.getElementById(
"app"
)
.classList.remove(
"hidden"
);





const username =
document.getElementById(
"username"
);



if(username){



username.innerHTML =

`

${currentUser.name}

<br>

<small>
${currentUser.role}
</small>

`;



}




// Script starten

if(window.initPortal){

window.initPortal();

}



}








// =====================================
// LOGIN STATUS BEIM LADEN
// =====================================


onAuthStateChanged(
auth,
(user)=>{


if(user){


loadUserData(
user.uid
);



}


});









// =====================================
// LOGOUT
// =====================================


const logoutButton =
document.getElementById(
"logout"
);



if(logoutButton){


logoutButton.addEventListener(

"click",

async()=>{


await signOut(auth);



window.location.reload();



}


);


}







// =====================================
// RECHTE SYSTEM
// =====================================



window.hasPermission =
function(level){



if(!window.currentUser)

return false;




const role =
window.currentUser.role;




if(role==="Admin")

return true;




if(role==="Management" && level!=="Admin")

return true;




if(role==="Viewer" && level==="View")

return true;




return false;



};