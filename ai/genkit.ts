import { genkit } from 'genkit';
import { groq, gemma2x9b } from 'genkitx-groq';

export const ai = genkit({
  plugins: [
    groq({ apiKey: process.env.GROQ_API_KEY }),
  ],
  model: gemma2x9b,  // or whichever model from genkitx-groq you want
});
