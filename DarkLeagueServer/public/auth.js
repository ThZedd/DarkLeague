import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const db = getFirestore(); // inicializa o Firestore

// Verifica se o usuário já está logado
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();

        localStorage.setItem('authToken', await user.getIdToken());
        localStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          ...userData
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
    }

    const profileUsername = document.querySelector('.profile-username');
    const profileName = document.querySelector('.profile-name');

    const localUser = JSON.parse(localStorage.getItem('user'));
    if (profileUsername && profileName && localUser) {
      profileUsername.textContent = '@' + (localUser.username || 'user');
      profileName.textContent = user.email;
    }

    if (window.location.pathname.includes("login.html")) {
      window.location.href = "/index.html";
    }

  } else {
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "/login.html";
    }
  }
});

// DOM carregado
document.addEventListener('DOMContentLoaded', () => {

  // LOGIN
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const loginBtn = document.querySelector('.register-btn');

      loginBtn.disabled = true;
      loginBtn.innerHTML = '<div class="spinner"></div>';

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error("Dados do usuário não encontrados no Firestore.");
        }

        const userData = docSnap.data();

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          ...userData
        }));

        window.location.href = '/index.html';

      } catch (error) {
        console.error('Erro ao logar:', error);

        let errorMessage = 'Erro ao fazer login. Tente novamente.';
        switch (error.code) {
          case 'auth/invalid-email':
            errorMessage = 'Email inválido.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Email ou senha incorretos.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas. Tente mais tarde.';
            break;
          default:
            errorMessage = error.message;
        }

        showError(errorMessage);
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Entrar';
      }
    });
  }

  // LOGOUT
  const logoutLinks = document.querySelectorAll('a[href="#logout"], .logout-btn');

  logoutLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        localStorage.clear();
        window.location.href = '/login.html';
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    });
  });
});

// Exibe erros
function showError(message) {
  let errorElement = document.querySelector('.error-message');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    document.getElementById('loginForm')?.appendChild(errorElement);
  }

  errorElement.textContent = message;
  errorElement.style.color = 'red';
  errorElement.style.marginTop = '10px';
  errorElement.style.textAlign = 'center';
}
