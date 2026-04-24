const router = require('express').Router();
const fs = require('fs').promises;
const { createWorkspace, getWorkspaceDir, safeResolvePath, buildFileTree, detectLanguage } = require('../utils/workspace');

router.post('/', async (req, res) => {
  try {
    const { id } = await createWorkspace();
    res.json({ workspaceId: id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/tree', async (req, res) => {
  try {
    const dir = await getWorkspaceDir(req.params.id);
    res.json({ tree: await buildFileTree(dir) });
  } catch (e) { res.status(404).json({ error: 'Workspace not found' }); }
});

router.get('/:id/file', async (req, res) => {
  try {
    const dir = await getWorkspaceDir(req.params.id);
    const filePath = await safeResolvePath(dir, req.query.path);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content, language: detectLanguage(req.query.path) });
  } catch (e) { res.status(404).json({ error: e.message }); }
});

router.put('/:id/file', async (req, res) => {
  try {
    const dir = await getWorkspaceDir(req.params.id);
    const filePath = await safeResolvePath(dir, req.body.path);
    const path = require('path');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, req.body.content, 'utf-8');
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
