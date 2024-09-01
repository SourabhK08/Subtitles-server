import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { YoutubeTranscript } from "youtube-transcript";
import cors from "cors";
import Collection from "./mongodb.js"; // This should now work correctly with ES modules
import hbs from "hbs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "hbs");

const geminiApiKey = process.env.API_KEY;
if (!geminiApiKey) {
  console.error(
    "API key is missing. Please set the API_KEY in your .env file."
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/generate-questions", async (req, res) => {
  try {
    const prompt = "Tell me interview questions";
    const result = await model.generateContent([prompt]);
    res.status(200).json(result.response.text());
  } catch (error) {
    console.error("Error in generating questions:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.post("/generate-transcript", async (req, res) => {
  try {
    const { youtube_url } = req.body;
    const transcript = await YoutubeTranscript.fetchTranscript(youtube_url);

    let str = "";
    transcript.forEach((item) => {
      str += item.text;
    });

    const prompt = `This is youtube transcript = ${str} Generate questions based on it, it can be of open-ended and MCQ type questions, and please do not tell the type of question while giving questions. Please do not give the introduction, just give questions. Give at least 20 questions of MCQ and open-ended.`;

    const result = await model.generateContent([prompt]);
    res.status(200).json(result.response.text());
  } catch (error) {
    console.error("Error in generating transcript questions:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/Sign-up", (req, res) => {
  res.render("sign-up");
});

app.post("/Sign-up", async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      password: req.body.password,
    };
    await Collection.insertMany([data]);
    res.redirect("/login");
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(500).send("Error during sign-up. Please try again.");
  }
});

app.post("/login", async (req, res) => {
  try {
    const check = await Collection.findOne({ name: req.body.name });
    if (check && check.password === req.body.password) {
      res.redirect("/");
    } else {
      res.send("Wrong username or password.");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error during login. Please try again.");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
