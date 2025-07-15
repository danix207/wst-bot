require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

// ✔️ Initialisation correcte de Twilio (plus d'erreur de "username")
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const personaMap = {}; // Mémoire pour chaque utilisateur

app.post('/incoming', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim();

  // 🟢 Si c'est un nouvel utilisateur : demande le prénom
  if (!personaMap[userNumber]) {
    personaMap[userNumber] = {
      name: userMessage,
      mood: 'curieux' // Tu peux changer l'humeur plus tard
    };

    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userNumber,
      body: `Bienvenue ${userMessage} 👋 ! Pose-moi ta première question, je vais explorer Internet pour toi 📡.`
    });

  } else {
    const { name, mood } = personaMap[userNumber];

    try {
      const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
      const answer = response.data?.Abstract || "Désolé, je n’ai rien trouvé 😅.";

      // 🤖 Réponse personnalisée selon l'humeur
      let reply = '';
      switch (mood) {
        case 'curieux':
          reply = `Alors ${name}, voici ce que j’ai trouvé 📖 : ${answer}`;
          break;
        case 'humoristique':
          reply = `${name}, même mon CPU a rigolé 🤣 : ${answer}`;
          break;
        default:
          reply = `Voici la réponse pour toi, ${name} : ${answer}`;
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
        body: "Oups, j’ai eu un bug en cherchant 🔧. Essaie à nouveau !"
      });
    }
  }

  res.sendStatus(200); // ✔️ Indique à Twilio que tout est OK
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp en ligne sur http://localhost:${PORT}`);
});
