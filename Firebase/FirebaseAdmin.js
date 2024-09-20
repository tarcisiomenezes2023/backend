const admin = require('firebase-admin')

/* Inicialize o Firebase Admin SDK com suas credenciais de servico */
const serviceAccount = require('./path-to-your-serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-id.firebaseio.com' /* Coloque o URL do seu Firestore */
})

const db = admin.firestore()

module.exports = { db }