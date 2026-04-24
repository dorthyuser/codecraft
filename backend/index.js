require('dotenv').config();
const express = require('express');
const cors = require('cors');

const workspaceRouter = require('./routes/workspace');
const uploadRouter = require('./routes/upload');
const githubRouter = require('./routes/github');
const analyzeRouter = require('./routes/analyze');
const chatRouter = require('./routes/chat');
const diffRouter = require('./routes/diff');
const testsRouter = require('./routes/tests');

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.use('/api/workspace', workspaceRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/github', githubRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/chat', chatRouter);
app.use('/api/diff', diffRouter);
app.use('/api/tests', testsRouter);

app.get('/api/health', (_, res) => res.json({ ok: true, model: process.env.AI_MODEL }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Codecraft backend on http://localhost:${PORT}`));
