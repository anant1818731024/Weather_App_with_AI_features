import { Request, Response } from "express";
import { openai } from "./openai";
import { buildWeatherPrompt } from "./weather-prompt";

export async function weatherAdvice(req: Request, res: Response) {
  try {
    const { question, weather } = req.body;

    const prompt = buildWeatherPrompt(question, weather);
    console.log("Weather Prompt:", prompt);
    console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY);

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }]
    });

    console.log("OpenAI Response:", completion);

    res.json({
      answer:
        completion.choices[0].message.content ??
        "No advice available.",
    });
  } catch (err: any) {
    console.error("OPENAI ERROR:", err);

    if (err?.status === 429) {
      return res.status(429).json({
        message: "AI service is temporarily unavailable. Please try again later.",
      });
    }

    // fallback for other errors
    return res.status(500).json({
      message: "Failed to generate AI response",
    });
  }
}
