require('dotenv').config();
const express = require('express');
const axios = require('axios');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const personaMap = {}; // Mémoire par utilisateur

app.post('/incoming', async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim();

  if (!personaMap[userNumber]) {
    personaMap[userNumber] = {
      name: userMessage,
      mood: 'curieux'
    };
    twiml.message(`Salut ${userMessage} 👋 ! Pose-moi ta première question.`);
  } else {
    const { name, mood } = personaMap[userNumber];
    try {
      const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMessage)}&format=json`);
      const answer = response.data?.Abstract || "Désolé, pas de réponse trouvée.";

      let reply = '';
      switch (mood) {
        case 'curieux':
          reply = `Alors ${name}, voici ce que j'ai découvert : ${answer}`;
          break;
        case 'humoristique':
          reply = `${name}, même mon CPU rigole 🤣 : ${answer}`;
          break;
        default:
          reply = `Voilà ta réponse, ${name} : ${answer}`;
      }

      twiml.message(reply);
    } catch (err) {
      twiml.message("Une erreur est survenue pendant la recherche 🛠️");
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Bot en ligne sur http://localhost:${PORT}`);
});
