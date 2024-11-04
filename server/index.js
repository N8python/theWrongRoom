import { fileURLToPath } from "url";
import path from "path";
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getLlama, LlamaChatSession } from "node-llama-cpp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

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

        const response = await sessionData.session.prompt(message);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
