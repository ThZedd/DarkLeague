// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAJz998aXMiiHK_0EklTxt7HUHlaBMdH6Q",
  authDomain: "darkleague-2df7a.firebaseapp.com",
  projectId: "darkleague-2df7a",
  storageBucket: "darkleague-2df7a.appspot.com",
  messagingSenderId: "890671529948",
  appId: "1:890671529948:web:6755f01a9b701e67eed919",
  measurementId: "G-RS16T4VDP9"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { auth, db, onAuthStateChanged, doc, getDoc };

export const registerUser = async (email, password, username, favType,rankingNum,rankingNome) => {
  try {
    const response = await fetch('/Register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, favType, rankingNum, rankingNome })
    });
    return await response.json();
  } catch (error) {
    throw error;
  }
};




