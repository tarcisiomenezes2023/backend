const { db } = require('../FirebaseAdmin')

/* A funcao para salvar mensagens do Firestore */

const saveChatMessage = async (userId, role, text, img = "") => {
    try {
        await db.collection('conversations').add({
            userId,
            history: {
                role,
                parts: [{ text }],
                img,
            },
            timestamp: new Date(),
        });
        console.log('Message saved successfully')
    }
    catch (error) {
        console.log('Error saving message', error)
    }
}

/* Funcao para buscar mensagens Firestore pelo userId */
const fetchChatMessages = async (userId) => {
    try {
        const querySnapshot = await db.collection('conversations')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'asc')
        .get();

        const messages = querySnapshot.docs.map(doc => doc.data());
        return messages;

    } catch (error) {
        console.log('Error fetching chat history', error)
        return [];
    }
};

const saveUserChat = async (userId, chatId, title) => {
    try {
        await db.collection('userChats').doc(userId).set({
            chats: admin.firestore.FieldValue.arrayUnion({
                _id: chatId,
                title,
                createAt: new Date(),
            }),
        }, { merge: true });
        console.log('User chat saved successfully')
    } catch (error) {
        console.error('Error saving user chat', error)
    }
}

/* Fetch user chats (metadata) */
const fetchUserChats = async (userId)  => {
    try {
        const userChatsDoc = await db.collection('userChats').doc(userId).get()
        if (userChatsDoc.exists) {
            return userChatsDoc.data().chats || [];
        } else {
            console.log('No chats found for this user')
            return [];
        }
    } catch (error) {
        console.error('Error fetching user chat', error)
        return []
    }
}

module.exports = { saveChatMessage, fetchChatMessages, saveUserChat, fetchUserChats };