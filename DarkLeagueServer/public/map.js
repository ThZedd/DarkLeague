import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Função para evitar caracteres HTML perigosos ou vazios
function sanitize(text) {
  const div = document.createElement("div");
  div.textContent = text || "Sem nome";
  return div.innerHTML;
}

export async function initMap(targetId = "map") {
  console.log("initMap foi chamada para:", targetId);

  const mapContainer = document.getElementById(targetId);
  if (!mapContainer) {
    console.error(`Elemento com id '${targetId}' não encontrado.`);
    return;
  }

  const center = { lat: 38.7071, lng: -9.1518 };
  const map = new google.maps.Map(mapContainer, {
    center,
    zoom: 12,
  });

  try {
    const locaisRef = collection(db, "locais");
    const snapshot = await getDocs(locaisRef);

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (!data.localizacao || typeof data.localizacao.latitude !== "number" || typeof data.localizacao.longitude !== "number") {
        console.warn("Localização inválida no documento:", doc.id);
        return;
      }

      const pos = {
        lat: data.localizacao.latitude,
        lng: data.localizacao.longitude,
      };

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: sanitize(data.nome),
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 40),
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="color: black; font-weight: bold;">${sanitize(data.nome)}</div>`,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);

        // Envia o local selecionado para quem estiver ouvindo
        const event = new CustomEvent("localSelecionado", {
          detail: {
            nome: data.nome,
            latitude: data.localizacao.latitude,
            longitude: data.localizacao.longitude
          }
        });
        window.dispatchEvent(event);
      });
    });
  } catch (error) {
    console.error("Erro ao carregar locais do Firestore:", error);
  }
}
