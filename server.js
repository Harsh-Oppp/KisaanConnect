const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {

    const message = req.body.message;

    try {

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_GROQ_API_KEY"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert farming AI assistant."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            })
        });

        const data = await response.json();

        res.json({
            reply: data.choices[0].message.content
        });

    } catch(err){

        res.json({
            reply: "AI server failed"
        });

    }

});

app.listen(3000, () => {
    console.log("Server running");
});