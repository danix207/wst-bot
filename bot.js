// Chargement des variables depuis config.env
require('dotenv').config({ path: 'config.env' });

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: false }));

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

// Gestion de l’humeur par utilisateur
const userMoodMap = {};

app.post('/incoming', async (req, res) => {
  const userNumber = req.body.From;
  const userMessage = req.body.Body?.trim();

  if (!userNumber || !userMessage) {
    return res.status(400).send('Requête invalide');
  }

  // Humeur par défaut
  if (!userMoodMap[userNumber]) {
    userMoodMap[userNumber] = 'curieux';
  }

  const mood = userMoodMap[userNumber];

  try {
    const result = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
    const snippet = result.data?.Abstract || "Je n’ai rien trouvé pour ta question 😕.";

    // Création du message selon l’humeur
    let reply = '';
    switch (mood) {
      case 'curieux':
        reply = `📖 Voici ce que j’ai trouvé : ${snippet}`;
        break;
      case 'humoristique':
        reply = `😄 Mon CPU a rigolé ! ➜ ${snippet}`;
        break;
      default:
        reply = `✅ Résultat : ${snippet}`;
    }

    // Envoi du message via l’API Twilio (HTTP)
    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      new URLSearchParams({
        From: TWILIO_PHONE,
        To: userNumber,
        Body: reply
      }),
      {
        auth: {
          username: TWILIO_SID,
          password: TWILIO_TOKEN
        }
      }
    );

  } catch (error) {
    console.error("❌ Erreur Twilio ou DuckDuckGo :", error.message);

    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      new URLSearchParams({
        From: TWILIO_PHONE,
        To: userNumber,
        Body: "⚠️ Une erreur est survenue. Réessaie dans un instant !"
      }),
      {
        auth: {
          username: TWILIO_SID,
          password: TWILIO_TOKEN
        }
      }
    );
  }

  res.sendStatus(200); // Confirme à Twilio que la requête a été traitée
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot WhatsApp lancé sur http://localhost:${PORT}`);
});
