const { db } = require('../FirebaseAdmin')

/* A funcao para salvar mensagens do Firestore */

const saveMessage = async (userId, message) => {
    try {
        await db.collection('conversations').add({
            userId,
            message,
            timestamp: new Date(),
        });
        console.log('Message saved successfully')
    }
    catch (error) {
        console.log('Error saving message', error)
    }
}

/* Funcao para buscar mensagens do Firestore */
const fetchMessages = async (userId) => {
    const q = db.collection('conversations').where('userId', '==', userId);

    try {
        const querySnapshot = await q.get()
        const messages  = querySnapshot.docs.map(doc => doc.data());
        return messages;
    } catch (error) {
        console.log('Error fetching messages', error)
        return [];
    }
};

module.exports = { saveMessage, fetchMessages };