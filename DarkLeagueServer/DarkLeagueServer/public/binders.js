import { auth, db, onAuthStateChanged } from './firebase.js';
import { collection, addDoc, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
// === Inicialização ===
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await loadBinders(user.uid);
      await loadFavoritos(user.uid);
      setupCreateBinderButton();
    } else {
      showLoginMessage();
    }
  });
});

// === Carrega e exibe binders com cartas ===
async function loadBinders(uid) {
  const bindersContainer = document.querySelector(".binder-list");
  bindersContainer.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "users", uid, "binders"));

    if (snapshot.empty) {
      showEmptyBindersMessage();
      return;
    }

    let hasNonDefaultBinders = false;

    snapshot.forEach((doc) => {
      if (doc.id === "default" || doc.data().name?.toLowerCase() === "default") return;
      hasNonDefaultBinders = true;

      const binder = doc.data();
      createBinderCard(bindersContainer, doc.id, binder);
    });

    if (!hasNonDefaultBinders) {
      showEmptyBindersMessage();
    }

  } catch (error) {
    console.error("Erro ao carregar binders:", error);
    showErrorMessage();
  }
}

// === Cria o card de um binder com suas cartas ===
function createBinderCard(container, binderId, binderData) {
  const binderCard = document.createElement("div");
  binderCard.className = "displaycard cards Binder";
  binderCard.dataset.binderId = binderId;

  // Título do Binder
  const title = document.createElement("p");
  title.textContent = binderData.name || `Binder ${binderId}`;
  binderCard.appendChild(title);

  if (binderData.cartas && binderData.cartas.length > 0) {
    binderData.cartas.forEach((card, index) => {
      const cardElement = createCardElement(card, index);
      cardElement.addEventListener('click', (e) => {
        e.preventDefault();
        if (card.cartaId) {
          window.open(`CardsDetail.html?id=${card.cartaId}`, '_blank');
        }
      });
      binderCard.appendChild(cardElement); // ✅ Cartas adicionadas diretamente
    });
  } 

  container.appendChild(binderCard); // ✅ Binder adicionado à lista
}

// === Cria elemento de uma carta ===
function createCardElement(card, index) {
  const cardElement = document.createElement("img");
  cardElement.className = "card";
  cardElement.alt = card.nome || `Carta ${index + 1}`;
  cardElement.title = "Clique para abrir a carta em uma nova aba";

  if (card.imagem) {
    cardElement.src = card.imagem;
  } else {
    cardElement.src = "imagens/card-placeholder.png";
  }

  return cardElement;
}

// === Configura o botão de criar binder ===
function setupCreateBinderButton() {
  const createBtn = document.querySelector(".create-binder-button");
  if (!createBtn) return;

  createBtn.addEventListener("click", () => {
    document.getElementById("binderNameInput").value = "";
    document.getElementById("binderModal").classList.remove("hidden");
  });
}

function showLoginMessage() {
  const container = document.querySelector(".binder-list");
  container.innerHTML = `
    <div class="empty-state">
      <p>Faz login para veres os teus binders</p>
    </div>
  `;
}

function showErrorMessage() {
  const container = document.querySelector(".binder-list");
  container.innerHTML = `
    <div class="empty-state error">
      <p>Ocorreu um erro ao carregar os binders</p>
    </div>
  `;
}

// === Funções globais para o modal ===
window.closeModal = function() {
  document.getElementById("binderModal").classList.add("hidden");
};

window.createBinder = async function() {
  const name = document.getElementById("binderNameInput").value.trim();
  const user = auth.currentUser;

  if (!name) {
    alert("Por favor, insere um nome para o binder");
    return;
  }

  if (!user) {
    alert("Precisas de estar autenticado para criar um binder");
    return;
  }

  try {
    await addDoc(collection(db, "users", user.uid, "binders"), {
      name: name,
      cartas: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    closeModal();
    await loadBinders(user.uid);
    alert(`Binder "${name}" criado com sucesso!`);
  } catch (error) {
    console.error("Erro ao criar binder:", error);
    alert("Ocorreu um erro ao criar o binder. Por favor, tenta novamente.");
  }
};



async function loadFavoritos(uid) {
  const favContainer = document.querySelector(".displaycard.cards.Fav");
  // Remove apenas as cartas, mantendo o título <p class="pl">
favContainer.querySelectorAll("img.card").forEach(el => el.remove());


  try {
    const favSnapshot = await getDocs(collection(db, "users", uid, "favoritos"));

    if (favSnapshot.empty) {
      const emptyMsg = document.createElement("p");
      emptyMsg.textContent = "Nenhuma carta favorita encontrada.";
      favContainer.appendChild(emptyMsg);
      return;
    }

    for (const docFav of favSnapshot.docs) {
      const cartaId = docFav.data().cartaId;
      if (!cartaId) continue;

      const cartaRef = doc(db, "cartas", cartaId);
      const cartaDoc = await getDoc(cartaRef);

      if (cartaDoc.exists()) {
        const cartaData = cartaDoc.data();

        const img = document.createElement("img");
        img.src = cartaData.imagem || "imagens/card-placeholder.png";
        img.className = "card";
        img.alt = cartaId;
        img.style.cursor = "pointer";
        img.title = "Clique para abrir a carta em uma nova aba";

        img.addEventListener("click", (e) => {
          e.preventDefault();
          window.open(`CardsDetail.html?id=${cartaId}`, "_blank");
        });

        favContainer.appendChild(img);
      }
    }

  } catch (error) {
    console.error("Erro ao carregar favoritos:", error);
    const errorMsg = document.createElement("p");
    errorMsg.textContent = "Erro ao carregar favoritos.";
    favContainer.appendChild(errorMsg);
  }
}
