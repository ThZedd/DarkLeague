// searchbar.js
import { db } from './firebase.js';
import {
  collection,
  query,
  orderBy,
  startAt,
  endAt,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const searchInput = document.getElementById("searchBar");
const resultsList = document.getElementById("searchResults");

searchInput.addEventListener("input", async (e) => {
  const searchValue = e.target.value.trim().toLowerCase(); // 🔴 transforma em minúsculas
  resultsList.innerHTML = "";

  if (searchValue.length === 0) return;

  try {
    const cartasRef = collection(db, "cartas");

    // 🔄 Query com base no campo nomeLowerCase
    const q = query(
      cartasRef,
      orderBy("nomeLowerCase"),
      startAt(searchValue),
      endAt(searchValue + '\uf8ff')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      resultsList.innerHTML = `<li>Nenhuma carta encontrada.</li>`;
      return;
    }

    querySnapshot.forEach((doc) => {
      const carta = doc.data();
      const li = document.createElement("li");
      li.classList.add("search-result-item");

      const img = document.createElement("img");
      img.src = carta.imagem || "imagens/placeholder.png";
      img.alt = carta.nome;
      img.classList.add("search-result-img");

      const span = document.createElement("span");
      span.textContent = carta.nome;

      li.appendChild(img);
      li.appendChild(span);

      li.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Abrindo carta em nova aba:", doc.id);
        window.open(`CardsDetail.html?id=${doc.id}`, '_blank');
      });

      resultsList.appendChild(li);
    });
  } catch (error) {
    console.error("Erro ao buscar cartas:", error);
  }
});
