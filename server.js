import express from "express";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {

    res.send("KisaanConnect AI Server Running");

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

                    "Authorization":
                        "Bearer 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"
                },

                body: JSON.stringify({

                    model: "llama3-8b-8192",

                    messages: [
                        {
                            role: "system",

                            content:
                                "You are an expert agriculture AI assistant helping farmers with crops, fertilizers, irrigation, soil health, NPK analysis, and farming improvements."
                        },

                        {
                            role: "user",

                            content: message
                        }
                    ],

                    temperature: 0.7
                })
            }
        );

        const data = await response.json();

        console.log(data);

        if (data.error) {

            return res.json({
                reply:
                    "Groq API Error: " +
                    data.error.message
            });
        }

        const reply =
            data.choices[0].message.content;

        res.json({
            reply: reply
        });

    } catch (error) {

        console.log(error);

        res.json({
            reply: "Server Error"
        });
    }
});

const PORT =
    process.env.PORT || 10000;

app.listen(PORT, () => {

    console.log("Server running");

});
