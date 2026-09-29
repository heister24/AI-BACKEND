import { tool } from "@langchain/core/tools";
import { ChatGoogle } from "@langchain/google";
import z from "zod/v3";

const llm = new ChatGoogle({
  model: "gemini-3.1-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
  maxRetries: 2, // max retries to get response if response is failed in generation
  temperature: 0,
  maxOutputTokens: 100,
  // responseLogprobs:true,
  // logprobs: 5,
  // maxReasoningTokens:200,
  // stopSequences:[],
  // topK:,
  // topP:,
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
});

// Simple
export const simpleNew = async (req, res) => {
  const { prompt } = req.body;

  const response = await llm.invoke(prompt);

  //   console.log(response.usage_metadata)
  console.log(response.response_metadata);
  return res.status(200).json(response.content);
};

// role based
export const roleBased = async (req, res) => {
  const { prompt } = req.body;

  const response = await llm.invoke([
    {
      role: "ai", // there are 4 roles available ai, human , system, tool
      content: "You are my assistant and your name is Sandesh",
    },
    { role: "human", content: prompt },
  ]);

  return res.status(200).json(response.content);
};

// structured output with simple schema
const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.string(),
  occupation: z.string(),
  wife: z.string(),
});
const structuredLLM = llm.withStructuredOutput(personSchema);
export const structuredOutput = async (req, res) => {
  const { prompt } = req.body;

  // const response = await structuredLLM.invoke(prompt);
  const response = await structuredLLM.invoke([
    { role: "ai", content: "You are my assistant" },
    { role: "human", content: prompt },
  ]);

  console.log(response);
  return res.status(200).json(response);
};

// structured output with nested schema
const personSchema1 = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.string(),
  occupation: z.string(),
  wife: z.string(),
  address: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
  }),
});
const structuredLLM1 = llm.withStructuredOutput(personSchema1);
export const structuredOutput1 = async (req, res) => {
  const { prompt } = req.body;

  // const response = await structuredLLM.invoke(prompt);
  const response = await structuredLLM1.invoke([
    { role: "ai", content: "You are my assistant" },
    { role: "human", content: prompt },
  ]);

  console.log(response);
  return res.status(200).json(response);
};

// tool 
const addTool = tool(
  ({ a, b }) => {
    return a + b;
  },
  {
    name: "addTool",
    description: "Add two numbers",
    schema: z.object({
      a: z.number(),
      b: z.number(),
    }),
  },
);
const toolLLM = llm.bindTools([addTool]);
export const toolResponse = async (req, res) => {
  const { prompt } = req.body;

  const response = await toolLLM.invoke([
    { role: "system", content: "You are my assistant" },
    { role: "human", content: prompt },
  ]);

  // console.log(response.tool_calls.length);
  if (response.tool_calls?.length > 0) {
    const toolCall = response.tool_calls[0];
    const result = await addTool.invoke(toolCall.args);
    console.log(result);
  }

  // return res.status(200).json(response.tool_calls);
};
