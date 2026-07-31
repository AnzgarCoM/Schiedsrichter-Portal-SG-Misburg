// =====================================
// SG MISBURG JSR PORTAL
// HAUPTSTEUERUNG
// =====================================



import {
    loadReferees
}
from "./referees.js";


import {
    loadGames
}
from "./games.js";


import {
    loadUsers
}
from "./users.js";


import {
    loadAdmin
}
from "./admin.js";


import {
    loadLogs
}
from "./logs.js";




// =====================================
// PORTAL START
// =====================================


window.initPortal = function(){



    startIntro();


    setupNavigation();


    updateDashboard();



};







// =====================================
// INTRO
// =====================================


function startIntro(){


const intro =
document.getElementById(
"intro"
);



const skip =
document.getElementById(
"skipIntro"
);




if(!intro)
return;




function closeIntro(){


intro.style.opacity="0";


setTimeout(()=>{


intro.style.display="none";


},500);


}




setTimeout(
closeIntro,
3000
);




if(skip){


skip.onclick =
()=>{


closeIntro();


};


}



}








// =====================================
// NAVIGATION
// =====================================


function setupNavigation(){



const buttons =
document.querySelectorAll(
"[data-page]"
);




buttons.forEach(
button=>{


button.addEventListener(
"click",
()=>{


openPage(
button.dataset.page
);


});


});


}







window.openPage =
function(page){



document
.querySelectorAll(
".page"
)

.forEach(
section=>{


section.classList.add(
"hidden"
);


});





const target =
document.getElementById(
page
);



if(target){


target.classList.remove(
"hidden"
);


}





const titles = {


home:
"Startseite",


dashboard:
"Dashboard",


referees:
"JSR-Kartei",


games:
"Spiele & Ansetzungen",


users:
"Benutzerverwaltung",


admin:
"Administration"


};





document
.getElementById(
"pageTitle"
)
.innerText =
titles[page] || "Portal";





loadPageData(
page
);



};








// =====================================
// DATEN LADEN
// =====================================


function loadPageData(page){



switch(page){



case "dashboard":

updateDashboard();

break;



case "referees":

loadReferees();

break;



case "games":

loadGames();

break;



case "users":

loadUsers();

break;



case "admin":

loadAdmin();

break;



case "logs":

loadLogs();

break;



}



}









// =====================================
// DASHBOARD
// =====================================


async function updateDashboard(){



const refs =
document.getElementById(
"countRefs"
);


const games =
document.getElementById(
"countGames"
);


const users =
document.getElementById(
"countUsers"
);





if(refs)
refs.innerHTML =
window.refereeCount || 0;



if(games)
games.innerHTML =
window.gameCount || 0;



if(users)
users.innerHTML =
window.userCount || 0;



}






// =====================================
// RECHTE SYSTEM
// =====================================


window.checkAdmin =
function(){


return (

window.currentUser
&&
window.currentUser.role==="Admin"

);


};





window.checkManager =
function(){


return (

window.currentUser
&&

(
window.currentUser.role==="Admin"

||

window.currentUser.role==="Management"

)

);


};









// =====================================
// LOGOUT
// =====================================


window.logoutUser =
function(){



location.reload();



};







// =====================================
// HILFSFUNKTIONEN
// =====================================



window.escapeHTML =
function(text){


return String(text)

.replace(
/[&<>"']/g,

function(match){


return {

"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"

}[match];


});


};






// =====================================
// START
// =====================================


window.addEventListener(

"DOMContentLoaded",

()=>{


if(
window.currentUser
){


initPortal();


}


}

);