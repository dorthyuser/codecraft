const BASE = '/api';

// Reads a Server-Sent Events stream from a POST request
export function streamSSE(url, body, onEvent, onDone, onError) {
  fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        onError?.(new Error(err.error || 'Request failed'));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6);
          if (raw === '[DONE]') { onDone?.(); return; }
          try { onEvent(JSON.parse(raw)); } catch {}
        }
      }
      onDone?.();
    })
    .catch(onError);
}

async function req(method, url, body, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${url}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Workspace
export const workspace = {
  tree: (id) => req('GET', `/workspace/${id}/tree`),
  readFile: (id, path) => req('GET', `/workspace/${id}/file?path=${encodeURIComponent(path)}`),
  writeFile: (id, path, content) => req('PUT', `/workspace/${id}/file`, { path, content }),
};

// Upload
export const upload = {
  files: async (fileList) => {
    const form = new FormData();
    for (const f of fileList) form.append('files', f);
    const res = await fetch(`${BASE}/upload/files`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  paste: (code, language, filename) => req('POST', '/upload/paste', { code, language, filename }),
};

// GitHub
export const github = {
  clone: (repoUrl, token, branch) => req('POST', '/github/clone', { repoUrl, token, branch }),
  repos: (token) => req('GET', '/github/repos', null, { Authorization: `Bearer ${token}` }),
  push: (body) => req('POST', '/github/push', body),
  createPr: (body) => req('POST', '/github/pr', body),
};

// AI analysis (streaming)
export const analyze = {
  run(workspaceId, filePath, activity, code, language, { onText, onSuggestions, onDone, onError } = {}) {
    streamSSE('/analyze', { workspaceId, filePath, activity, code, language },
      (ev) => {
        if (ev.type === 'text') onText?.(ev.content);
        else if (ev.type === 'suggestions') onSuggestions?.(ev.data);
        else if (ev.type === 'error') onError?.(new Error(ev.message));
      },
      onDone, onError,
    );
  },
};

// Chat (streaming)
export const chat = {
  send(messages, workspaceId, filePath, code, language, { onChunk, onDone, onError } = {}) {
    streamSSE('/chat', { messages, workspaceId, filePath, code, language },
      (ev) => {
        if (ev.content) onChunk?.(ev.content);
        else if (ev.error) onError?.(new Error(ev.error));
      },
      onDone, onError,
    );
  },
};

// Diff
export const diff = {
  generate: (workspaceId, filePath, suggestion, code, language) =>
    req('POST', '/diff', { workspaceId, filePath, suggestion, code, language }),
  apply: (workspaceId, filePath, modifiedCode) =>
    req('POST', '/diff/apply', { workspaceId, filePath, modifiedCode }),
};

// Tests (streaming)
export const tests = {
  generate(workspaceId, filePath, code, language, modifiedCode, { onChunk, onSaved, onDone, onError } = {}) {
    streamSSE('/tests/generate', { workspaceId, filePath, code, language, modifiedCode },
      (ev) => {
        if (ev.type === 'code') onChunk?.(ev.content);
        else if (ev.type === 'saved') onSaved?.(ev.path);
        else if (ev.type === 'error') onError?.(new Error(ev.message));
      },
      onDone, onError,
    );
  },
};
