import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// basic LLM interaction using method interaction
export const getResponseByInteraction = async (req, res) => {
  const { promptInput } = req.body;

  const response = await ai.interactions.create({
    model: "gemini-3.8-flash",
    input: promptInput,
  });

  return res.status(200).json(response.output_text);
};

//basic LLM interaction using method generatecontent
export const getResponseByGenerateContent = async (req, res) => {
  const { promptInput } = req.body;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: promptInput,
  });

  return res.status(200).json(response.text);
};


