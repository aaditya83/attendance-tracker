import { authFetch } from "../../js/auth.js";
console.log("AI ASSISTANT JS LOADED");
const input = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chatBox");

async function sendMessage() {
    const message = input.value.trim();

    if (!message) return;

    chatBox.innerHTML += `
        <div class="message user">
            ${message}
        </div>
    `;

    input.value = "";

    try {
        const response = await authFetch("/ai/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response) return;

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "AI request failed");
        }

        const aiMessage = document.createElement("div");
        aiMessage.className = "ai-message";
        aiMessage.textContent = data.reply;

        chatBox.appendChild(aiMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("AI error:", error);

        chatBox.innerHTML += `
            <div class="ai-message">
                Unable to get AI response.
            </div>
        `;
    }
}

sendBtn.addEventListener("click", sendMessage);