import {
  onAuthStateChanged,
  getAuth
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  collection as fsCollection
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";

// Configuração do Firebase
const firebaseConfig = {
 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let selectedPlayerUsername = "";
let selectedPlayerId = "";
let selectedLocation = null;
let selectedLocationName = null;

document.addEventListener("DOMContentLoaded", () => {
  const playersList = document.querySelector(".players-list");
  const modal = document.getElementById("inviteModal");
  const inviteTitle = document.querySelector(".invite-title");
  const closeBtn = modal.querySelector(".close-btn");
  const inviteBtn = document.querySelector(".invite-btn");
  const selectedPointDisplay = document.querySelector(".selected-point");

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    selectedLocation = null;
    selectedPointDisplay.textContent = "Ponto Selecionado: Nenhum";
  });

  inviteBtn.addEventListener("click", async () => {
    const date = document.getElementById("date-input").value;
    const time = document.getElementById("time-input").value;

    if (!date || !time) {
      alert("Por favor selecione a data e o horário.");
      return;
    }

    if (!selectedLocation) {
      alert("Por favor selecione um ponto de encontro no mapa.");
      return;
    }

    const formatted = `${time} em ${date.split("-").reverse().join("/")}`;
    const dataJogoISO = `${date}T${time}`;

    try {
      if (!selectedPlayerId) {
        alert("Jogador de destino não encontrado.");
        return;
      }

      const currentUser = auth.currentUser;
      const arbitroId = "T2F4UUquMhaH44xkYz9Z51zBAAB2";

      const notificacaoJogador = {
        mensagem: `Você foi convidado para um encontro em ${formatted}.`,
        data: new Date().toISOString(),
        status: "não lida",
        tipo: "convite",
        arbitroId,
        jogador1: currentUser.uid,
        jogador1Username: currentUser.displayName || "Jogador",
        jogador2: selectedPlayerId,
        jogador2Username: selectedPlayerUsername,
        dataJogo: dataJogoISO,
        localizacao: selectedLocation,
        nomeDoLocal: selectedLocationName
      };

      const notificacaoArbitro = {
        mensagem: `Novo jogo agendado: ${currentUser.displayName || "Um jogador"} vs @${selectedPlayerUsername} em ${formatted}`,
        data: new Date().toISOString(),
        status: "pendente",
        tipo: "convite_arbitro",
        jogador1: currentUser.uid,
        jogador1Username: currentUser.displayName || "Jogador",
        jogador2: selectedPlayerId,
        jogador2Username: selectedPlayerUsername,
        dataJogo: dataJogoISO,
        localizacao: selectedLocation,
        nomeDoLocal: selectedLocationName
      };

      await addDoc(fsCollection(db, "users", selectedPlayerId, "notificacoes"), notificacaoJogador);
      await addDoc(fsCollection(db, "users", arbitroId, "notificacoes"), notificacaoArbitro);

      alert(`Convite enviado para @${selectedPlayerUsername}`);
      modal.classList.add("hidden");
      selectedLocation = null;
      selectedPointDisplay.textContent = "Ponto Selecionado: Nenhum";

    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      alert("Erro ao enviar convite. Tente novamente.");
    }
  });

  // Carrega os jogadores com o mesmo rank
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("Usuário não autenticado.");
      return;
    }

    try {
      const uid = user.uid;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.error("Usuário não encontrado no Firestore.");
        return;
      }

      const currentUserData = userSnap.data();
      const currentRank = currentUserData.rankingNome;

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("rankingNome", "==", currentRank));
      const querySnapshot = await getDocs(q);

      playersList.innerHTML = "";
      let count = 0;

      querySnapshot.forEach((docSnap) => {
        const player = docSnap.data();
        if (docSnap.id !== uid) {
          const li = document.createElement("li");
          li.innerHTML = `
            <span>@${player.username || "SemNome"}</span>
            <span>Rank: ${player.rankingNome || "?"}</span>
            <button>Convidar</button>
          `;

          const button = li.querySelector("button");
          button.addEventListener("click", async () => {
            selectedPlayerUsername = player.username || "SemNome";
            selectedPlayerId = docSnap.id;
            inviteTitle.innerHTML = `Convite para <strong>@${selectedPlayerUsername}</strong>`;
            modal.classList.remove("hidden");

            // Importa e inicializa o mapa no modal
            const { initMap } = await import('./map.js');
            initMap("modal-map");
          });

          playersList.appendChild(li);
          count++;
        }
      });

      if (count === 0) {
        playersList.innerHTML = "<li>Nenhum jogador com o mesmo rank encontrado.</li>";
      }

    } catch (error) {
      console.error("Erro ao carregar jogadores:", error);
    }
  });

  // Captura o evento de seleção do local vindo do map.js
  window.addEventListener("localSelecionado", (e) => {
    selectedLocation = {
      latitude: e.detail.latitude,
      longitude: e.detail.longitude
    };
    selectedLocationName = e.detail.nome;
    document.querySelector(".selected-point").textContent =
      `Ponto Selecionado: ${e.detail.nome || "Lat " + e.detail.latitude.toFixed(5) + ", Lng " + e.detail.longitude.toFixed(5)}`;
  });
});
