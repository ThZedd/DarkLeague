import { auth, db, onAuthStateChanged } from "./firebase.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const historySection = document.querySelector(".game-history");

  onAuthStateChanged(auth, async (user) => {
    if (!user || !historySection) return;

    const notificacoesRef = collection(db, "users", user.uid, "notificacoes");
    const q = query(
      notificacoesRef,
      where("tipo", "==", "resultado_partida"),
      where("status", "==", "não lida")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      historySection.innerHTML += `<p style="color:#999;">Ainda não tens jogos concluídos.</p>`;
      return;
    }

    snapshot.forEach((doc) => {
      const notif = doc.data();

      const data = formatarData(notif.dataJogo);
      const local = notif.nomeDoLocal || "Local não especificado";
      const concorrente = user.uid === notif.jogador1
        ? `@${notif.jogador2Username}`
        : `@${notif.jogador1Username}`;
      const categoria = notif.ranking || "N/D";
      const resultadoTexto = notif.resultado || "Resultado indefinido";
      const resultadoClasse = resultadoTexto.includes("venceu")
        ? "victory"
        : resultadoTexto.includes("perdeu")
        ? "defeat"
        : "draw";

      const cardHTML = `
        <div class="game-card">
          <img src="imagens/avatar.png" class="avatar" alt="Avatar">
          <div class="game-info">
            <p><strong>Data:</strong> ${data}</p>
            <p><strong>Local:</strong> ${local}</p>
            <p><strong>Concorrente:</strong> ${concorrente}</p>
            <p><strong>Categoria:</strong> ${categoria}</p>
          </div>
          <span class="game-result ${resultadoClasse}">${resultadoTexto}</span>
        </div>
      `;

      historySection.innerHTML += cardHTML;
    });
  });
});

function formatarData(dataISO) {
  if (!dataISO) return "Data não definida";
  const data = new Date(dataISO);
  const dia = data.toLocaleDateString("pt-PT");
  const hora = data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${hora} de ${dia}`;
}
