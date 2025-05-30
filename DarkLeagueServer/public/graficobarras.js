import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function carregarGraficoRaridade() {
  try {
    const cartasSnapshot = await getDocs(collection(db, "cartas"));

    const contagemPorRaridade = {};

    cartasSnapshot.forEach(doc => {
      const data = doc.data();
      const raridade = data.raridade || "Desconhecida";
      contagemPorRaridade[raridade] = (contagemPorRaridade[raridade] || 0) + 1;
    });

    const raridades = Object.keys(contagemPorRaridade);
    const quantidades = Object.values(contagemPorRaridade);

    const cores = {
      "comum": "#d4d4d4",
      "rara": "#60a5fa",
      "ultra-rara": "#f472b6",
      "lendária": "#facc15",
      "Desconhecida": "#9ca3af"
    };
    const backgroundColors = raridades.map(r => cores[r] || "#f87171");

    const ctx = document.getElementById('graficoRaridade').getContext('2d');

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: raridades,
        datasets: [{
          label: 'Quantidade de Cartas por Raridade',
          data: quantidades,
          backgroundColor: backgroundColors,
          borderColor: '#333',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: '#333' },
            grid: { color: '#ccc' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#333' },
            grid: { color: '#ccc' }
          }
        }
      }
    });

  } catch (error) {
    console.error("Erro ao carregar gráfico de raridade:", error);
  }
}

document.addEventListener("DOMContentLoaded", carregarGraficoRaridade);
