require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const personaMap = {}; // Mémoire utilisateur

app.post('/incoming', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim();

  // Premier message → récupérer le nom
  if (!personaMap[userNumber]) {
    personaMap[userNumber] = {
      name: userMessage,
      mood: 'curieux'
    };

    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userNumber,
      body: `Salut ${userMessage} 👋 ! Dis-moi ce que tu veux savoir, je vais explorer le web pour toi 🔍.`
    });

  } else {
    const { name, mood } = personaMap[userNumber];

    try {
      const result = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
      const snippet = result.data?.Abstract || "Aucune réponse trouvée 😔.";

      let reply = '';
      switch (mood) {
        case 'curieux':
          reply = `Alors ${name}, voici ce que j’ai trouvé 📖 : ${snippet}`;
          break;
        case 'humoristique':
          reply = `${name}, même mon serveur rigole 😆 : ${snippet}`;
          break;
        default:
          reply = `Voici ta réponse, ${name} : ${snippet}`;
      }

      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: userNumber,
        body: reply
      });

    } catch (error) {
      await client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: userNumber,
        body: "Oups, j’ai eu un souci en cherchant 😵. Essaye encore !"
      });
    }
  }

  res.sendStatus(200); // Twilio attend un status OK
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot actif sur http://localhost:${PORT}`);
});
