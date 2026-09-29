import express from "express";
import dotenv from "dotenv";
dotenv.config();

import {
  systemConfiguration,
  textToText,
  thinkingWithGemini,
  multiModelInputs,
  multiModelInputs1,
  multiModelInputs2,
  streamingResponse,
  interactionAPI,
} from "./controller/textResponse.js";
import upload from "./middleware/multer.js";
import { simpleOld } from "./controller/langchainOld.js";
import {
  roleBased,
  simpleNew,
  structuredOutput,
  structuredOutput1,
  toolResponse,
} from "./controller/langchainNew.js";
// import { responseWithoutTool } from "./controller/langGraph.js";
import { callGraph } from "./controller/messageAnnotation.js";
import { responseUsingTool } from "./controller/langGraphTool.js";
import { compile } from "./controller/langGraphMemory.js";

const app = express();

const port = process.env.PORT;

app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.send("Hello from server");
});

//textresponse routes
app.post("/textToText", textToText);
app.post("/thinkingResponse", thinkingWithGemini);
app.post("/systemInstruction", systemConfiguration);
app.post("/uploadedFile", multiModelInputs);
app.post("/uploadedFile1", multiModelInputs1);
app.post("/uploadedFile2", upload.single("image"), multiModelInputs2);
app.post("/streamingResponse", streamingResponse);
app.post("/interactionAPI", interactionAPI);

//langchain old routes
app.post("/simpleOld", simpleOld);

//langchain New routes
app.post("/simpleNew", simpleNew);
app.post("/roleBased", roleBased);
app.post("/structuredOutput", structuredOutput);
app.post("/structuredOutput1", structuredOutput1);
app.post("/toolResponse", toolResponse);

//langraph
// app.post("/responseWithoutTool", responseWithoutTool);
app.post("/responseUsingTool", responseUsingTool);

// message Annotation
app.post("/messageAnnotation", callGraph);

app.post("/compile", compile);
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
