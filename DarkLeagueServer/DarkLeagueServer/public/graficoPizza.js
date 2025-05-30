import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function gerarGraficoPizza() {
  try {
    const cartasRef = collection(db, "cartas");
    const snapshot = await getDocs(cartasRef);
    
    const tiposContagem = {};
    let totalCartas = 0;
    
   
    snapshot.forEach(doc => {
      const tipo = doc.data().tipo || "Desconhecido";
      tiposContagem[tipo] = (tiposContagem[tipo] || 0) + 1;
      totalCartas++;
    });

    // Ordena por quantidade (do maior para o menor)
    const tiposOrdenados = Object.entries(tiposContagem)
      .sort((a, b) => b[1] - a[1]);
    
    const labels = tiposOrdenados.map(([tipo]) => tipo);
    const values = tiposOrdenados.map(([_, count]) => count);
    const percentages = values.map(count => ((count / totalCartas) * 100).toFixed(1));

    const cores = [
      '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
      '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'
    ];

    const trace = {
      labels,
      values,
      type: 'pie',
      hole: 0.4,
      marker: {
        colors: cores,
        line: {
          color: '#fff',
          width: 1
        }
      },
      textinfo: 'label+percent',
      textposition: 'outside',
      hoverinfo: 'label+value+percent',
      hovertemplate: '<b>%{label}</b><br>Quantidade: %{value}<br>%{percent}<extra></extra>',
      rotation: 30,
      pull: tiposOrdenados.map((_, i) => (i === 0 ? 0.1 : 0)) 
    };

    const layout = {
      title: {
        text: `<b>Distribuição por Tipo (Total: ${totalCartas} cartas)</b>`,
        font: { size: 18 }
      },
      margin: { t: 80, l: 30, r: 30, b: 80 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      showlegend: true,
      legend: {
        orientation: 'h',
        y: -0.2,
        font: { size: 12 }
      },
      annotations: [
        {
          text: 'Tipos de Cartas',
          showarrow: false,
          x: 0.5,
          y: 0.5,
          font: { size: 14 }
        }
      ]
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['toImage', 'sendDataToCloud']
    };

    Plotly.newPlot('graficoPizzaTipos', [trace], layout, config);

  } catch (error) {
    console.error("Erro ao gerar gráfico de pizza:", error);
    document.getElementById('graficoPizzaTipos').innerHTML = 
      '<p class="error">Erro ao carregar os dados. Recarregue a página ou tente novamente mais tarde.</p>';
  }
}

document.addEventListener("DOMContentLoaded", gerarGraficoPizza);