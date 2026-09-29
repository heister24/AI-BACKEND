import { ChatGoogle } from '@langchain/google';
import {
  MessagesAnnotation,
  StateGraph,
} from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';

//using tool

// ------------------------------------
// Tavily Search Tool
// ------------------------------------

const tavilyTool = new TavilySearch({
  maxResults: 3,
  topic: 'general',
});

const tools = [tavilyTool];

// ------------------------------------
// Google Gemini LLM
// ------------------------------------

const llm = new ChatGoogle({
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-3.1-flash-lite',
  maxRetries: 2,
  temperature: 0.7,
}).bindTools(tools);

// ------------------------------------
// Tool Node
// ------------------------------------

const toolNode = new ToolNode(tools);

// ------------------------------------
// Call LLM
// ------------------------------------

const callLLM = async (state) => {
  console.log('Current state:', state);

  const response = await llm.invoke([
    {
      role: 'system',
      content:
        'You are an AI assistant named Sandesh. Answer the user clearly and helpfully. Use the search tool when you need current or internet-based information.',
    },

    ...state.messages,
  ]);

  return {
    messages: [response],
  };
};

// ------------------------------------
// Decide whether to use tools
// ------------------------------------

const shouldContinue = async (state) => {
  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage?.tool_calls?.length > 0) {
    return 'tools';
  }

  return '__end__';
};

// ------------------------------------
// Create Graph
// ------------------------------------

const graph = new StateGraph(MessagesAnnotation)
  .addNode('agent', callLLM)
  .addNode('tools', toolNode)

  .addEdge('__start__', 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent')

  .compile();

// ------------------------------------
// Controller
// ------------------------------------

export const responseUsingTool = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        message: 'Prompt is required',
      });
    }

    // Run LangGraph
    const response = await graph.invoke({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Get final AI message
    const lastMessage =
      response.messages[response.messages.length - 1];

    return res.status(200).json({
      message: lastMessage.content,
    });
  } catch (error) {
    console.error('AI response error:', error);

    return res.status(500).json({
      message: 'Something went wrong while generating AI response',
      error: error.message,
    });
  }
};





// // without tool
// const state = Annotation.Root({
//   prompt: Annotation,
//   aiMsg: Annotation,
// });

// const callLLM = async (state) => {
//   console.log(state);
//   const response = await llm.invoke([
//     { role: "system", content: "You are my assistant named sandesh" },
//     {
//       role: "human",
//       content: state.prompt,
//     },
//   ]);

//   return { aiMsg: response.content };
// };

// const graph = new StateGraph(state)
//   .addNode("agent", callLLM)
//   .addEdge("__start__", "agent")
//   .addEdge("agent", "__end__")
//   .compile();

// export const responseWithoutTool = async (req, res) => {
//   const { prompt } = req.body;

//   const response = await graph.invoke({ prompt: prompt });
//   //   console.log(response.aiMsg);
//   res.status(200).json({ aiMsg: response.aiMsg });
// };


