// backend/routes/chatbot.js
const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


require('dotenv').config();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'your-fallback-key-here';
router.post('/gpt', async (req, res) => {
  console.log("🔥 Received a request from the frontend");

  const userMessage = req.body.message;
  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: "Invalid user message." });
  }

  const payload = {
    model: "openai/gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: userMessage }
    ]
  };

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "X-Title": "My Chat App"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("🤖 Assistant reply:", data?.choices?.[0]?.message?.content);

    if (data.choices && data.choices[0] && data.choices[0].message) {
      res.json({ reply: data.choices[0].message.content });
    } else if (data.error) {
      console.error("❌ OpenRouter API Error:", data.error);
      res.status(500).json({ error: data.error.message });
    } else {
      console.error("❌ Unexpected response:", data);
      res.status(500).json({ error: "Unexpected error from OpenRouter." });
    }

  } catch (error) {
    console.error("❌ Network/Fetch error:", error);
    res.status(500).json({ error: "Failed to connect to OpenRouter API." });
  }
});

// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'your-fallback-key-here';

// router.post('/', async (req, res) => {
//   const userMessage = req.body.message;

//   const payload = {
//     model: "openai/gpt-3.5-turbo",
//     messages: [
//       { role: "system", content: "You are a helpful assistant." },
//       { role: "user", content: userMessage }
//     ]
//   };

//   try {
//     const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
//         "X-Title": "BlinkNotes AI"
//       },
//       body: JSON.stringify(payload)
//     });

//     const data = await response.json();

//     if (data.choices?.[0]?.message?.content) {
//       res.json({ reply: data.choices[0].message.content });
//     } else {
//       res.status(500).json({ error: "Unexpected response from OpenRouter" });
//     }

//   } catch (err) {
//     console.error("Fetch error:", err);
//     res.status(500).json({ error: "Failed to connect to OpenRouter" });
//   }
// });



module.exports = router;
