import dotenv, { config } from "dotenv";
dotenv.config();
import { GoogleGenAI } from "@google/genai";
import convertToBase64 from "../utils/convertToBase64.js";

const geminiAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Basic - text to text response
export const textToText = async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await geminiAI.interactions.create({
      model: "gemini-3.1-flash-lite",
      input: prompt,
    });

    return res.status(200).json(response.output_text);
  } catch (error) {
    console.log(`Text to text error: ${error}`);
  }
};

// thinking level configuration
export const thinkingWithGemini = async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await geminiAI.interactions.create({
      //   model: "gemini-3.5-flash",    // this model have only 20 free generation per day
      model: "gemini-2.5-flash",
      input: prompt,
      generation_config: {
        // thinking_level: "low",
        thinking_level: "high",
      },
    });
    return res.status(200).json(response.output_text);
  } catch (error) {
    console.log(`Thinking error : ${error}`);
  }
};

//System instructions and other configurations
export const systemConfiguration = async (req, res) => {
  const { prompt } = req.body;

  const response = await geminiAI.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: prompt,
    generation_config: {
      temperature: 2.0,
    },
    system_instruction: "You are my assistant and you name is heister.",
  });
  return res.status(200).json(response.output_text);
};

// multimodel input - user can send image and anything from image
// type -1 sending image url only
export const multiModelInputs = async (req, res) => {
  const { prompt, imageUrl } = req.body;

  // this part not needed if image is coming as imageurl from frontend
  //   const uploadedFile = await geminiAI.files.upload({
  //     file: imageUrl,
  //     config: { mimeType: "image*" },
  //   });

  const response = await geminiAI.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: [
      { type: "text", text: prompt },
      {
        type: "image",
        uri: imageUrl,
        mime_type: "image/jpeg",
      },
    ],
  });
  return res.status(200).json(response.output_text);
};

// type - 2 base64 method

// for this we have to send json data like this
// {
//   "prompt":"what is inside this image.",
//   "image":"D:/Media/Pune/M-Pulse/DSC04600.JPG",
//   "mimetype":"image/jpeg"
// }
export const multiModelInputs1 = async (req, res) => {
  const { prompt, imagePath, mimetype } = req.body;

  const base64 = await convertToBase64(imagePath);

  const response = await geminiAI.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: [
      { type: "text", text: prompt },
      { type: "image", data: base64, mime_type: mimetype },
    ],
  });
  return res.status(200).json(response.output_text);
};

// type - 3 using multer
export const multiModelInputs2 = async (req, res) => {
  const { prompt } = req.body;
  // console.log("prompt:", prompt);
  console.log("imageFile : ", req.file); // here req.file.path is undefined so i m going to use different approach and this is happening bcs i m using multer,memoryStorage() so now i m chaging to diskaStorage to geth filepath

  // console.log("mimeType : ", req.file, mime_type);

  const uploadedFile = await geminiAI.files.upload({
    file: req.file.path,
    config: {
      mimeType: req.file.mimetype,
    },
  });
  const response = await geminiAI.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: [
      { type: "text", text: prompt },
      {
        type: "image",
        uri: uploadedFile.uri,
        mime_type: uploadedFile.mimeType,
      },
    ],
  });
  return res.status(200).json(response.output_text);
};

// streaming response -
//By default, the model returns a response only after the entire generation process is complete.
//For more fluid interactions, use streaming to handle response chunks as they're generated.

export const streamingResponse = async (req, res) => {
  const { prompt } = req.body;

  const response = await geminiAI.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: prompt,
    stream: true,
    generation_config: {
      thinking_level: "low",
    },
  });

  // i m adding this bcs to return res in chunks
  // res.setHeader('Content-Type',"text/event-stream")
  // res.setHeader('Cache-Control','no-cache')
  // res.setHeader('Connection',"keep-alive")

  for await (const chunk of response) {
    if (chunk.event_type === "step.delta") {
      if (chunk.delta.type === "text") {
        process.stdout.write(chunk.delta.text);
        // return res.status(200).json(chunk.delta.text);
      }
    }
  }
};

// Multi-turn conversations
// The Interactions API supports multi-turn conversations by chaining interactions together using
// previous_interaction_id. Each turn is a separate interaction, and the API automatically manages conversation history.

export const interactionAPI = async (req, res) => {
  const { prompt1, prompt2 } = req.body;
  const response1 = await geminiAI.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: prompt1,
  });
  // console.log(response1.output_text);

  const response2 = await geminiAI.interactions.create({
    model: "gemini-3.1-flash-lite",
    input: prompt2,
    previous_interaction_id: response1.id,
  });
  // console.log(response2.output_text);
  return res.status(200).json({
    response1: response1.output_text,
    response2: response2.output_text,
  });
};
