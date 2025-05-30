import { db } from './firebase.js';
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function favoritarCarta(uid, cartaId) {
  await addDoc(collection(db, `users/${uid}/favoritos`), {
    carta_id: cartaId,
    data: new Date().toISOString()
  });
}

async function registrarTransacao(uid, tipo, cartaId, preco) {
  await addDoc(collection(db, `usesr/${uid}/transacoes`), {
    tipo: tipo,
    carta_id: cartaId,
    preco: preco,
    data: new Date().toISOString()
  });
}

async function criarBinder(userId, nomeBinder, descricao) {
  const binderRef = doc(collection(db, `users/${uid}/binders`));
  await setDoc(binderRef, {
    nome: nomeBinder,
    descricao: descricao || "",
    createdAt: new Date().toISOString()
  });
  console.log('Binder criado:', binderRef.id);
}

async function adicionarCartaAoBinder(userId, binderId, carta) {
  const cartaRef = doc(collection(db, `users/${uid}/binders/${binderId}/cartas`));
  await setDoc(cartaRef, {
    ...carta,
    dataAdicao: new Date().toISOString()
  });
  console.log('Carta adicionada ao binder:', cartaRef.id);
}
