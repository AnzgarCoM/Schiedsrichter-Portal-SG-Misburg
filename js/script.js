// ======================================
// SG MISBURG JSR PORTAL
// HAUPT SCRIPT
// ======================================



import {

loadReferees

}

from

"./referees.js";



import {

loadGames

}

from

"./games.js";



import {

loadUsers

}

from

"./users.js";



import {

loadDashboard

}

from

"./admin.js";







// ======================================
// INTRO
// ======================================


window.addEventListener(

"DOMContentLoaded",

()=>{


const intro =
document.getElementById(
"intro"
);



const skip =
document.getElementById(
"skipIntro"
);



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



skip.onclick =
()=>{


closeIntro();


};





});









// ======================================
// NAVIGATION
// ======================================


document
.querySelectorAll(
"[data-page]"
)

.forEach(

button=>{


button.onclick =
()=>{


showPage(
button.dataset.page
);



};


});









function showPage(page){



document
.querySelectorAll(
".page"
)

.forEach(

p=>{


p.classList.add(
"hidden"
);



});





document
.getElementById(
page
)

.classList.remove(
"hidden"
);






const titles={


home:"Startseite",


dashboard:"Dashboard",


referees:"JSR-Kartei",


games:"Spiele & Ansetzungen",


users:"Benutzerverwaltung",


admin:"Administration"


};





document
.getElementById(
"pageTitle"
)

.innerHTML =
titles[page];






switch(page){



case "referees":

loadReferees();

break;



case "games":

loadGames();

break;



case "users":

loadUsers();

break;



case "dashboard":

loadDashboard();

break;



}



}



window.showPage =
showPage;