import { db } from './firebase.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function gerarTabelaFrequencias() {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    
    const tiposContagem = {};
    let totalFavoritos = 0;
    let usuariosComFavoritos = 0;
    let totalUsuariosAnalisados = 0;
    
    // Processa cada usuário
    for (const userDoc of usersSnapshot.docs) {
      totalUsuariosAnalisados++;
      
      const favoritosRef = collection(db, "users", userDoc.id, "favoritos");
      const favoritosSnapshot = await getDocs(favoritosRef);
      
      // Atualiza contador de usuários com favoritos
      if (!favoritosSnapshot.empty) {
        usuariosComFavoritos++;
      }
      
      // Processa cada carta favorita
      for (const favDoc of favoritosSnapshot.docs) {
        const cartaRef = doc(db, "cartas", favDoc.id);
        const cartaDoc = await getDoc(cartaRef);
        
        if (cartaDoc.exists()) {
          const tipo = cartaDoc.data().tipo || "Desconhecido";
          tiposContagem[tipo] = (tiposContagem[tipo] || 0) + 1;
          totalFavoritos++;
        }
      }

      // Atualiza os contadores em tempo real na interface
      document.getElementById('totalUsuarios').textContent = totalUsuariosAnalisados;
      document.getElementById('totalFavoritos').textContent = totalFavoritos;
    }

    // Atualiza os contadores finais
    document.getElementById('totalUsuarios').textContent = usuariosComFavoritos;
    document.getElementById('totalFavoritos').textContent = totalFavoritos;

    // Ordena por quantidade (do maior para o menor)
    const tiposOrdenados = Object.entries(tiposContagem)
      .sort((a, b) => b[1] - a[1]);
    
    // Preenche a tabela
    const tbody = document.querySelector('#frequencias-tipos tbody');
    tbody.innerHTML = '';

    if (tiposOrdenados.length > 0) {
      tiposOrdenados.forEach(([tipo, quantidade]) => {
        const frequenciaRelativa = ((quantidade / totalFavoritos) * 100).toFixed(2);
        
        const row = document.createElement('tr');
        
        const cellTipo = document.createElement('td');
        cellTipo.textContent = tipo;
        row.appendChild(cellTipo);
        
        const cellAbsoluta = document.createElement('td');
        cellAbsoluta.textContent = quantidade;
        row.appendChild(cellAbsoluta);
        
        const cellRelativa = document.createElement('td');
        cellRelativa.textContent = frequenciaRelativa;
        row.appendChild(cellRelativa);
        
        tbody.appendChild(row);
      });

      // Adiciona linha de total
      const rowTotal = document.createElement('tr');
      rowTotal.style.fontWeight = 'bold';
      rowTotal.style.backgroundColor = '#f8f9fa';
      
      const cellTotalLabel = document.createElement('td');
      cellTotalLabel.textContent = 'TOTAL';
      rowTotal.appendChild(cellTotalLabel);
      
      const cellTotalAbs = document.createElement('td');
      cellTotalAbs.textContent = totalFavoritos;
      rowTotal.appendChild(cellTotalAbs);
      
      const cellTotalRel = document.createElement('td');
      cellTotalRel.textContent = '100.00';
      rowTotal.appendChild(cellTotalRel);
      
      tbody.appendChild(rowTotal);
      adicionarOrdenacao();
    } else {
      tbody.innerHTML = '<tr><td colspan="3">Nenhum favorito encontrado</td></tr>';
    }

  } catch (error) {
    console.error("Erro ao gerar tabela de frequências:", error);
    document.querySelector('#frequencias-tipos tbody').innerHTML = 
      '<tr><td colspan="3" style="color: red;">Erro ao carregar os dados</td></tr>';
  }
}

document.addEventListener("DOMContentLoaded", gerarTabelaFrequencias);

function adicionarOrdenacao() {
  const ths = document.querySelectorAll('#frequencias-tipos th');
  ths.forEach(th => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      const colIndex = th.cellIndex;
      const tbody = document.querySelector('#frequencias-tipos tbody');
      const rows = Array.from(tbody.querySelectorAll('tr:not(:last-child)'));
      
      rows.sort((a, b) => {
        const aVal = a.cells[colIndex].textContent;
        const bVal = b.cells[colIndex].textContent;
        
        if (colIndex === 0) return aVal.localeCompare(bVal);
        return parseFloat(aVal) - parseFloat(bVal);
      });
      
      if (th.classList.contains('asc')) {
        rows.reverse();
        th.classList.remove('asc');
        th.classList.add('desc');
      } else {
        th.classList.remove('desc');
        th.classList.add('asc');
      }
      
      tbody.innerHTML = '';
      rows.forEach(row => tbody.appendChild(row));
      tbody.appendChild(document.querySelector('#frequencias-tipos tr:last-child'));
    });
  });
}