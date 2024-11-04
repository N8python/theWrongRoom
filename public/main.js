let currentSessionId = null;

async function initializeSession() {
    try {
        const response = await fetch('/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemPrompt: "You are a helpful AI assistant. Respond concisely and clearly."
            })
        });
        const data = await response.json();
        currentSessionId = data.sessionId;
    } catch (error) {
        console.error('Error initializing session:', error);
    }
}

async function sendMessage(message) {
    if (!currentSessionId) {
        console.error('No active session');
        return;
    }

    try {
        const response = await fetch(`/sessions/${currentSessionId}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error sending message:', error);
        return 'Error: Could not get response from server';
    }
}

function addMessageToChat(message, isUser = true) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.textContent = message;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

document.addEventListener('DOMContentLoaded', async () => {
    await initializeSession();

    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

    async function handleSendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Disable input and button while processing
        messageInput.disabled = true;
        sendButton.disabled = true;

        // Add user message to chat
        addMessageToChat(message, true);
        messageInput.value = '';

        // Get and add AI response
        const response = await sendMessage(message);
        addMessageToChat(response, false);

        // Re-enable input and button
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }

    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
});

// Clean up session when window is closed
window.addEventListener('beforeunload', async () => {
    if (currentSessionId) {
        try {
            await fetch(`/sessions/${currentSessionId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error closing session:', error);
        }
    }
});
