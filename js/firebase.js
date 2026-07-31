// =====================================
// SG MISBURG JSR PORTAL
// FIREBASE VERBINDUNG
// =====================================


// Firebase App

import {
    initializeApp
}
from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";



// Firebase Auth

import {
    getAuth
}
from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";



// Firestore

import {
    getFirestore
}
from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";





// =====================================
// FIREBASE KONFIGURATION
// =====================================


const firebaseConfig = {


    apiKey:
    "AIzaSyC27vfNJL-mxl5wtg69WsWPkaceEP6yUjs",


    authDomain:
    "jsr-1-d3000.firebaseapp.com",


    projectId:
    "jsr-1-d3000",


    storageBucket:
    "jsr-1-d3000.firebasestorage.app",


    messagingSenderId:
    "909465128275",


    appId:
    "1:909465128275:web:7729bcda224ae767ff65a6",


    measurementId:
    "G-1M0XS7JMGW"


};







// =====================================
// FIREBASE STARTEN
// =====================================


const app =
initializeApp(
firebaseConfig
);





// =====================================
// SERVICES EXPORTIEREN
// =====================================


export const auth =
getAuth(
app
);



export const db =
getFirestore(
app
);



export default app;