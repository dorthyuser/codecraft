const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');
const { getWorkspaceDir, safeResolvePath } = require('../utils/workspace');
const { getOpenAI, getModel, sseWrite, setupSSE } = require('../utils/openai');

const SYSTEM_PROMPTS = {
  fix: `You are a senior software engineer specializing in bug detection and code correctness.
Analyze the provided code and identify ALL bugs, runtime errors, null pointer risks, unhandled exceptions, and logic errors.
Respond in two parts:
1. A brief 2-3 sentence narrative summary of what you found.
2. Then on a new line write exactly: ---SUGGESTIONS---
3. Then a valid JSON array of suggestions. Each suggestion must have:
   { "id": "s1", "badge": "fix", "title": "short title", "desc": "detailed description", "impact": "impact description", "confidence": 95, "startLine": 10, "endLine": 12 }
Keep the JSON valid. Use double quotes. No trailing commas.`,

  improve: `You are a senior software engineer focused on code quality.
Identify improvements for readability, performance, maintainability, and design patterns.
Respond in two parts:
1. A brief narrative.
2. ---SUGGESTIONS---
3. JSON array: { "id", "badge": "improve"|"perf", "title", "desc", "impact", "confidence", "startLine", "endLine" }`,

  refactor: `You are an expert software architect.
Suggest refactoring opportunities that improve code structure without changing external behavior.
Respond: 1. Brief narrative. 2. ---SUGGESTIONS--- 3. JSON array: { "id", "badge": "improve", "title", "desc", "impact", "confidence", "startLine", "endLine" }`,

  secure: `You are a security engineer performing a code security audit.
Find OWASP Top 10 vulnerabilities, authentication issues, injection risks, PII exposure, insecure dependencies, and authorization flaws.
Respond: 1. Brief narrative. 2. ---SUGGESTIONS--- 3. JSON array: { "id", "badge": "sec", "title", "desc", "impact": "Critical|High|Medium|Low", "confidence", "startLine", "endLine" }`,

  tests: `You are a test engineer. Analyze the code and describe what test cases would achieve 99%+ line coverage.
Respond: 1. Brief narrative about coverage strategy. 2. ---SUGGESTIONS--- 3. JSON array: { "id", "badge": "improve", "title", "desc", "impact": "Coverage +X%", "confidence", "files": 1 }`,

  explain: `You are a senior engineer and technical writer.
Provide a clear, thorough explanation of what this code does, why it is structured this way, and any important patterns or concerns.
Respond: 1. Detailed explanation (multiple paragraphs). 2. ---SUGGESTIONS--- 3. JSON array with one entry: { "id": "s1", "badge": "improve", "title": "Full explanation", "desc": "one-sentence summary", "impact": "Docs", "confidence": 99, "files": 0 }`,
};

router.post('/', async (req, res) => {
  setupSSE(res);
  try {
    const { workspaceId, filePath, activity, code, language } = req.body;

    let codeContent = code;
    if (!codeContent && workspaceId && filePath) {
      const dir = await getWorkspaceDir(workspaceId);
      const full = await safeResolvePath(dir, filePath);
      codeContent = await fs.readFile(full, 'utf-8');
    }
    if (!codeContent) throw new Error('No code provided');

    const numbered = codeContent.split('\n').map((l, i) => `L${i + 1}: ${l}`).join('\n');
    const openai = getOpenAI();

    const stream = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[activity] || SYSTEM_PROMPTS.explain },
        { role: 'user', content: `Language: ${language || 'auto-detect'}\n\nCode:\n\`\`\`\n${numbered}\n\`\`\`` },
      ],
      stream: true,
      temperature: 0.2,
    });

    let full = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        full += content;
        sseWrite(res, { type: 'text', content });
      }
    }

    // Extract structured suggestions from the response
    const marker = full.indexOf('---SUGGESTIONS---');
    if (marker !== -1) {
      const jsonPart = full.slice(marker + 17).trim();
      const jsonMatch = jsonPart.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          const suggestions = JSON.parse(jsonMatch[0]);
          sseWrite(res, { type: 'suggestions', data: suggestions });
        } catch {
          sseWrite(res, { type: 'suggestions', data: [] });
        }
      }
    } else {
      sseWrite(res, { type: 'suggestions', data: [] });
    }

    sseWrite(res, { type: 'done' });
    res.end();
  } catch (e) {
    sseWrite(res, { type: 'error', message: e.message });
    res.end();
  }
});

module.exports = router;
