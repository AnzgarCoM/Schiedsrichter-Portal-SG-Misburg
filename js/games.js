// ======================================
// SG MISBURG JSR PORTAL
// SPIELE & ANSETZUNGEN
// ======================================


import {db} from "./firebase.js";



import {

collection,

addDoc,

getDocs,

deleteDoc,

doc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";






const games =
collection(
db,
"games"
);









export async function loadGames(){



const list =
document.getElementById(
"gameList"
);



if(!list)
return;



list.innerHTML =
"⏳ Lade Spiele...";




const snapshot =
await getDocs(
games
);



list.innerHTML="";




snapshot.forEach(

(game)=>{


const g =
game.data();




list.innerHTML += `


<div class="card">


<h3>

${g.name}

</h3>



<p>

📅 ${g.date}

</p>



<p>

🏆 ${g.class}

</p>



<p>

🧑‍⚖️ Schiedsrichter:

${g.referee || "Offen"}

</p>




<button

onclick="deleteGame('${game.id}')">

Löschen

</button>



</div>


`;



});



}












// ======================================
// SPIEL HINZUFÜGEN
// ======================================


document
.addEventListener(

"DOMContentLoaded",

()=>{


const btn =
document.getElementById(
"newGame"
);



if(btn){


btn.onclick =
addGame;


}


});









async function addGame(){



const name =
prompt(
"Spiel / Turnier:"
);



const date =
prompt(
"Datum:"
);



const klasse =
prompt(
"Altersklasse:"
);





if(!name)
return;






await addDoc(

games,

{


name,


date,


class:klasse,


referee:"Offen",


created:
new Date()


}


);




alert(
"Spiel gespeichert"
);



loadGames();


}












// ======================================
// SPIEL LÖSCHEN
// ======================================


window.deleteGame =
async function(id){



if(
!confirm(
"Spiel löschen?"
)

)
return;




await deleteDoc(

doc(

db,

"games",

id

)

);




loadGames();


};