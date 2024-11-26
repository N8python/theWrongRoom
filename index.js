// main.js
/*const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { getLlama, LlamaChatSession } = require('node-llama-cpp');
const fs = require('fs');*/
import { app, BrowserWindow } from 'electron';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { getLlama, LlamaChatSession, TokenBias } from 'node-llama-cpp';
import fs from 'fs';


async function createWindow() {
    const __dirname = app.getAppPath();
    // Initialize Express app
    const expressApp = express();

    // Enable CORS
    expressApp.use(cors());

    // Add security headers
    expressApp.use((req, res, next) => {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    });

    expressApp.use(express.json());

    // Serve static files with proper headers
    expressApp.use(express.static(path.join(__dirname, 'public'), {
        setHeaders: (res, path) => {
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        }
    }));

    // Endpoint to get sprite part files
    expressApp.get('/sprite-parts/*', (req, res) => {
        const requestedPath = req.params[0];
        const fullPath = path.join(__dirname, 'public', 'sprites', requestedPath);
        try {
            const files = fs.readdirSync(fullPath);
            res.json(files.filter(file => file.endsWith('.png')));
        } catch (error) {
            res.status(500).json({ error: 'Error reading sprite directory' });
        }
    });

    // Initialize Llama
    const llama = await getLlama();
    const model = await llama.loadModel({
        modelPath: path.join(__dirname, "models", "Llama-3.2-Sussy-3B-Instruct-IQ4_XS.gguf")
    });
    // Do a dummy inference
    const dummyContext = await model.createContext({
        contextSize: 4096
    });
    const dummySession = new LlamaChatSession({
        contextSequence: dummyContext.getSequence(),
        systemPrompt: "Hello, how are you?"
    });
    await dummySession.prompt("I'm doing well, thank you!", {
        maxTokens: 1
    });
    dummySession.dispose();
    dummyContext.dispose();

    const prisonBias = new TokenBias(model.tokenizer);
    const verboten = "<"
    for (const token of model.iterateAllTokens()) {
        const text = model.detokenize([token]);
        //console.log(`Token: ${text}`);
        if (verboten.includes(text) || text.includes(verboten)) {
            prisonBias.set(token, "never");
        }
    }

    // Enhanced session storage with last activity tracking
    const sessions = new Map();

    // Configuration for session cleanup
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // Run cleanup every 5 minutes

    // Create a new chat session
    expressApp.post('/sessions', async(req, res) => {
        try {
            const { systemPrompt } = req.body;
            if (!systemPrompt) {
                return res.status(400).json({ error: 'System prompt is required' });
            }

            const context = await model.createContext({
                contextSize: 4096
            });
            const session = new LlamaChatSession({
                contextSequence: context.getSequence(),
                systemPrompt
            });

            const sessionId = uuidv4();
            sessions.set(sessionId, {
                session,
                context,
                lastActivity: Date.now()
            });

            res.json({ sessionId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Query an existing session
    expressApp.post('/sessions/:sessionId/chat', async(req, res) => {
        try {
            const { sessionId } = req.params;
            const { message, prefix, noLeave } = req.body;
            const sessionData = sessions.get(sessionId);
            if (!sessionData) {
                return res.status(404).json({ error: 'Session not found' });
            }

            // Update last activity timestamp
            sessionData.lastActivity = Date.now();

            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            let fullResponse = '';
            let startTime = Date.now();
            let firstToken = true;
            await sessionData.session.prompt(message, {
                temperature: 1.0,
                topK: 40,
                minP: 0.05,
                topP: 0.95,
                repeatPenalty: 1.1,
                responsePrefix: typeof prefix === 'string' ? prefix : undefined,
                tokenBias: noLeave ? prisonBias : undefined,
                onTextChunk(chunk) {
                    const currentTime = Date.now();
                    if (firstToken) {
                        firstToken = false;
                        console.log('Time to first token:', (currentTime - startTime) / 1000);
                    }

                    fullResponse += chunk;
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                }
            });

            // Send end event
            res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
            res.end();
        } catch (error) {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    });

    // Close a session
    expressApp.delete('/sessions/:sessionId', async(req, res) => {
        try {
            const { sessionId } = req.params;
            await closeSession(sessionId);
            res.json({ message: 'Session closed successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Helper function to close a session and cleanup resources
    async function closeSession(sessionId) {
        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            throw new Error('Session not found');
        }

        try {
            await sessionData.session.dispose();
            await sessionData.context.dispose();
        } finally {
            sessions.delete(sessionId);
        }
    }

    // Cleanup inactive sessions
    async function cleanupInactiveSessions() {
        const now = Date.now();
        const inactiveSessions = [];

        // Identify inactive sessions
        for (const [sessionId, sessionData] of sessions.entries()) {
            if (now - sessionData.lastActivity > SESSION_TIMEOUT) {
                inactiveSessions.push(sessionId);
            }
        }

        // Close inactive sessions
        for (const sessionId of inactiveSessions) {
            try {
                console.log(`Closing inactive session: ${sessionId}`);
                await closeSession(sessionId);
            } catch (error) {
                console.error(`Error closing session ${sessionId}:`, error);
            }
        }

        if (inactiveSessions.length > 0) {
            console.log(`Cleaned up ${inactiveSessions.length} inactive sessions`);
        }
    }

    // Start the server
    const PORT = process.env.PORT || 3000;
    expressApp.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Set up periodic session cleanup
    setInterval(cleanupInactiveSessions, CLEANUP_INTERVAL);

    // Session monitoring (modified to include last activity time)
    setInterval(() => {
        const now = Date.now();
        console.log('Active sessions:');
        for (const [sessionId, sessionData] of sessions.entries()) {
            const idleTime = Math.round((now - sessionData.lastActivity) / 1000);
            console.log(`- ${sessionId} (idle for ${idleTime}s)`);
        }
    }, 10000);

    // Create the browser window
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // Load the Express app in the BrowserWindow
    win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});