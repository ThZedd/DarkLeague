import { db, auth } from './firebase.js';
import {
    doc, getDoc, setDoc, deleteDoc, updateDoc,
    arrayUnion, increment, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Função para carregar detalhes da carta
async function carregarDetalhesCarta() {
    const urlParams = new URLSearchParams(window.location.search);
    const cartaId = urlParams.get('id');

    if (!cartaId) {
        console.error("ID da carta não fornecido na URL.");
        return;
    }

    try {
        const docRef = doc(db, "cartas", cartaId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            document.querySelector('.title').textContent = data.nome || 'Carta Desconhecida';
            document.querySelector('.card-header h1').textContent = data.nome || 'Carta Desconhecida';
            document.querySelector('.card-header .subtitle').textContent = data.conjunto || '';
            document.querySelector('.card-image-panel img').src = data.imagem || '';

            const dataList = document.querySelector('.card-data-list');
            dataList.innerHTML = `
                <li><strong>Raridade:</strong> ${data.raridade || ''}</li>
                <li><strong>Número:</strong> ${data.numero || ''}</li>
                <li><strong>Conjunto:</strong> ${data.conjunto || ''}</li>
                <li><strong>Espécie:</strong> ${data.especie || ''}</li>
                <li><strong>Itens disponíveis:</strong> ${data.quantidade || ''}</li>
                <li><strong>Preço atual:</strong> ${data.precoAtual || ''} €</li>
                <li><strong>Preço médio (30d):</strong> ${data.preco30d || ''} €</li>
                <li><strong>Preço médio (7d):</strong> ${data.preco7d || ''} €</li>
                <li><strong>Preço médio (1d):</strong> ${data.preco1d || ''} €</li>
            `;

            carregarVendedores(cartaId, data);
        } else {
            console.error("Carta não encontrada.");
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes da carta:", error);
    }
}

// Carrega vendedores da subcoleção
async function carregarVendedores(cartaId, cartaData) {
    const tbody = document.querySelector(".offers-table tbody");
    tbody.innerHTML = "";

    const vendedoresRef = collection(db, `cartas/${cartaId}/vendedores`);
    const snapshot = await getDocs(vendedoresRef);

    snapshot.forEach(docSnap => {
        const vendedor = docSnap.data();
        const vendedorId = docSnap.id;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${vendedor.nome || vendedorId}</td>
            <td>NM</td>
            <td>Best Feed! Fair Grading!</td>
            <td>${cartaData.precoAtual || '0,00'} €</td>
            <td><button class="btn-buy">🛒</button></td>
        `;

        const buyButton = row.querySelector(".btn-buy");
        buyButton.addEventListener("click", async () => {
            onAuthStateChanged(auth, async (user) => {
                if (!user) {
                    alert("Tens de estar autenticado para comprar.");
                    return;
                }

                try {
                    const notificacaoRef = doc(collection(db, `users/${user.uid}/notificacoes`));
                    await setDoc(notificacaoRef, {
                        timestamp: new Date(),
                        mensagem: `Compraste a carta \"${cartaData.nome}\" do vendedor ${vendedor.nome || vendedorId}.`,
                        cartaId: cartaId,
                        vendedorId: vendedorId,
                        lida: false
                    });

                    await deleteDoc(doc(db, `cartas/${cartaId}/vendedores/${vendedorId}`));
                    row.remove();

                    alert("Compra iniciada. Vendedor removido e notificação enviada!");
                } catch (error) {
                    console.error("Erro ao processar compra:", error);
                    alert("Erro ao enviar notificação ou remover vendedor.");
                }
            });
        });

        tbody.appendChild(row);
    });
}

// Função para gerenciar favoritos
function setupFavoritos() {
    const icon = document.querySelector('.favorite-icon');
    const urlParams = new URLSearchParams(window.location.search);
    const cartaId = urlParams.get('id');

    if (!icon || !cartaId) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            icon.title = "Tens de fazer login para usar favoritos";
            return;
        }

        const favRef = doc(db, `users/${user.uid}/favoritos/${cartaId}`);
        const cartaRef = doc(db, "cartas", cartaId);

        const favSnap = await getDoc(favRef);
        if (favSnap.exists()) {
            icon.textContent = 'star';
            icon.setAttribute('data-favorited', 'true');
        }

        icon.addEventListener('click', async () => {
            const isFavorited = icon.getAttribute('data-favorited') === 'true';

            try {
                if (isFavorited) {
                    await deleteDoc(favRef);
                    await updateDoc(cartaRef, {
                        favorito: increment(-1)
                    });
                    icon.textContent = 'star_border';
                    icon.setAttribute('data-favorited', 'false');
                } else {
                    await setDoc(favRef, { cartaId });
                    await updateDoc(cartaRef, {
                        favorito: increment(1)
                    });
                    icon.textContent = 'star';
                    icon.setAttribute('data-favorited', 'true');
                }
            } catch (error) {
                console.error("Erro ao atualizar favorito:", error);
                alert("Erro ao guardar favorito.");
            }
        });
    });
}

// Função para gerenciar binders
function setupBinders() {
    const binderSelect = document.getElementById('binderSelect');
    const addToBinderBtn = document.getElementById('addToBinderBtn');

    if (!binderSelect || !addToBinderBtn) return;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            binderSelect.innerHTML = '<option value="">Faz login para aceder aos teus binders</option>';
            binderSelect.disabled = true;
            addToBinderBtn.disabled = true;
            return;
        }

        try {
            binderSelect.innerHTML = '<option value="">Seleciona um binder</option>';

            const bindersRef = collection(db, `users/${user.uid}/binders`);
            const querySnapshot = await getDocs(bindersRef);

            if (querySnapshot.empty) {
                binderSelect.innerHTML += '<option value="">Não tens binders criados</option>';
                return;
            }

            querySnapshot.forEach((doc) => {
                if (doc.id === "default") return;
                const binderData = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = binderData.name || `Binder ${doc.id}`;
                binderSelect.appendChild(option);
            });

            addToBinderBtn.addEventListener('click', async () => {
                const selectedBinderId = binderSelect.value;
                const selectedBinderName = binderSelect.options[binderSelect.selectedIndex].text;
                const cartaId = new URLSearchParams(window.location.search).get('id');

                if (!selectedBinderId) {
                    alert('Seleciona um binder primeiro');
                    return;
                }

                if (!cartaId) {
                    alert('ID da carta não encontrado');
                    return;
                }

                try {
                    const cartaDoc = await getDoc(doc(db, 'cartas', cartaId));
                    if (!cartaDoc.exists()) {
                        throw new Error('Carta não encontrada');
                    }

                    const cartaData = cartaDoc.data();

                    const binderRef = doc(db, `users/${user.uid}/binders`, selectedBinderId);
                    await updateDoc(binderRef, {
                        cartas: arrayUnion({
                            cartaId: cartaId,
                            binderId: selectedBinderId,
                            binderName: selectedBinderName,
                            ...cartaData
                        })
                    });

                    alert(`Carta adicionada ao binder \"${selectedBinderName}\" com sucesso!`);
                } catch (error) {
                    console.error('Erro ao adicionar carta:', error);
                    alert('Erro ao adicionar carta ao binder');
                }
            });
        } catch (error) {
            console.error('Erro ao carregar binders:', error);
            binderSelect.innerHTML = '<option value="">Erro ao carregar binders</option>';
        }
    });
}

// Inicializa tudo
document.addEventListener('DOMContentLoaded', () => {
    carregarDetalhesCarta();
    setupFavoritos();
    setupBinders();
});