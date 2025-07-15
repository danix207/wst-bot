require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const personaMap = {};

app.post('/incoming', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim();

  // Si l'utilisateur est nouveau, on lui demande son nom
  if (!personaMap[userNumber]) {
    personaMap[userNumber] = {
      name: userMessage,
      mood: 'curieux'
    };

    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userNumber,
      body: `Salut ${userMessage} 👋 ! Enchanté. Pose-moi ta première question et je vais chercher la réponse pour toi.`
    });
  } else {
    const { name, mood } = personaMap[userNumber];

    try {
      const search = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
      const snippet = search.data?.Abstract || "Désolé, aucune réponse n'a été trouvée 😕.";

      let reply = '';
      switch (mood) {
        case 'curieux':
          reply = `Alors ${name}, voici ce que j’ai trouvé 📚 : ${snippet}`;
          break;
        case 'humoristique':
          reply = `${name}, même mon processeur rigole 😂 : ${snippet}`;
          break;
        default:
          reply = `Voilà la réponse pour toi, ${name} : ${snippet}`;
      }

      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: userNumber,
        body: reply
      });
    } catch (err) {
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: userNumber,
        body: "Oups, j’ai eu un petit bug en cherchant ta réponse 😅. Essaie encore !"
      });
    }
  }

  // Réponse HTTP pour confirmer à Twilio que tout va bien
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Bot actif sur le port ${PORT}`);
});
