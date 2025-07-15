require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const personaMap = {}; // Mémoire des utilisateurs

app.post('/incoming', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim();

  // Nouvelle session : demander prénom
  if (!personaMap[userNumber]) {
    personaMap[userNumber] = {
      name: userMessage,
      mood: 'curieux' // Tu peux ajouter d'autres humeurs plus tard
    };

    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userNumber,
      body: `Bienvenue ${userMessage} 👋 ! Dis-moi ce que tu veux savoir, je cherche pour toi 📡.`
    });

  } else {
    const { name, mood } = personaMap[userNumber];

    try {
      const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
      const answer = response.data?.Abstract || "Désolé, aucune réponse trouvée 😢.";

      let reply = '';
      switch (mood) {
        case 'curieux':
          reply = `Alors ${name}, j’ai creusé le web 🌍 pour toi : ${answer}`;
          break;
        case 'humoristique':
          reply = `${name}, même mon processeur a rigolé 🤖😂 : ${answer}`;
          break;
        default:
          reply = `Voici ta réponse ${name} : ${answer}`;
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
        body: "Oups, j’ai eu un bug pendant la recherche 😅. Réessaye !"
      });
    }
  }

  res.sendStatus(200); // Twilio attend une confirmation HTTP
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp lancé sur http://localhost:${PORT}`);
});
