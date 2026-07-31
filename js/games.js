// =====================================
// SG MISBURG JSR PORTAL
// SPIELE & ANSETZUNGEN
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
updateDoc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";





const gameCollection =
collection(
db,
"games"
);







// =====================================
// SPIELE LADEN
// =====================================


export async function loadGames(){



const list =
document.getElementById(
"gameList"
);



if(!list)
return;



list.innerHTML =
"⏳ Lade Spiele...";



try{



const snapshot =
await getDocs(
gameCollection
);



list.innerHTML="";



let count = 0;



snapshot.forEach(
(game)=>{


count++;


const g =
game.data();


const id =
game.id;



list.innerHTML += `


<div class="game-card">


<div class="game-header">


<h3>

${g.match}

</h3>


<span class="badge">

${g.age}

</span>


</div>




<p>
📅 ${g.date}
</p>


<p>
⏰ ${g.time}
</p>


<p>
🏟️ ${g.hall || "-"}
</p>




<div class="refs">


<b>
Angesetzte JSR:
</b>


<br>


${

g.referees?.length

?

g.referees.join("<br>")

:

"Keine Ansetzung"

}


</div>




<div class="actions">



<button
class="primary"

onclick="assignReferee('${id}')">

🧑‍⚖️ Ansetzen

</button>





${
window.checkAdmin()

?

`

<button
class="danger"

onclick="deleteGame('${id}')">

🗑 Löschen

</button>

`

:""

}



</div>



</div>


`;



});




window.gameCount =
count;




if(window.updateDashboard)

window.updateDashboard();




if(count===0){



list.innerHTML =
`

<div class="empty">

Keine Spiele vorhanden.

</div>

`;



}



}

catch(error){


console.error(
error
);



list.innerHTML =
"Fehler beim Laden";


}



}









// =====================================
// SPIEL ERSTELLEN
// =====================================


export async function createGame(data){



await addDoc(

gameCollection,

{


match:data.match,


date:data.date,


time:data.time,


hall:data.hall || "",


age:data.age,


referees:[],


created:
new Date()


}

);



loadGames();


}









// =====================================
// SPIEL LÖSCHEN
// =====================================


window.deleteGame =
async function(id){



if(
!confirm(
"Spiel wirklich löschen?"
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











// =====================================
// JSR ANSETZEN
// =====================================


window.assignReferee =
async function(id){



const name =
prompt(
"Name des JSR eintragen:"
);



if(!name)
return;




await updateDoc(

doc(
db,
"games",
id
),


{


referees:[name]


}



);



loadGames();



};











// =====================================
// NEUES SPIEL BUTTON
// =====================================


const button =
document.querySelector(
"#newGame"
);



if(button){



button.onclick =
()=>{



const match =
prompt(
"Begegnung:"
);



const date =
prompt(
"Datum:"
);



const time =
prompt(
"Uhrzeit:"
);



const age =
prompt(
"Altersklasse:"
);




createGame({

match,
date,
time,
age


});



};



}