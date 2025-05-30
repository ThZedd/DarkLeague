import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function gerarHistograma() {
  try {
    const cartasRef = collection(db, "cartas");
    const snapshot = await getDocs(cartasRef);
    
    const precos = [];
    
    snapshot.forEach(doc => {
      const preco = parseFloat(doc.data().precoAtual);
      if (!isNaN(preco)) {
        precos.push(preco);
      }
    });

    // Calcula o número ideal de bins usando a regra de Sturges
    const numBins = Math.ceil(Math.log2(precos.length)) + 1 || 20;
    
    const trace = {
      x: precos,
      type: 'histogram',
      marker: {
        color: '#4CAF50',
        line: {
          color: '#2E7D32',
          width: 1
        }
      },
      opacity: 0.7,
      nbinsx: numBins,
      cumulative: {
        enabled: false
      },
      histnorm: 'probability density'
    };

    const layout = {
      title: {
        text: '<b>Distribuição de Preços das Cartas</b>',
        font: { size: 18 }
      },
      xaxis: {
        title: { text: '<b>Preço (€)</b>' },
        gridcolor: '#f0f0f0'
      },
      yaxis: {
        title: { text: '<b>Frequência Relativa</b>' },
        gridcolor: '#f0f0f0'
      },
      bargap: 0.05,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 60, l: 60, r: 30, b: 60 },
      shapes: [{
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: median(precos),
        y0: 0,
        x1: median(precos),
        y1: 1,
        line: {
          color: '#FF5722',
          width: 2,
          dash: 'dot'
        }
      }],
      annotations: [{
        x: median(precos),
        y: 1,
        xref: 'x',
        yref: 'paper',
        text: `Mediana: €${median(precos).toFixed(2)}`,
        showarrow: true,
        arrowhead: 5,
        ax: 0,
        ay: -40,
        bgcolor: '#FF5722',
        font: { color: 'white' }
      }]
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['toImage', 'sendDataToCloud'],
      displaylogo: false
    };

    Plotly.newPlot('histogramaPrecos', [trace], layout, config);

  } catch (error) {
    console.error("Erro ao gerar histograma:", error);
    document.getElementById('histogramaPrecos').innerHTML = 
      '<p class="error">Erro ao carregar os dados. Recarregue a página ou tente novamente mais tarde.</p>';
  }
}

// Função auxiliar para calcular mediana
function median(values) {
  if (!values.length) return 0;
  values = [...values].sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  return values.length % 2 
    ? values[half] 
    : (values[half - 1] + values[half]) / 2;
}

document.addEventListener("DOMContentLoaded", gerarHistograma);