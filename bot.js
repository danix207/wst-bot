require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: false }));

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

const userMoodMap = {};

app.post('/incoming', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim();

  if (!userMoodMap[userNumber]) {
    userMoodMap[userNumber] = 'curieux';
  }

  const mood = userMoodMap[userNumber];

  try {
    const result = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
    const answer = result.data?.Abstract || "Je n’ai rien trouvé pour ta question 😕.";

    let reply = '';
    switch (mood) {
      case 'curieux':
        reply = `📖 Voici ce que j’ai trouvé : ${answer}`;
        break;
      case 'humoristique':
        reply = `🤣 Mon serveur a rigolé : ${answer}`;
        break;
      default:
        reply = `✅ Résultat : ${answer}`;
    }

    await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, new URLSearchParams({
      From: TWILIO_PHONE,
      To: userNumber,
      Body: reply
    }), {
      auth: {
        username: TWILIO_SID,
        password: TWILIO_TOKEN
      }
    });

  } catch (error) {
    await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, new URLSearchParams({
      From: TWILIO_PHONE,
      To: userNumber,
      Body: "❌ Une erreur s’est produite. Essaie encore plus tard !"
    }), {
      auth: {
        username: TWILIO_SID,
        password: TWILIO_TOKEN
      }
    });
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp lancé sur http://localhost:${PORT}`);
});
