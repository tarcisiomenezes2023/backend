const express = require('express');
const cors = require('cors');
const ImageKit = require('imagekit');
const { saveMessage, fetchMessages } = require('./Firebase/Utilities/FirebaseUtilities');

const port =process.env.PORT || 3000;
const app = express();

/* Permite o uso de JSON no corpo das requisicoes */
app.use(express.json())

app.use(cors({
    origin: process.env.CLIENT_URL,
    
}))

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_ENDPOINT,
})

/* Rota para autenticacao da ImageKit */
app.get('/api/upload', (req, res) => {
    const result = imagekit.getAuthenticationParameters();
    res.send(result);
})

/* Rota para salvar mensagem */
app.post('/api/messages', async (req, res) => {
    try {
        await saveMessage(userId, message);
        res.status(200).send('Message saved Successfully')
    } catch (error) {
        console.error('Error saving messsage', error)
        res.status(500).send('Error saving message')
    }
})

/* Rota para buscar mensagens */
app.get('/api/messages/:userId', async (req, res) => {
    try {
        const messages = await fetchMessages(userId)
        res.status(200).send(messages)
    } catch (error) {
        console.error('Error fetching messages', error)
        res.status(500).send('Error fetching messages')
    }
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})