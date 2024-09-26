const express = require('express');
const cors = require('cors');
const ImageKit = require('imagekit');
const { saveChatMessage, fetchChatMessages, saveUserChat, fetchUserChats } = require('./Firebase/Utilities/FirebaseUtilities');
const { db } = require('./Firebase/FirebaseAdmin'); // Firebase setup
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const port = process.env.PORT || 3000;
const app = express();
require('dotenv').config();

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Configuration for ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
});

app.get('/api/upload', (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.send(result);
});

// Route to add a new chat
app.post('/api/chats', ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { text } = req.body;

  try {
    const role = "user";
    const chatId = await saveChatMessage(userId, role, text);

    const title = text.substring(0, 40);
    await saveUserChat(userId, chatId, title);

    res.status(202).json({ message: 'Chat and metadata saved successfully' });
  } catch (error) {
    console.error('Error creating chat', error);
    res.status(500).send('Error creating chat');
  }
});

// Route to save a message
app.post('/api/messages', async (req, res) => {
  const { userId, message, role, title } = req.body;
  if (!userId || !message) {
    return res.status(400).send('User ID and message are required');
  }

  try {
    const chatId = await saveChatMessage(userId, role, message);
    await saveUserChat(userId, chatId, title);
    res.status(200).json('Message and chat metadata saved successfully');
  } catch (error) {
    console.error('Error saving message', error);
    res.status(500).send('Error saving message');
  }
});

// Route to fetch chat messages by userId
app.get('/api/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).send('User ID is required');
  }

  try {
    const messages = await fetchChatMessages(userId);
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages', error);
    res.status(500).send('Error fetching messages');
  }
});

// Route to fetch user chats (metadata)
app.get('/api/userchats/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).send('User ID is required');
  }

  try {
    const chats = await fetchUserChats(userId);
    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching user chats', error);
    res.status(500).send('Error fetching user chats');
  }
});

app.get("/api/userchats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  try {
    const userChatsDoc = await db.collection('userChats').doc(userId).get();

    if (!userChatsDoc.exists) {
      return res.status(404).send('User chats not found');
    }
    const userChats = userChatsDoc.data().chats || [];
    res.status(200).json(userChats);
  } catch (error) {
    console.error('Error fetching user chats', error);
    res.status(500).send('Error fetching user chats');
  }
});

app.get("/api/chats/:id", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  try {
    const chatDoc = await db.collection('chats').doc(req.params.id).get();
    if (!chatDoc.exists || chatDoc.data().userId !== userId) {
      return res.status(404).send('Chat not found');
    }
    res.status(200).json(chatDoc.data());
  } catch (error) {
    console.error('Error fetching chat', error);
    res.status(500).send('Error fetching chat');
  }
});

// Update chat using Firebase
app.put('/api/chats/:id', ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { question, answer, img } = req.body;

  const newItems = [
    ...(question ? [{ role: "user", parts: [{ text: question }], ...(img && { img }) }] : []),
    { role: "model", parts: [{ text: answer }] },
  ];

  try {
    const chatRef = db.collection('chats').doc(req.params.id);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists || chatDoc.data().userId !== userId) {
      return res.status(404).json({ message: "Chat not found" });
    }

    await chatRef.update({
      history: admin.firestore.FieldValue.arrayUnion(...newItems)
    });

    res.status(200).json('Chat updated successfully');
  } catch (error) {
    console.error('Error updating chat', error);
    res.status(500).send('Error updating chat');
  }
});

app.put('/api/chats/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    const chatRef = db.collection('chats').doc(id);

    const chat = await chatRef.get();
    if (!chat.exists) {
      return res.status(404).json({ message: "Chat not found" });
    }

    await chatRef.update({ text });

    res.status(200).json({ message: "Chat successfully updated" });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ message: "Error updating chat" });
  }
});

app.use((err, req, res, next) => {
  console.error('Error handling request:', err.stack);
  res.status(500).json('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});