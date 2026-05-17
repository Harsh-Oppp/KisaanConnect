const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("AI Server Running");
});

app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer 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"
                },
                body: JSON.stringify({
                    model: "llama3-8b-8192",
                    messages: [
                        {
                            role: "system",
                            content:
                            "You are an intelligent agricultural AI assistant helping farmers with crops, soil health, irrigation, fertilizers, pests, NPK, pH, and farming techniques."
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log(data);

        if(data.error){

            return res.json({
                reply: "Groq API Error"
            });

        }

        res.json({
            reply: data.choices[0].message.content
        });

    } catch(err){

        console.log(err);

        res.json({
            reply: "Backend Server Error"
        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running");
});
