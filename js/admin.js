// =====================================
// SG MISBURG JSR PORTAL
// ADMIN BEREICH
// =====================================


import {

db

}

from "./firebase.js";



import {

collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc

}

from

"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";





const todoCollection =
collection(
db,
"todos"
);








// =====================================
// ADMIN LADEN
// =====================================


export async function loadAdmin(){



const box =
document.getElementById(
"admin"
);



if(!box)
return;



if(
!window.checkAdmin()
){



box.innerHTML = `

<div class="empty">

⛔ Keine Berechtigung für diesen Bereich.

</div>

`;

return;


}




box.innerHTML = `


<div class="admin-grid">


<div class="admin-card">


<h2>
📝 Vereins Aufgaben
</h2>


<div id="todoList">

Lade Aufgaben...

</div>


<button
class="primary"
id="addTodo">

+ Aufgabe erstellen

</button>



</div>





<div class="admin-card">


<h2>
💾 Datenverwaltung
</h2>



<button
class="primary"
onclick="createBackup()">

Backup erstellen

</button>



<button
onclick="location.reload()">

System neu laden

</button>



</div>



</div>



`;




loadTodos();



const addButton =
document.getElementById(
"addTodo"
);



if(addButton){



addButton.onclick =
createTodo;



}



}









// =====================================
// TODO LADEN
// =====================================


async function loadTodos(){



const list =
document.getElementById(
"todoList"
);



if(!list)
return;



list.innerHTML =
"";



const snapshot =
await getDocs(
todoCollection
);



if(snapshot.empty){


list.innerHTML =
`

<p>
Keine Aufgaben vorhanden.
</p>

`;

return;


}




snapshot.forEach(
(item)=>{


const todo =
item.data();



list.innerHTML += `


<div class="todo-card">


<h3>

${todo.title}

</h3>



<p>

${todo.description || ""}

</p>



<span>

Status:
${todo.done ? "Erledigt":"Offen"}

</span>



<br>



<button
onclick="finishTodo('${item.id}')">

✔ Erledigt

</button>



<button
class="danger"

onclick="removeTodo('${item.id}')">

🗑 Löschen

</button>


</div>



`;


});



}









// =====================================
// TODO ERSTELLEN
// =====================================


async function createTodo(){



const title =
prompt(
"Aufgabe:"
);



if(!title)
return;



await addDoc(

todoCollection,

{


title:title,


description:"",


done:false,


created:
new Date()


}

);



loadTodos();



}









// =====================================
// TODO ERLEDIGEN
// =====================================


window.finishTodo =
async function(id){



await updateDoc(

doc(
db,
"todos",
id

),

{


done:true


}

);



loadTodos();



};









// =====================================
// TODO LÖSCHEN
// =====================================


window.removeTodo =
async function(id){



if(
!confirm(
"Aufgabe löschen?"
)

)
return;




await deleteDoc(

doc(
db,
"todos",
id

)

);



loadTodos();



};









// =====================================
// BACKUP
// =====================================


window.createBackup =
async function(){



const collections=[

"users",
"referees",
"games",
"todos",
"logs"

];



let backup={};




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



backup[name]=[];



snap.forEach(
doc=>{


backup[name].push(
{

id:doc.id,

...doc.data()

}

);


});


}






const json =
JSON.stringify(
backup,
null,
2
);




navigator
.clipboard
.writeText(
json
);



alert(
"Backup wurde kopiert."
);



};