// Langchain makes Ai simple and easy to write codes
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature:0.7,
  maxRetries:2,
  maxOutputTokens:150,
});

export const simpleOld = async (req, res) => {
  const { prompt } = req.body;

  const response = await llm.invoke(prompt);

  return res.status(200).json(response.content);
};
