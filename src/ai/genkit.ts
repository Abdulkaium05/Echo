import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey || geminiApiKey === 'YOUR_API_KEY_HERE') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      "Please set the GEMINI_API_KEY environment variable in your production environment."
    );
  }
  // In development, we can allow Genkit to continue without the key,
  // but it will likely fail when a flow is invoked.
  console.warn(
    "\nWARNING: GEMINI_API_KEY is not set. Please get a key from Google AI Studio (https://aistudio.google.com/app/apikey) and add it to your .env file.\n"
  );
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: geminiApiKey })],
});
