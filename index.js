const express = require('express');
const cors = require('cors');
const ImageKit = require('imagekit');
const { saveChatMessage, fetchChatMessages, saveUserChat, fetchUserChats } = require('./Firebase/Utilities/FirebaseUtilities');
const { db } = require('./Firebase/FirebaseAdmin'); // Importando apenas o Firestore
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const port = process.env.PORT || 3000;
const app = express();

// Permite o uso de JSON no corpo das requisições
app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL, // Garantindo que a origem seja seu frontend
  credentials: true, /* kk */
}));

/* Configuration for CLERK environmental variables */
if (!process.env.CLERK_PUBLISHABLE_KEY ) {
  console.error('Missing Clerk API key!')
  process.exit(1);
}

// Configurando ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
});

// Rota para autenticação da ImageKit
app.get('/api/upload', (req, res) => {
  const result = imagekit.getAuthenticationParameters(); /* kk */
  res.send(result);
});

/* app.get('/api/test', ClerkExpressRequireAuth(), (req, res) => {
  const userId = req.auth.userId
  console.log(`User authenticated: ${userId}`)
  console.log("Success") /* kk */
/*   res.send('Success')
}) */ 

/* Route to Add a new chat */
app.post('/api/chats', ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId; 
  const { text } = req.body
  
  try { 
    /* Save the new chat message */
    const role = "user"; /* Assuming the user creating the message */
    const chatId = await saveChatMessage(userId, role, text);

    /* Save chat metadata in userChats */
    const title = text.substring(0, 40); /* Use first 40 characters as the title */
    await saveUserChat(userId, chatId, title);

    res.status(202).send('Chat and metadata saved successfully');
    
  } catch (error) {
    console.error('Error creating chat', error);
    res.status(500).send('Error creating chat');
  }
});

/* Route to save a message */
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

// Route to fetch chat messages by userId
app.get('/api/messages/:userId', async (req, res) => {
  const { userId } = req.params; // Extraindo o userId da URL
  if (!userId) {
    return res.status(400).send('User ID is required');
  }

  try {
    const messages = await fetchChatMessages(userId);
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

app.get("/api/userschats", ClerkExpressRequireAuth(), async (req, res) => {
  const userId = req.auth.userId; /* Get the authenticated user ID from Clerk */
  try {
    /* Fetch user chats Firestore */
    const userChatsDoc = await db.collection('userChats').doc(userId).get()

    if (!userChatsDoc.exists) {
      return res.status(404).send('User chats not found')
    }
    /* Retrieve and send the chats array */
    const userChats = userChatsDoc.data().chats || [];  
    res.status(200).send(userChats[0].chats);
  } catch (error) {
    console.error('Error fetching user chats', error)
    res.status(500).send('Error fetching user chats')
  }
})

app.use((err, req, res, next) => {
  console.error('Error handling request:', err.stack)
  res.status(500).send('Something broke!') 
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
