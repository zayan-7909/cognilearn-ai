import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const EMBEDDING_MODEL = 'gemini-embedding-001';

// Prioritize Pro models and Gemma when Flash clusters experience 503 load
const CANDIDATE_CHAT_MODELS = [
  'gemini-pro-latest',
  'gemini-2.5-pro',
  'gemini-3.1-pro-preview',
  'gemma-4-31b-it',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

// Helper delay utility
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Failover runner with automatic retry
async function callGenerativeModelWithFallback(callback) {
  let lastError;

  for (const modelName of CANDIDATE_CHAT_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await callback(model, modelName);
    } catch (err) {
      lastError = err;
      if (err.status === 503 || err.status === 429) {
        console.warn(`[Gemini Failover] Model ${modelName} returned 503/429. Trying next available engine...`);
        await sleep(500); // Small pause to prevent rapid-fire rejection
        continue;
      }
      if (err.status === 404) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// 1. Text embedding generation compressed to 768 dimensions
export async function getEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      outputDimensionality: 768,
    });
    return result.embedding.values;
  } catch (err) {
    console.error('[Gemini Embedding Error]:', err);
    throw err;
  }
}

// 2. Grounded RAG Chat with Citation Generation
export async function generateRAGAnswer(query, contextChunks) {
  const contextText = contextChunks
    .map((c) => `[Page ${c.page_number}]: ${c.content}`)
    .join('\n\n');

  const prompt = `You are CogniLearn AI, an academic study assistant.
Use ONLY the context below to answer the user query.
Context:
${contextText}

Query: ${query}

Rules:
1. Ground your response strictly on the context provided.
2. Cite sources using [Page X] notation.
3. If the context does not contain the answer, state that clearly.`;

  return await callGenerativeModelWithFallback(async (model, name) => {
    const result = await model.generateContent(prompt);
    console.log(`[Gemini Engine] Generated answer using: ${name}`);
    return result.response.text();
  });
}

// 3. Structured Mind Map Topology Generation for React Flow
export async function generateMindMapGraph(content) {
  const prompt = `Extract the core topics and concept relationships from the text below into React Flow nodes and edges JSON format. Return strictly valid raw JSON without markdown markers or backticks.
Schema:
{
  "nodes": [{"id": "1", "data": {"label": "Topic"}, "position": {"x": 250, "y": 20}}],
  "edges": [{"id": "e1-2", "source": "1", "target": "2"}]
}

Text:
${content.slice(0, 4000)}`;

  return await callGenerativeModelWithFallback(async (model, name) => {
    const configuredModel = genAI.getGenerativeModel({
      model: name,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await configuredModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  });
}