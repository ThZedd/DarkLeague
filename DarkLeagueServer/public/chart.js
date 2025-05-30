import { db } from './firebase.js';
import { doc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

let priceChart;

async function carregarGrafico() {
  const urlParams = new URLSearchParams(window.location.search);
  const cartaId = urlParams.get('id');

  if (!cartaId) {
    console.error("ID da carta não encontrado na URL.");
    return;
  }

  try {
    const historicoRef = collection(db, "cartas", cartaId, "historicoPreco");
    const snapshot = await getDocs(historicoRef);

    if (snapshot.empty) {
      console.warn("Nenhum histórico de preço encontrado.");
      return;
    }

    const datas = [];
    const precos = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      datas.push(data.data);  
      precos.push(data.preco); 
    });


    const combinados = datas.map((d, i) => ({ data: d, preco: precos[i] }));
    combinados.sort((a, b) => {
      const [d1, m1, y1] = a.data.split('.').map(Number);
      const [d2, m2, y2] = b.data.split('.').map(Number);
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    });

    const datasOrdenadas = combinados.map(e => e.data);
    const precosOrdenados = combinados.map(e => e.preco);


    const precoMedio = calcularPrecoMedio(precosOrdenados); // calcula os precos medios da carta
    const desvioPadrao = calcularDesvioPadrao(precosOrdenados); // calculo do desvio padrao do preco media da carta
    const amplitudeIQ = calcularAmplitudeInterquartil(precosOrdenados); // calculo da amplitude interquartil

    // Criar o gráfico
    if (priceChart) priceChart.destroy();

    const ctx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: datasOrdenadas,
    datasets: [
      {
        label: `Preço Médio (€${precoMedio.toFixed(2)})`,
        data: precosOrdenados,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#fff',
        pointRadius: 4,
      },
      {
        label: `Desvio Padrão (€${(desvioPadrao).toFixed(2)})`,
        data: Array(precosOrdenados.length).fill(desvioPadrao),
        borderColor: '#3b82f6', // azul
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0.4
      },
      {
      label: `Amplitude Interquartil (€${(amplitudeIQ).toFixed(2)})`,
      data: Array(precosOrdenados.length).fill(amplitudeIQ),
      borderColor: '#22c55e', // verde
      borderDash: [5, 5],
      pointRadius: 0,
      fill: false,
      tension: 0.4
  }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#fff' }
      }
    },
    scales: {
      x: {
        ticks: { color: '#ccc' },
        grid: { color: '#333' }
      },
      y: {
        ticks: { color: '#ccc' },
        grid: { color: '#333' }
      }
    }
  }
});


  } catch (error) {
    console.error("Erro ao carregar gráfico de preços:", error);
  }
}

function calcularPrecoMedio(precos) {
  if (precos.length === 0) return 0;

  let soma = 0;
  for (let i = 0; i < precos.length; i++) {
    soma += precos[i];
  }

  return soma / precos.length;
}

function calcularDesvioPadrao(precos) {
  //Média
  let soma = 0;
  for (let i = 0; i < precos.length; i++) {
    soma += precos[i];
  }
  const media = soma / precos.length;

  //Calcular a soma dos quadrados das diferenças
  let somaDiferencasQuadrado = 0;
  for (let i = 0; i < precos.length; i++) {
    const diferenca = precos[i] - media; // (xi - media)
    const quadrado = diferenca * diferenca; // (xi - media)^2
    somaDiferencasQuadrado += quadrado;
  }

  //Dividir pela quantidade e tirar raiz quadrada
  const variancia = somaDiferencasQuadrado / precos.length;
  const desvioPadrao = Math.sqrt(variancia); // aqui utilizei mesmo uma função do java pois calcular a raiz é muito estranho 

  return desvioPadrao;
}


function calcularAmplitudeInterquartil(precos) {
  const ordenados = [...precos].sort((a, b) => a - b);
  const q1 = ordenados[Math.floor((ordenados.length / 4))];
  const q3 = ordenados[Math.floor((ordenados.length * 3) / 4)];
  console.log(ordenados.length)
  console.log(q1)
  console.log(q3)
  return q3 - q1;
}

document.addEventListener("DOMContentLoaded", carregarGrafico);
