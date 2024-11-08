import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Collection from "./mongodb.js";
import bcrypt from "bcrypt"; // Import bcrypt for hashing passwords
import hbs from "hbs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";
import axios from "axios";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "hbs");

// Route for user registration
app.post("/sign-up", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user document
    const newUser = new Collection({ email, password: hashedPassword });

    // Save user to database
    await newUser.save();
    res.status(201).send("User registered successfully");
  } catch (error) {
    console.error("Error during sign-up:", error);
    res.status(500).send("Error during sign-up. Please try again.");
  }
});

// Route for user login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in the database
    const user = await Collection.findOne({ email });

    // Check if user exists and passwords match
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).send("Login successful");
    } else {
      res.status(400).send("Wrong email or password.");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error during login. Please try again.");
  }
});

// Route to update password
app.post("/update-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Email and new password are required." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in the database
    const result = await Collection.updateOne(
      { email },
      { password: hashedPassword }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Error updating password." });
  }
});

// Initialize GoogleGenerativeAI model
const geminiApiKey = process.env.API_KEY;
if (!geminiApiKey) {
  console.error(
    "API key is missing. Please set the API_KEY in your .env file."
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Route for generating questions
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

// Route for generating transcript questions
app.post("/generate-transcript", async (req, res) => {
  try {
    const { youtube_url } = req.body;

    // Fetch transcript from YouTube
    const transcript = await YoutubeTranscript.fetchTranscript(youtube_url);

    let transcriptText = "";
    transcript.forEach((item) => {
      transcriptText += item.text + " ";
    });

    // Define a more focused prompt for question generation
    const prompt = `This is the transcript from a YouTube video: "${transcriptText}". Based on this, generate a open-ended question and Exclude any instructions just 5 questions only.`;

    const result = await model.generateContent([prompt]);

    // Extract generated content
    let generatedContent = result.response.text();

    generatedContent = generatedContent.replace(/##.*\n/g, "").trim();

    // Define a prompt for generating MCQs
    const prompt2 = `This is the transcript from a YouTube video: "${transcriptText}". Based on this, generate a mcq question in one line and in next line its 4 option ans in next line it's answer just write a,b,c or d and in next line again question,option answer keep repeating this formate for all 5 question so that i split them by '\n' in first line get question second line option and in 3rd line get answer answer must be on char a,b,c or d exclude any instructions just 5 question only.`;

    const result2 = await model.generateContent([prompt2]);
    // Extract MCQ content
    let generatedContent2 = result2.response.text();

    generatedContent2 = generatedContent2.replace(/##.*\n/g, "").trim();

    res.status(200).json({
      questions: generatedContent,
      mcq: generatedContent2,
    });
  } catch (error) {
    console.error("Error in generating transcript questions:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

// reCAPTCHA-protected login route
app.post("/login", async (req, res) => {
  const { email, password, recaptchaToken } = req.body;
  const secretKey = "6Lc3gDUqAAAAAHViaiw4vGwPTUEaw37SmcAzUVD7";

  try {
    const recaptchaResponse = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      {},
      {
        params: {
          secret: secretKey,
          response: recaptchaToken,
        },
      }
    );

    if (recaptchaResponse.data.success) {
      // Proceed with authentication and other login logic
      res.status(200).send("Login successful!");
    } else {
      res.status(400).send("reCAPTCHA verification failed");
    }
  } catch (error) {
    res.status(500).send("Error verifying reCAPTCHA");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
