import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


async function carregarCartas() {
    try {
        const querySnapshot = await getDocs(collection(db, "cartas"));
        const containers = document.querySelectorAll('.displaycard.cards');

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.imagem) {
                // Cria a imagem base
                const imgBase = document.createElement('img');
                imgBase.src = data.imagem;
                imgBase.className = 'card';
                imgBase.alt = doc.id;
                imgBase.style.cursor = 'pointer'; // Adiciona cursor pointer para indicar que é clicável
                imgBase.title = 'Clique para abrir a carta em uma nova aba'; // Tooltip

                // Para cada container, clona a imagem e adiciona o evento no clone
                containers.forEach(container => {
                    const imgClone = imgBase.cloneNode(true);
                    imgClone.addEventListener('click', (e) => {
                        e.preventDefault(); // Previne comportamento padrão
                        console.log("Abrindo carta em nova aba:", doc.id);
                        window.open(`CardsDetail.html?id=${doc.id}`, '_blank');
                    });
                    container.appendChild(imgClone);
                });
            }
        });
    } catch (error) {
        console.error("Erro ao carregar cartas do Firestore:", error);
        // Adicione aqui algum feedback visual para o usuário em caso de erro
    }
}

document.addEventListener('DOMContentLoaded', carregarCartas);


async function carregarCartasHot() {
    try {
        // Obter cartas e usuários
        const [cartasSnapshot, usersSnapshot] = await Promise.all([
            getDocs(collection(db, "cartas")),
            getDocs(collection(db, "users"))
        ]);

        const containers = document.querySelectorAll('.displaycard.cards.Hot');
        const favoritosCount = {};

        // Contar favoritos
        const promises = [];
        usersSnapshot.forEach(userDoc => {
            const favoritosRef = collection(db, "users", userDoc.id, "favoritos");
            promises.push(getDocs(favoritosRef).then(favoritosSnapshot => {
                favoritosSnapshot.forEach(favDoc => {
                    favoritosCount[favDoc.id] = (favoritosCount[favDoc.id] || 0) + 1;
                });
            }));
        });
        await Promise.all(promises);

        // Processar cartas
        const cartasArray = [];
        cartasSnapshot.forEach(doc => {
            if (doc.data().imagem) {
                cartasArray.push({
                    id: doc.id,
                    data: doc.data(),
                    favoritos: favoritosCount[doc.id] || 0
                });
            }
        });

        // Ordenar por favoritos
        cartasArray.sort((a, b) => b.favoritos - a.favoritos);

        // Limpar containers (manter título)
        containers.forEach(container => {
            const children = Array.from(container.children);
            children.forEach(child => {
                if (child.tagName !== 'P') container.removeChild(child);
            });
        });

        // Adicionar cartas
        containers.forEach(container => {
            cartasArray.forEach(carta => {
                const img = document.createElement('img');
                img.src = carta.data.imagem;
                img.className = 'card';
                img.alt = carta.id;
                img.style.cursor = 'pointer';
                
                // Evento de clique direto (sem clone)
                img.onclick = () => window.open(`CardsDetail.html?id=${carta.id}`, '_blank');
                
                container.appendChild(img);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar cartas:", error);
        const errorMsg = document.createElement('div');
        errorMsg.textContent = 'Erro ao carregar cartas. Recarregue a página.';
        errorMsg.style.color = 'red';
        errorMsg.style.padding = '20px';
        errorMsg.style.textAlign = 'center';
        
        document.querySelectorAll('.displaycard.cards.Hot').forEach(container => {
            container.appendChild(errorMsg.cloneNode(true));
        });
    }
}

// Carregar quando o DOM estiver pronto
if (document.readyState !== 'loading') {
    carregarCartasHot();
} else {
    document.addEventListener('DOMContentLoaded', carregarCartasHot);
}