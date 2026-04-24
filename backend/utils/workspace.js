const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const WORKSPACES_DIR = path.join(os.tmpdir(), 'codecraft-workspaces');

async function createWorkspace() {
  const id = uuidv4();
  const dir = path.join(WORKSPACES_DIR, id);
  await fs.mkdir(dir, { recursive: true });
  return { id, dir };
}

async function getWorkspaceDir(id) {
  const dir = path.join(WORKSPACES_DIR, id);
  await fs.access(dir);
  return dir;
}

async function safeResolvePath(workspaceDir, relativePath) {
  const resolved = path.resolve(workspaceDir, relativePath);
  if (!resolved.startsWith(path.resolve(workspaceDir))) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

const SKIP = new Set(['node_modules', '.git', '__pycache__', '.DS_Store', 'dist', 'build', 'target']);
const MAX_SIZE = 500 * 1024; // skip files > 500KB

async function buildFileTree(dir, baseDir = dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch { return []; }

  const nodes = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    if (entry.isDirectory()) {
      nodes.push({ name: entry.name, path: relativePath, type: 'dir', open: false, children: await buildFileTree(fullPath, baseDir) });
    } else {
      const stat = await fs.stat(fullPath).catch(() => null);
      nodes.push({ name: entry.name, path: relativePath, type: 'file', size: stat?.size || 0 });
    }
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.java': 'java', '.kt': 'kotlin',
    '.cs': 'csharp', '.vb': 'vb',
    '.js': 'javascript', '.jsx': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
    '.py': 'python',
    '.go': 'go', '.rs': 'rust',
    '.cpp': 'cpp', '.c': 'c', '.h': 'c',
    '.rb': 'ruby', '.php': 'php',
    '.yaml': 'yaml', '.yml': 'yaml',
    '.json': 'json', '.xml': 'xml', '.html': 'html',
    '.sh': 'bash', '.sql': 'sql',
  };
  return map[ext] || 'text';
}

module.exports = { createWorkspace, getWorkspaceDir, safeResolvePath, buildFileTree, detectLanguage };
