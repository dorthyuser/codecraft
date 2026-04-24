const OpenAI = require('openai');

let client = null;

function getOpenAI() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set in .env');
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

function getModel() {
  return process.env.AI_MODEL || 'gpt-4o';
}

// Send SSE event helper
function sseWrite(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function setupSSE(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
}

module.exports = { getOpenAI, getModel, sseWrite, setupSSE };
