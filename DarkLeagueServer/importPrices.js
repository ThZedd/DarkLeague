const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Referência para o documento da carta
const cardDocRef = db.collection("cartas").doc("Wartortle_SV3PT5_EN_8");

// Dados a inserir
const vendedores = [
  { nome: "CartasForSale" },
  { nome: "BagueteCartas" }  
];

async function importarPrecos() {
  const batch = db.batch();

  vendedores.forEach((item) => {
    const docRef = cardDocRef.collection("vendedores").doc(item.nome);
    batch.set(docRef, {
      nome: item.nome,
    });
  });

  try {
    await batch.commit();
    console.log("Todos os dados foram importados com sucesso!");
  } catch (error) {
    console.error("Erro ao importar dados:", error);
  }
}

importarPrecos();
