require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

// ✅ INITIALISATION CORRECTE DE TWILIO
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const personaMap = {}; // Mémoire des utilisateurs

app.post('/incoming', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim();

  // 🔰 Première interaction : demander le prénom
  if (!personaMap[userNumber]) {
    personaMap[userNumber] = {
      name: userMessage,
      mood: 'curieux'
    };

    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userNumber,
      body: `Bienvenue ${userMessage} 👋 ! Pose-moi ta première question et je vais chercher pour toi 🔎.`
    });

  } else {
    const { name, mood } = personaMap[userNumber];

    try {
      const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
      const answer = response.data?.Abstract || "Désolé, aucune réponse n'a été trouvée 😅.";

      // 🔆 Personnalité dynamique selon l’humeur
      let reply = '';
      switch (mood) {
        case 'curieux':
          reply = `Alors ${name}, voici ce que j’ai trouvé 📚 : ${answer}`;
          break;
        case 'humoristique':
          reply = `${name}, même mon CPU rigole 😂 : ${answer}`;
          break;
        default:
          reply = `Voilà la réponse pour toi, ${name} : ${answer}`;
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
        body: "Oups, j’ai eu un bug en cherchant 😵. Réessaye dans un instant !"
      });
    }
  }

  res.sendStatus(200); // ✅ Réponse à Twilio pour dire que tout va bien
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp actif sur le port ${PORT}`);
});
