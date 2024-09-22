const express = require('express');
const cors = require('cors');
const ImageKit = require('imagekit');
const { saveChatMessage, fetchChatMessages, saveUserChat, fetchUserChats } = require('./Firebase/Utilities/FirebaseUtilities');
const { db } = require('./Firebase/FirebaseAdmin'); // Importando apenas o Firestore

const port = process.env.PORT || 3000;
const app = express();

// Permite o uso de JSON no corpo das requisições
app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL, // Garantindo que a origem seja seu frontend
}));

// Configurando ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
});

// Rota para autenticação da ImageKit
app.get('/api/upload', (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

// Rota para salvar mensagem
app.post('/api/messages', async (req, res) => {
  const { userId, message, role, title } = req.body; // adding role (user/model) and title
  if (!userId || !message) {
    return res.status(400).send('User ID and message are required');
  }
  
  try {
    const chatId = await saveChatMessage(userId, role, message); /* Save the chat message */
    await saveUserChat(userId, chatId, title) /* Save metadata for user chats */
    res.status(200).send('Message and chat metadata saved successfully');
  } catch (error) {
    console.error('Error saving message', error);
    res.status(500).send('Error saving message');
  }
});

// Rota para buscar mensagens do historico
app.get('/api/messages/:userId', async (req, res) => {
  const { userId } = req.params; // Extraindo o userId da URL
  if (!userId) {
    return res.status(400).send('User ID is required');
  }

  try {
    const messages = await fetchChatHistory(userId);
    res.status(200).send(messages);
  } catch (error) {
    console.error('Error fetching messages', error);
    res.status(500).send('Error fetching messages');
  }
});

/* Route to fetch user chats (metadata) */
app.get('/api/userchats/:userId', async (req, res) => {
  const {  userId } = req.params;
  if (!userId) {
    return res.status(400).send('user ID is required')
  }

  try {
    const chats = await fetchUserChats(userId)
    res.status(200).send(chats);
  } catch (error) {
    console.error('Error fetching user chats', error)
    res.status(500).send('Error fetching user chats')
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
