import { auth } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const username = document.getElementById('register-username').value;
  const favType = document.getElementById('register-favtype').value;
  const rankingNum = 0;
  const rankingNome = "Bronze";
  const registerBtn = document.querySelector('.register-btn');

  // Validação básica
  if (!email || !password || !username || !favType) {
    showError('Preencha todos os campos');
    return;
  }

  registerBtn.disabled = true;
  registerBtn.innerHTML = '<div class="spinner"></div> Registrando...';

  try {
    // 1. Enviar dados para o backend
    const response = await fetch('/Register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username, favType, rankingNum, rankingNome })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erro no servidor');
    }

    // 2. Mostrar mensagem de sucesso
    showSuccess('Registro concluído! Redirecionando para login...');
    
    // 3. Redirecionar para login após 2 segundos
    setTimeout(() => {
      window.location.href = '/Login.html'; // Redireciona para a página de login
    }, 2000);

  } catch (error) {
    console.error('Erro no registro:', error);
    showError(formatErrorMessage(error));
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = 'Registar';
  }
});

// Adicione esta função para mostrar mensagens de sucesso
function showSuccess(message) {
  const successElement = document.createElement('div');
  successElement.className = 'success-message';
  successElement.textContent = message;
  
  const form = document.getElementById('registerForm');
  const existingMsg = form.querySelector('.success-message');
  if (existingMsg) form.removeChild(existingMsg);
  
  form.appendChild(successElement);
  setTimeout(() => successElement.remove(), 2000);
}


