import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Collection from "./mongodb.js"; // Assuming you have this Mongoose model
import hbs from "hbs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "hbs");

app.post("/sign-up", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Create a new user document
    const newUser = new Collection({ email, password });

    // Save user to database
    await newUser.save();
    res.status(201).send("User registered successfully");
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(500).send("Error during sign-up. Please try again.");
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in the database
    const user = await Collection.findOne({ email });

    // Check if user exists and passwords match
    if (user && user.password === password) {
      res.status(200).send("Login successful");
    } else {
      res.status(400).send("Wrong email or password.");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error during login. Please try again.");
  }
});

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

    const prompt = `This is youtube transcript = ${str} Generate questions based on it, they can be of open-ended and MCQ type questions, and please do not tell the type of question while giving questions. Please do not give the introduction, just give questions. Give at least 15 questions of type MCQ and open-ended.`;

    const result = await model.generateContent([prompt]);
    res.status(200).json(result.response.text());
  } catch (error) {
    console.error("Error in generating transcript questions:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
