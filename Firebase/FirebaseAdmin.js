const admin = require('firebase-admin');

// Check if Firebase Admin has already been initialized
if (!admin.apps.length) {
  const serviceAccount = require('../Config/apollodb-1ce91-firebase-adminsdk-6yh4n-32986bf261.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // The databaseURL is not required for Firestore, so you can remove it or keep it if needed
  });
}

// Get Firestore instance
const db = admin.firestore();

module.exports = { db };