// In this controller i m going to learn message annotation bcs when we integrate tool in lang graph
//  then we can not use custom state bcs it creates issue so we use built in state and that is
//  messageAnnotation

import { ChatGoogle } from "@langchain/google";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const llm = new ChatGoogle({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-3.1-flash-lite",
});

const tools = [];
const toolNode = new ToolNode(tools);

const callLLM = async (state) => {
  console.log("state:", state);
  const response = await llm.invoke([
    { role: "system", content: "You are my assistant, Names - Sandesh." },
    { role: "human", content: state.messages[0].content },
  ]);

  return { messages: [response] };
};

const graph = new StateGraph(MessagesAnnotation)
  .addNode("agent", callLLM)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__")
  .compile();

export const callGraph = async (req, res) => {
  const { prompt } = req.body;

  const response = await graph.invoke({
    messages: [{ role: "user", content: prompt }],
  });

  console.log({ ai: response.messages });
  return res.status(200).json({ ai: response.messages[response.messages.length-1].content });
};
