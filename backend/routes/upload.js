const router = require('express').Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs').promises;
const path = require('path');
const { createWorkspace, buildFileTree, detectLanguage } = require('../utils/workspace');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Upload files or folder (supports .zip extraction)
router.post('/files', upload.array('files'), async (req, res) => {
  try {
    const { id, dir } = await createWorkspace();
    for (const file of req.files) {
      if (file.originalname.endsWith('.zip')) {
        const zip = new AdmZip(file.buffer);
        zip.extractAllTo(dir, true);
      } else {
        // Preserve relative path from the upload if provided
        const relPath = file.originalname.includes('/') ? file.originalname : file.originalname;
        const dest = path.join(dir, relPath);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, file.buffer);
      }
    }
    const tree = await buildFileTree(dir);
    res.json({ workspaceId: id, tree });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Paste a code snippet
router.post('/paste', async (req, res) => {
  try {
    const { code, language, filename } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });
    const extMap = { java:'java','c#':'cs',javascript:'js',typescript:'ts',python:'py',go:'go',rust:'rs',csharp:'cs' };
    const ext = extMap[language?.toLowerCase()] || 'txt';
    const fname = filename || `code.${ext}`;
    const { id, dir } = await createWorkspace();
    await fs.writeFile(path.join(dir, fname), code, 'utf-8');
    const tree = await buildFileTree(dir);
    res.json({ workspaceId: id, tree, openFile: { path: fname, language: detectLanguage(fname) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
