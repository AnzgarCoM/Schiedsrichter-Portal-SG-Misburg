// ======================================
// SG MISBURG JSR PORTAL
// LOGIN SYSTEM
// ======================================


import {

auth

}

from "./firebase.js";



import {

signInWithEmailAndPassword,

signOut,

onAuthStateChanged

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";





const loginBtn =
document.getElementById(
"loginBtn"
);




loginBtn.onclick =
async ()=>{


const email =
document
.getElementById("email")
.value;



const password =
document
.getElementById("password")
.value;



const error =
document
.getElementById("loginError");



try{


await signInWithEmailAndPassword(

auth,

email,

password

);



error.innerHTML="";



}

catch(e){


console.log(e);


error.innerHTML =
"❌ Login fehlgeschlagen";


}



};









onAuthStateChanged(

auth,

(user)=>{



const loginPage =
document.getElementById(
"loginPage"
);



const app =
document.getElementById(
"app"
);



if(user){



loginPage.classList.add(
"hidden"
);



app.classList.remove(
"hidden"
);



document
.getElementById(
"username"
)
.innerHTML =
user.email;



}


else{


app.classList.add(
"hidden"
);


loginPage.classList.remove(
"hidden"
);


}



});








document
.getElementById(
"logout"
)
.onclick =
()=>{


signOut(auth);


};