import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Deine echten Firebase-Daten
const firebaseConfig = {
  apiKey: "AIzaSyC27vfNJL-mxl5wtg69WsWPkaceEP6yUjs",
  authDomain: "jsr-1-d3000.firebaseapp.com",
  projectId: "jsr-1-d3000",
  storageBucket: "jsr-1-d3000.firebasestorage.app",
  messagingSenderId: "909465128275",
  appId: "1:909465128275:web:7729bcda224ae767ff65a6",
  measurementId: "G-1M0XS7JMGW"
};

// Initialisierung
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserData = null;

// --- LOGIN FUNKTION ---
window.login = async () => {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPass").value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        document.getElementById("loginMsg").innerText = "Fehler: Login fehlgeschlagen.";
    }
};

// --- REGISTRIERUNG ---
window.register = async () => {
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPass").value;
    if(!name || !email || !pass) return alert("Bitte alles ausfüllen!");
    
    try {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", res.user.uid), {
            name: name,
            role: "schiri" // Standardmäßig ist jeder neue User ein Schiri (Leserechte)
        });
        alert("Konto erstellt! Du kannst dich jetzt einloggen.");
        location.reload();
    } catch (e) {
        alert("Fehler: " + e.message);
    }
};

// --- AUTH STATUS PRÜFEN ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            currentUserData = userDoc.data();
            showApp();
        }
    } else {
        showLogin();
    }
});

function showApp() {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("content").style.display = "block";
    document.getElementById("userStatus").innerText = `Angemeldet als: ${currentUserData.name} (${currentUserData.role})`;
    
    // Admin-Knöpfe zeigen, wenn Admin
    if (currentUserData.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
    }
}

function showLogin() {
    document.getElementById("authSection").style.display = "block";
    document.getElementById("content").style.display = "none";
}

window.logout = () => signOut(auth);

// UI Wechsel zwischen Login und Reg
window.toggleReg = (show) => {
    document.getElementById("loginBox").style.display = show ? "none" : "block";
    document.getElementById("regBox").style.display = show ? "block" : "none";
};



