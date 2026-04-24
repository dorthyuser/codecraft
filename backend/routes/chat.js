const router = require('express').Router();
const fs = require('fs').promises;
const { getWorkspaceDir, safeResolvePath } = require('../utils/workspace');
const { getOpenAI, getModel, sseWrite, setupSSE } = require('../utils/openai');

router.post('/', async (req, res) => {
  setupSSE(res);
  try {
    const { messages, workspaceId, filePath, code, language } = req.body;

    let codeContext = code;
    if (!codeContext && workspaceId && filePath) {
      try {
        const dir = await getWorkspaceDir(workspaceId);
        const full = await safeResolvePath(dir, filePath);
        codeContext = await fs.readFile(full, 'utf-8');
      } catch {}
    }

    const systemMsg = codeContext
      ? `You are an expert software engineer and code review assistant. The user is currently working on this file:\n\n\`\`\`${language || ''}\n${codeContext}\n\`\`\`\n\nBe concise, specific, and actionable. Reference line numbers when relevant.`
      : `You are an expert software engineer and code review assistant. Help the developer with their questions. Be concise and actionable.`;

    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: getModel(),
      messages: [{ role: 'system', content: systemMsg }, ...(messages || [])],
      stream: true,
      temperature: 0.3,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) sseWrite(res, { content });
    }

    sseWrite(res, { done: true });
    res.end();
  } catch (e) {
    sseWrite(res, { error: e.message });
    res.end();
  }
});

module.exports = router;
