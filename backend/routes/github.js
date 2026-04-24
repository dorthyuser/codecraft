const router = require('express').Router();
const { simpleGit } = require('simple-git');
const fs = require('fs').promises;
const path = require('path');
const { createWorkspace, getWorkspaceDir, buildFileTree } = require('../utils/workspace');

// Clone a repository (HTTPS with token or SSH)
router.post('/clone', async (req, res) => {
  try {
    const { repoUrl, token, branch } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

    const { id, dir } = await createWorkspace();

    let cloneUrl = repoUrl.trim();
    // Inject token for HTTPS URLs
    if (token && cloneUrl.startsWith('https://')) {
      cloneUrl = cloneUrl.replace('https://', `https://oauth2:${token}@`);
    }

    const git = simpleGit();
    const cloneArgs = ['--depth', '1'];
    if (branch) cloneArgs.push('-b', branch);

    await git.clone(cloneUrl, dir, cloneArgs);

    const tree = await buildFileTree(dir);

    // Parse owner/repo from URL
    const m = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    const repoInfo = m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null;

    res.json({ workspaceId: id, tree, repoInfo });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// List user's GitHub repos (needs token)
router.get('/repos', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'GitHub token required' });

    const r = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message });

    res.json({ repos: data.map(d => ({ name: d.full_name, branch: d.default_branch, url: d.clone_url, private: d.private })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Commit and push changes to a new branch
router.post('/push', async (req, res) => {
  try {
    const { workspaceId, token, owner, repo, branch, commitMessage } = req.body;
    if (!workspaceId || !branch) return res.status(400).json({ error: 'workspaceId and branch required' });

    const dir = await getWorkspaceDir(workspaceId);
    const git = simpleGit(dir);

    await git.addConfig('user.email', 'codecraft-ai@app.com');
    await git.addConfig('user.name', 'Codecraft AI');

    // Create and switch to new branch
    await git.checkoutLocalBranch(branch);
    await git.add('.');
    await git.commit(commitMessage || 'chore: AI-generated changes via Codecraft');

    // Update remote URL with token if provided
    if (token && owner && repo) {
      await git.remote(['set-url', 'origin', `https://oauth2:${token}@github.com/${owner}/${repo}.git`]);
    }
    await git.push('origin', branch, ['--set-upstream']);

    res.json({ ok: true, branch });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create a pull request via GitHub API
router.post('/pr', async (req, res) => {
  try {
    const { token, owner, repo, branch, base, title, body } = req.body;
    if (!token || !owner || !repo || !branch) return res.status(400).json({ error: 'token, owner, repo, branch required' });

    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body, head: branch, base: base || 'main' }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message });

    res.json({ ok: true, prUrl: data.html_url, prNumber: data.number });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
