require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");


const app = express();
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.use(express.json());
app.use(cors());


async function checkContent(content) {
  const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });
  
  const prompt = "Analysis if this content is harmful to peoples, or violating any law, or this content seems negative:\n\n[CONTENT_START]" + content + "\n\n[CONTENT_END]\n\nGive me a json format output that is stringnified contains values { isHarmful, reason }. Important Note you output plain json text only! Because i want to use this on my apps privacy SpeedSnippet Privacy. Dont use MARKDOWN e.g ```json```just plain json!! plain json!! Please provide a reason make it systematic typed. PLAIN RAW JSON pleasing you, dont because i parsing it into json to prevent error. Dont put any whitespaces otlr not json chars because it can fail my program.";
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  return JSON.parse(text);
}


app.post('/api/v1/speed-snippet-check-content', async (req, res) => {
  const content = req.body.content;
  try {
    const data = await checkContent(content);
    res.status(400).json(data);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: 'Server error!' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
