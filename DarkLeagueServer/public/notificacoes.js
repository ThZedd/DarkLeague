import { auth, db, onAuthStateChanged } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  doc,
  where,
  addDoc,
  increment,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const container = document.getElementById("notificationsContainer");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    container.innerHTML = "<p style='color:orange;'>Você precisa estar logado para ver suas notificações.</p>";
    return;
  }

  try {
    const notificacoesRef = collection(db, "users", user.uid, "notificacoes");
    const snapshot = await getDocs(notificacoesRef);

    if (snapshot.empty) {
      container.innerHTML = "<p style='color:#aaa; padding-left: 20px;'>Você não possui notificações.</p>";
      return;
    }

    const notificacoes = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notificacoes.push({ ...data, id: docSnap.id });
    });

   const notificacoesFiltradas = notificacoes.filter((n) => n.id !== "default");

    notificacoesFiltradas.forEach((notif) => {
      const notifElement = document.createElement("div");
      notifElement.className = `notification-item ${
        notif.status === "aceite" ||
        notif.status === "rejeitado" ||
        notif.status === "concluído" ? "read" : "unread"
      }`;

      if (notif.resultado) {
        notifElement.setAttribute("data-resultado", notif.resultado.includes("venceu") ? "vitoria" : "derrota");
      }

      if (notif.tipo) {
        notifElement.setAttribute("data-type", notif.tipo);
      }

      let actionsHTML = "";

      if (notif.tipo === "convite" && notif.status === "não lida") {
        actionsHTML = `
          <button class="btn-aceitar">Aceitar</button>
          <button class="btn-recusar">Recusar</button>
        `;
      } else if (notif.tipo === "convite_arbitro" && notif.status === "pendente") {
        actionsHTML = `
          <div class="arbitro-actions">
            <span>Definir vencedor:</span>
            <select class="vencedor-select">
              <option value="">Selecione...</option>
              <option value="${notif.jogador1}">${notif.jogador1Username}</option>
              <option value="${notif.jogador2}">${notif.jogador2Username}</option>
            </select>
            <button class="btn-confirmar">Confirmar</button>
          </div>
        `;
      } else if (notif.tipo === "convite" || notif.tipo === "convite_arbitro" || notif.resultado) {
        const statusText = notif.resultado
          ? notif.resultado
          : notif.status
            ? `Status: ${notif.status}`
            : "";
        actionsHTML = statusText ? `<div class="notification-status">${statusText}</div>` : "";
      }

      notifElement.innerHTML = `
        <div class="notification-msg">${notif.mensagem}</div>
        <div class="notification-date">${formatarData(notif.data)}</div>
        <div class="notification-actions">${actionsHTML}</div>
      `;

      // Aceita o convite
      const btnAceitar = notifElement.querySelector(".btn-aceitar");
      if (btnAceitar) {
        btnAceitar.addEventListener("click", async () => {
          await atualizarStatusNotificacao(user.uid, notif.id, "aceite");
          updateNotificationUI(notifElement, "Aceite");
        });
      }

      // Recusar convite, notificar o adversário e o árbitro
      const btnRecusar = notifElement.querySelector(".btn-recusar");
      if (btnRecusar) {
        btnRecusar.addEventListener("click", async () => {
          await atualizarStatusNotificacao(user.uid, notif.id, "rejeitado");
          updateNotificationUI(notifElement, "Rejeitado");

          if (notif.tipo === "convite" && notif.jogador1 && notif.jogador2) {
            const dataFormatada = formatarData(notif.data);

            const remetenteId = notif.jogador1 === user.uid ? notif.jogador2 : notif.jogador1;
            const remetenteUsername = notif.jogador1 === user.uid ? notif.jogador2Username : notif.jogador1Username;
            const recusarUsername = notif.jogador1 === user.uid ? notif.jogador1Username : notif.jogador2Username;

            // Notifica o adversário
            await addDoc(collection(db, "users", remetenteId, "notificacoes"), {
              mensagem: `@${recusarUsername} recusou o seu convite para a partida agendada em ${dataFormatada}.`,
              data: new Date().toISOString(),
              status: "não lida",
              tipo: "info"
            });

           
            // Atualiza os status da notificação do árbitro (se houver)
            if (notif.arbitroId && notif.dataJogo) {
              const arbitroNotifQuery = query(
                collection(db, "users", notif.arbitroId, "notificacoes"),
                where("tipo", "==", "convite_arbitro"),
                where("dataJogo", "==", notif.dataJogo),
                where("jogador1", "==", notif.jogador1),
                where("jogador2", "==", notif.jogador2)
              );

              const arbitroSnapshot = await getDocs(arbitroNotifQuery);
              arbitroSnapshot.forEach(async (docSnap) => {
                await updateDoc(docSnap.ref, {
                  status: "cancelado"
                });
              });
            }

          }
        });
      }

      // Confirmação do arbitro
      const btnConfirmar = notifElement.querySelector(".btn-confirmar");
      if (btnConfirmar) {
        btnConfirmar.addEventListener("click", async () => {
          const select = notifElement.querySelector(".vencedor-select");
          const vencedorId = select.value;

          if (!vencedorId) {
            alert("Selecione um vencedor");
            return;
          }

          const vencedorUsername = vencedorId === notif.jogador1
            ? notif.jogador1Username
            : notif.jogador2Username;

          await atualizarStatusNotificacao(user.uid, notif.id, "concluído");
          await processarResultadoPartida(notif, vencedorUsername);
          updateNotificationUI(notifElement, `Vencedor: ${vencedorUsername}`);
        });
      }

      container.appendChild(notifElement);
    });

  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    container.innerHTML = "<p style='color:red;'>Erro ao carregar notificações.</p>";
  }
});

async function processarResultadoPartida(notif, vencedorUsername) {
  const jogador1Venceu = vencedorUsername === notif.jogador1Username;
  const perdedorUsername = jogador1Venceu ? notif.jogador2Username : notif.jogador1Username;
  const perdedorId = jogador1Venceu ? notif.jogador2 : notif.jogador1;
  const vencedorId = jogador1Venceu ? notif.jogador1 : notif.jogador2;

  await atualizarNotificacoesJogadores(notif, vencedorUsername, perdedorUsername);
  await atualizarPontuacaoRanking(vencedorId, perdedorId);
  await enviarNotificacoesResultado(
    notif.jogador1,
    notif.jogador1Username,
    notif.jogador2,
    notif.jogador2Username,
    vencedorUsername
  );
}

async function atualizarNotificacoesJogadores(notif, vencedorUsername, perdedorUsername) {
  const jogador1NotifQuery = query(
    collection(db, "users", notif.jogador1, "notificacoes"),
    where("tipo", "==", "convite"),
    where("dataJogo", "==", notif.dataJogo)
  );

  const jogador1Snapshot = await getDocs(jogador1NotifQuery);
  jogador1Snapshot.forEach(async (doc) => {
    await updateDoc(doc.ref, {
      status: "concluído",
      resultado: vencedorUsername === notif.jogador1Username
        ? "Você venceu! (+20 pontos)"
        : "Você perdeu (-20 pontos)"
    });
  });

  const jogador2NotifQuery = query(
    collection(db, "users", notif.jogador2, "notificacoes"),
    where("tipo", "==", "convite"),
    where("dataJogo", "==", notif.dataJogo)
  );

  const jogador2Snapshot = await getDocs(jogador2NotifQuery);
  jogador2Snapshot.forEach(async (doc) => {
    await updateDoc(doc.ref, {
      status: "concluído",
      resultado: vencedorUsername === notif.jogador2Username
        ? "Você venceu! (+20 pontos)"
        : "Você perdeu (-20 pontos)"
    });
  });
}

async function atualizarPontuacaoRanking(vencedorId, perdedorId) {
  const pontos = 20;

  try {
    const vencedorRef = doc(db, "users", vencedorId);
    await updateDoc(vencedorRef, {
      rankingNum: increment(pontos)
    });

    const perdedorRef = doc(db, "users", perdedorId);
    const perdedorSnap = await getDoc(perdedorRef);
    const currentPoints = perdedorSnap.data().rankingNum || 0;
    const newPoints = Math.max(0, currentPoints - pontos);

    await updateDoc(perdedorRef, {
      rankingNum: newPoints
    });

  } catch (error) {
    console.error("Erro ao atualizar pontuação:", error);
  }
}

async function enviarNotificacoesResultado(jogador1Id, jogador1Username, jogador2Id, jogador2Username, vencedorUsername) {
  const vencedorId = vencedorUsername === jogador1Username ? jogador1Id : jogador2Id;
  await enviarNotificacaoResultado(
    vencedorId,
    `Parabéns! Você venceu a partida e ganhou 20 pontos no ranking!`,
    vencedorUsername
  );

  const perdedorId = vencedorUsername === jogador1Username ? jogador2Id : jogador1Id;
  const perdedorUsername = vencedorUsername === jogador1Username ? jogador2Username : jogador1Username;
  await enviarNotificacaoResultado(
    perdedorId,
    `Você perdeu a partida para ${vencedorUsername} e perdeu 20 pontos no ranking.`,
    vencedorUsername
  );
}

async function enviarNotificacaoResultado(userId, mensagem, vencedorUsername) {
  const notificacaoResultado = {
    mensagem: mensagem,
    data: new Date().toISOString(),
    status: "não lida",
    tipo: "resultado_partida",
    vencedor: vencedorUsername
  };

  try {
    await addDoc(collection(db, "users", userId, "notificacoes"), notificacaoResultado);
  } catch (error) {
    console.error("Erro ao enviar notificação de resultado:", error);
  }
}

async function atualizarStatusNotificacao(userId, notificacaoId, novoStatus) {
  const notifDoc = doc(db, "users", userId, "notificacoes", notificacaoId);
  await updateDoc(notifDoc, { status: novoStatus });
}

function updateNotificationUI(element, statusText) {
  element.querySelector(".notification-actions").innerHTML = `
    <div class="notification-status">${statusText}</div>
  `;
  element.classList.remove("unread");
  element.classList.add("read");
}

function formatarData(dataISO) {
  if (!dataISO) return "";
  const data = new Date(dataISO);
  return `${data.toLocaleDateString()} às ${data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
