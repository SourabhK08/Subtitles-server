import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai"; // Ensure this is the correct import path and library
import dotenv from "dotenv";
import { YoutubeTranscript } from "youtube-transcript";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());

const geminiApiKey = process.env.API_KEY;
if (!geminiApiKey) {
  console.error(
    "API key is missing. Please set the API_KEY in your .env file."
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json());

app.post("/generate-questions", async (req, res) => {
  try {
    const prompt = "Tell me interview questions";

    const result = await model.generateContent([prompt]);
    console.log(result.response.text());
    res.status(200).json(result.response.text());
  } catch (error) {
    console.error("Error in generating questions:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.post("/generate-transcript", async (req, res) => {
  // YoutubeTranscript.fetchTranscript(
  //   "https://youtu.be/9AP6IfKSJxo?si=kQJCX8If1og9QEfR"
  // ).then(console.log);
  // res.status(200).json({ error: "Something went wrong." });

  const { youtube_url } = req.body;

  const transcript = await YoutubeTranscript.fetchTranscript(youtube_url);
  console.log(transcript);
  // res.status(200).json({ transcript });
  let str = "";
  transcript.map((item) => {
    str += item.text;
  });
  const prompt = ` This is youtube transcript =  ${str}  Generate questions based on it , it can be of open ended and mcq type questions and please do not tell the type of question while giving questions and please do not give the introduction just give questions give atleast 20 questions of mcq and open ended `;

  const result = await model.generateContent([prompt]);
  console.log(result.response.text());
  return res.status(200).json(result.response.text());
  //return res.status(200).json({ str });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
