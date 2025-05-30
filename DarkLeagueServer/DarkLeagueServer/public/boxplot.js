import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function gerarBoxplotPrecos() {
  try {
    const cartasRef = collection(db, "cartas");
    const snapshot = await getDocs(cartasRef);

    const precosPorRaridade = {};
    const colors = ['#3D9970', '#FF851B', '#FF4136', '#85144b', '#7FDBFF'];

    snapshot.forEach(doc => {
      const data = doc.data();
      const raridade = data.raridade || "Desconhecida";
      const preco = parseFloat(data.precoAtual);

      if (!isNaN(preco)) {
        if (!precosPorRaridade[raridade]) {
          precosPorRaridade[raridade] = [];
        }
        precosPorRaridade[raridade].push(preco);
      }
    });

    // Ordena as raridades por mediana
    const raridadesOrdenadas = Object.keys(precosPorRaridade).sort((a, b) => {
      return median(precosPorRaridade[b]) - median(precosPorRaridade[a]);
    });

    const traces = raridadesOrdenadas.map((raridade, i) => ({
      y: precosPorRaridade[raridade],
      name: raridade,
      type: 'box',
      boxpoints: 'outliers',
      marker: {
        color: colors[i % colors.length],
        size: 4
      },
      line: {
        width: 1.5,
        color: colors[i % colors.length]
      }
    }));

    const layout = {
      title: {
        text: '<b>Distribuição de Preços por Raridade</b>',
        font: { size: 18 }
      },
      yaxis: {
        title: { text: '<b>Preço (€)</b>' },
        gridcolor: '#f0f0f0',
        zeroline: false
      },
      xaxis: {
        gridcolor: '#f0f0f0'
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 60, l: 60, r: 30, b: 60 },
      hovermode: 'closest'
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['toImage', 'sendDataToCloud']
    };

    Plotly.newPlot('boxplotPrecos', traces, layout, config);

  } catch (error) {
    console.error("Erro ao gerar boxplot:", error);
    document.getElementById('boxplotPrecos').innerHTML = 
      '<p class="error">Erro ao carregar os dados. Recarregue a página ou tente novamente mais tarde.</p>';
  }
}

// Função para calcular mediana
function median(values) {
  if (!values.length) return 0;
  values = [...values].sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  return values.length % 2 
    ? values[half] 
    : (values[half - 1] + values[half]) / 2;
}

document.addEventListener("DOMContentLoaded", gerarBoxplotPrecos);