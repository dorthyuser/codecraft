const router = require('express').Router();
const fs = require('fs').promises;
const Diff = require('diff');
const { getWorkspaceDir, safeResolvePath } = require('../utils/workspace');
const { getOpenAI, getModel } = require('../utils/openai');

// Generate a diff by asking the AI to apply the suggestion
router.post('/', async (req, res) => {
  try {
    const { workspaceId, filePath, suggestion, code, language } = req.body;

    let original = code;
    if (!original && workspaceId && filePath) {
      const dir = await getWorkspaceDir(workspaceId);
      const full = await safeResolvePath(dir, filePath);
      original = await fs.readFile(full, 'utf-8');
    }
    if (!original) return res.status(400).json({ error: 'No code provided' });

    const openai = getOpenAI();
    const resp = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: 'system',
          content: 'You are a code editor. Apply the described change to the provided code. Return ONLY the complete modified file content — no markdown fences, no explanation, no extra text. Preserve all formatting, indentation, and line endings from the original.',
        },
        {
          role: 'user',
          content: `Change to apply:\nTitle: ${suggestion.title}\nDetails: ${suggestion.desc}\n${suggestion.startLine ? `Affected lines: ${suggestion.startLine}-${suggestion.endLine || suggestion.startLine}` : ''}\n\nOriginal code (${language || 'unknown language'}):\n${original}`,
        },
      ],
      temperature: 0.1,
    });

    const modified = resp.choices[0].message.content.trim().replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
    const diffData = computeDiff(original, modified);

    res.json({ diffData, modifiedCode: modified });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Apply modified code to workspace file
router.post('/apply', async (req, res) => {
  try {
    const { workspaceId, filePath, modifiedCode } = req.body;
    const dir = await getWorkspaceDir(workspaceId);
    const full = await safeResolvePath(dir, filePath);
    await fs.writeFile(full, modifiedCode, 'utf-8');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

function computeDiff(original, modified) {
  const changes = Diff.diffLines(original, modified);
  const beforeLines = [], afterLines = [];
  let bn = 1, an = 1;

  for (const part of changes) {
    const lines = part.value.split('\n');
    // diffLines includes a trailing empty string if value ends with \n
    if (lines[lines.length - 1] === '') lines.pop();

    if (part.removed) {
      lines.forEach(c => beforeLines.push({ n: bn++, c, del: true }));
    } else if (part.added) {
      lines.forEach(c => afterLines.push({ n: an++, c, add: true }));
    } else {
      lines.forEach(c => { beforeLines.push({ n: bn++, c }); afterLines.push({ n: an++, c }); });
    }
  }

  return {
    beforeFull: beforeLines,
    afterFull: afterLines,
    before: contextSlice(beforeLines),
    after: contextSlice(afterLines),
    added: afterLines.filter(l => l.add).length,
    removed: beforeLines.filter(l => l.del).length,
  };
}

// Show only changed lines ± 3 lines of context
function contextSlice(lines) {
  const changedIdxs = new Set();
  lines.forEach((l, i) => { if (l.add || l.del) { for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) changedIdxs.add(j); } });
  const result = [];
  let lastIdx = -1;
  [...changedIdxs].sort((a, b) => a - b).forEach(i => {
    if (lastIdx !== -1 && i > lastIdx + 1) result.push({ n: '…', c: '', hunk: true });
    result.push(lines[i]);
    lastIdx = i;
  });
  return result.length ? result : lines.slice(0, 20);
}

module.exports = router;
