import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import { PDFParse } from "pdf-parse";
import {
  RecursiveCharacterTextSplitter,
  TokenTextSplitter,
} from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
  maxTokens: null,
  maxRetries: 5,
});

// text embedding model
const textEmbedding = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "embedded-text-document",
});

// storing embedded text in vector database - in Qdrant Vector DB
const vectorStore = await QdrantVectorStore.fromExistingCollection(
  textEmbedding,
  {
    url: process.env.QDRANT_URL,
    collectionName: "vector embedding of text - testing", // we can get error here
  },
);

//upload pdf fruntion and we done our embedding through this function
const uploadPDF = async () => {
  const pdfPath = "./grocery_rag.pdf";
  const pdfBuffer = fs.readFileSync(pdfPath);
  const ParsedResult = new PDFParse({ data: pdfBuffer });
  const result = await ParsedResult.getText();
  const text = result.text;
  // console.log(text);
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const chunkData = await textSplitter.createDocuments([text]);
  // console.log(chunkData);

  // const tokenSplitter = new TokenTextSplitter({
  //   encodingName: "cl100k_base",
  //   chunkOverlap: 0,
  //   chunkSize: 1000,
  // });
  // const chunkedData = await tokenSplitter.splitText(text);
  // console.log(chunkedData)

  await vectorStore.addDocuments(chunkData);
};

export const chatWithGroq = async (req, res) => {
  const { prompt } = req.body;

  // uploadPDF(); //we will run this only single time while learning bcs if we make an api call then everyrimne
  // same data is added again and again in vector DB

  const documents = await vectorStore.similaritySearch(prompt, 5);
  // console.log(documents);

  const context = documents.map((doc) => doc.pageContent).join("\n\n");

  //method 1 for giving context and user prompt
  //   const response = await llm.invoke([
  //     {
  //       role: "system",
  //       content: `
  // You are a helpful grocery store assistant.

  // Answer the user's question using the provided context.

  // If the answer is not present in the context, say:
  // "I couldn't find that information in the grocery catalog"

  // Do not invent products, prices, or information.

  // Context:
  // ${context}
  //         `,
  //     },
  //     { role: "human", content: prompt },
  //   ]);

  const response = await llm.invoke([
    new AIMessage(
      `
You are a helpful grocery store assistant.

Answer the user's question using the provided context.

If the answer is not present in the context, say:
"I couldn't find that information in the grocery catalog"

Do not invent products, prices, or information.

Context:
${context}
        `,
    ),
    new HumanMessage(prompt),
  ]);
  return res.status(200).json(response.content);
};
