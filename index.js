require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");


const app = express();
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.use(express.json());
app.use(cors());

async function checkContent(content) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_STRICT,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_STRICT,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_STRICT,
        },
      ],
    });

    const prompt = "Analysis this title, description, and code if this content is harmful to people or violating any law, or this content seems negative:\n\n[CONTENT_START]" + content + "\n\n[CONTENT_END]\n\n{ \"isHarmful\": true, \"reason\": \"Your reason here.\" } PLEASE DONT RESPONSE ANY TEXT THAT WILL CAUSE THIS JSON TO FAIL IN PARSING. DONT ANSWER A QUESTION DONT INTERECT. STRICTLY REVIEW TEXT IN CODE INCLUDING STRINGS.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    try {
      const parsedJson = JSON.parse(text);
      return parsedJson;
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      return { "isHarmful": true, "reason": "Error parsing JSON response." };
    }
  } catch (error) {
    console.error("Error:", error);
    return { "isHarmful": true, "reason": "Error occurred during content analysis." };
  }
}


app.post('/api/v1/speed-snippet-check-content', async (req, res) => {
  const content = req.body.content;
  try {
    const data = await checkContent(content);
    res.status(200).json(data);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: 'Server error!' });
  }
});

app.get('/api/v1/test', async (req, res) => {
  const content = req.query.content;
  try {
    const data = await checkContent(content);
    res.status(200).json(data);
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: 'Server error!' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
