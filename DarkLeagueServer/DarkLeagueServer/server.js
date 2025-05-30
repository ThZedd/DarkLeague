const express = require('express');
const app = express();
const path = require('path');
const admin = require("firebase-admin");
const credentials = require("./serviceAccountKey.json");
const cors = require('cors');

// Configurações iniciais
app.use(cors({
  origin: 'http://localhost:3000', // Ou seu domínio em produção
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

const db = admin.firestore();
app.use(express.json());

// Middleware de autenticação (para rotas protegidas)
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Endpoint de Registro
app.post('/Register', async (req, res) => {
  try {
    const { email, password, username, favType, rankingNum, rankingNome } = req.body;

    // Criar utilizador no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username
    });

    const uid = userRecord.uid;

    // Criar documento do utilizador
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.set({
      email,
      username,
      favType,
      rankingNum,
      rankingNome,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Criar subcoleções
    await userDocRef.collection('favoritos').doc('default').set({ init: true });
    await userDocRef.collection('binders').doc('default').set({init: true});
    await userDocRef.collection('notificacoes').doc('default').set({init: true});

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de Login
app.post('/Login', async (req, res) => {
  try {
    const { email, password } = req.body; // Adicionei password para validação

    const userRecord = await admin.auth().getUserByEmail(email);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) throw new Error('Dados do usuário não encontrados');

    res.json({
      success: true,
      token: customToken,
      redirectTo: "/DarkLeague.html", // Atualizei para seu arquivo real
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        username: userDoc.data().username,
        tipo_favorito: userDoc.data().tipo_favorito,
        rankingNum: userDoc.data().rankingNum,
        rankingNome:userDoc.data().rankingNome
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(401).json({
      success: false,
      error: "Credenciais inválidas",
      details: error.message
    });
  }
});

// Rotas estáticas
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de páginas
const pages = ['DarkLeague', 'Cards', 'Tournaments', 'Settings', 'Profile', 'Register', 'Login', 'CardsDetail','Statistic', 'Binders', 'Notificacoes'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    if(page == 'DarkLeague'){
      page = 'index'
    }
    res.sendFile(path.join(__dirname, 'public', `${page}.html`));
  });
});

// Rota protegida de exemplo
app.get('/api/user-data', authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000/');
});