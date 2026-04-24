const router = require('express').Router();
const fs = require('fs').promises;
const path = require('path');
const { getWorkspaceDir, safeResolvePath, detectLanguage } = require('../utils/workspace');
const { getOpenAI, getModel, sseWrite, setupSSE } = require('../utils/openai');

const LANG_HINTS = {
  java: 'Generate JUnit 5 + Mockito tests. Use @ExtendWith(MockitoExtension.class), @Mock, @InjectMocks, @Test. Return only the test class file.',
  javascript: 'Generate Jest tests. Use describe/it/expect. Mock with jest.fn() and jest.mock(). Return only the test file.',
  typescript: 'Generate Jest tests with TypeScript. Return only the test file.',
  python: 'Generate pytest tests. Use unittest.mock.patch and MagicMock where needed. Return only the test file.',
  csharp: 'Generate xUnit tests with Moq for mocking. Return only the test class file.',
  go: 'Generate Go tests using the testing package. Return only the test file.',
};

// Generate tests (streaming)
router.post('/generate', async (req, res) => {
  setupSSE(res);
  try {
    const { workspaceId, filePath, code, language, modifiedCode } = req.body;

    let codeContent = modifiedCode || code;
    if (!codeContent && workspaceId && filePath) {
      const dir = await getWorkspaceDir(workspaceId);
      const full = await safeResolvePath(dir, filePath);
      codeContent = await fs.readFile(full, 'utf-8');
    }
    if (!codeContent) throw new Error('No code to generate tests for');

    const lang = language || (filePath ? detectLanguage(filePath) : 'javascript');
    const hint = LANG_HINTS[lang] || 'Generate comprehensive unit tests targeting 99%+ line coverage. Return only the test file.';

    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: `You are an expert test engineer. ${hint} Do NOT include markdown code fences. Output raw code only.` },
        { role: 'user', content: `Generate comprehensive unit tests targeting 99%+ line coverage for this code:\n\n${codeContent}` },
      ],
      stream: true,
      temperature: 0.2,
    });

    let testCode = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        testCode += content;
        sseWrite(res, { type: 'code', content });
      }
    }

    // Strip any accidental markdown fences
    testCode = testCode.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim();

    // Save test file to workspace
    if (workspaceId && filePath) {
      try {
        const dir = await getWorkspaceDir(workspaceId);
        const ext = path.extname(filePath);
        const base = path.basename(filePath, ext);
        const dir2 = path.dirname(filePath);
        const testFileName = `${base}Test${ext}`;
        const testRelPath = path.join(dir2, testFileName);
        const fullTestPath = await safeResolvePath(dir, testRelPath);
        await fs.mkdir(path.dirname(fullTestPath), { recursive: true });
        await fs.writeFile(fullTestPath, testCode, 'utf-8');
        sseWrite(res, { type: 'saved', path: testRelPath });
      } catch {}
    }

    sseWrite(res, { type: 'done' });
    res.end();
  } catch (e) {
    sseWrite(res, { type: 'error', message: e.message });
    res.end();
  }
});

module.exports = router;
