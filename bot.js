require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Humeur personnalisée par numéro
const userMoodMap = {};

app.post('/incoming', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim();

  // Humeur par défaut
  if (!userMoodMap[userNumber]) {
    userMoodMap[userNumber] = 'curieux';
  }

  const mood = userMoodMap[userNumber];

  try {
    const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
    const answer = response.data?.Abstract || "Je n’ai rien trouvé pour cette question 😕.";

    let reply = '';
    switch (mood) {
      case 'curieux':
        reply = `📚 Voici ce que j’ai appris pour toi : ${answer}`;
        break;
      case 'humoristique':
        reply = `😂 Même mon serveur a rigolé en lisant ça : ${answer}`;
        break;
      default:
        reply = `✅ Réponse trouvée : ${answer}`;
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
      body: "❌ Une erreur est survenue pendant la recherche. Réessaye un peu plus tard !"
    });
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp prêt sur http://localhost:${PORT}`);
});
