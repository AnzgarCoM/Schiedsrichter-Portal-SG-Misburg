// ======================================
// SG MISBURG JSR PORTAL
// ADMIN SYSTEM
// ======================================



import {db} from "./firebase.js";



import {

collection,
getDocs

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";








export async function loadDashboard(){



const refs =
await getDocs(
collection(
db,
"referees"
)
);



const games =
await getDocs(
collection(
db,
"games"
)
);



const users =
await getDocs(
collection(
db,
"users"
)
);





document
.getElementById(
"countRefs"
)
.innerHTML =
refs.size;




document
.getElementById(
"countGames"
)
.innerHTML =
games.size;




document
.getElementById(
"countUsers"
)
.innerHTML =
users.size;



}











// Backup


document
.addEventListener(

"DOMContentLoaded",

()=>{


const btn =
document.getElementById(
"backupBtn"
);



if(btn){


btn.onclick =
createBackup;


}



});








async function createBackup(){



const data = {};



const collections=[

"referees",

"games",

"users",

"logs"

];





for(
const name of collections
){



const snap =
await getDocs(

collection(
db,
name
)

);



data[name]=[];




snap.forEach(

doc=>{


data[name].push(

doc.data()

);


});


}







navigator.clipboard.writeText(

JSON.stringify(
data,
null,
2
)

);




alert(
"Backup kopiert"
);



}