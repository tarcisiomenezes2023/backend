const admin = require('firebase-admin');

// Verifica se já existe uma instância inicializada
if (!admin.apps.length) {
  const serviceAccount = require('../Config/apollodb-1ce91-firebase-adminsdk-6yh4n-32986bf261.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://apollodb-1ce91.firebaseio.com',
  });
}

const db = admin.firestore();

module.exports = { db };