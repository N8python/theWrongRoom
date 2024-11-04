import { fileURLToPath } from "url";
import path from "path";
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getLlama, LlamaChatSession } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Endpoint to get sprite part files
app.get('/sprite-parts/*', (req, res) => {
    const requestedPath = req.params[0];
    const fullPath = path.join(__dirname, '..', 'public', 'sprites', requestedPath);
    
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
    modelPath: path.join(__dirname, "models", "Llama-3-Sussy-Baka-1.2B-IQ4XS.gguf")
});

// Store active sessions
const sessions = new Map();

// Create a new chat session
app.post('/sessions', async (req, res) => {
    try {
        const { systemPrompt } = req.body;
        if (!systemPrompt) {
            return res.status(400).json({ error: 'System prompt is required' });
        }

        const context = await model.createContext();
        const session = new LlamaChatSession({
            contextSequence: context.getSequence(),
            systemPrompt
        });

        const sessionId = uuidv4();
        sessions.set(sessionId, { session, context });

        res.json({ sessionId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Query an existing session
app.post('/sessions/:sessionId/chat', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { message } = req.body;

        const sessionData = sessions.get(sessionId);
        if (!sessionData) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let fullResponse = '';
        
        await sessionData.session.prompt(message, {
            onTextChunk(chunk) {
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
app.delete('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const sessionData = sessions.get(sessionId);
        
        if (!sessionData) {
            return res.status(404).json({ error: 'Session not found' });
        }

        await sessionData.context.dispose();
        sessions.delete(sessionId);
        
        res.json({ message: 'Session closed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
