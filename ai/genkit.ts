import { genkit } from "genkit";
import { groqAI } from "@genkit-ai/groq";

export const ai = genkit({
  plugins: [
    groqAI({
      apiKey: process.env.GROQ_API_KEY,
    }),
  ],
  model: "groq/llama-3.1-8b-instant", // or any model Groq supports
});
