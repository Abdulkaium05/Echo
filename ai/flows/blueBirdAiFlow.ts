'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { SavedSong } from '@/context/music-player-context';

/* -----------------------------------------------------
 * TOOL DEFINITIONS
 * ----------------------------------------------------- */

const getRealTimeNews = ai.defineTool(
  {
    name: 'getRealTimeNews',
    description: 'Get real-time news updates on a specific topic.',
    inputSchema: z.object({
      topic: z.string().optional(),
    }),
    outputSchema: z.array(z.object({
      headline: z.string(),
      summary: z.string(),
      source: z.string(),
    })),
  },
  async ({ topic }) => {
    console.log(`[getRealTimeNews] topic=${topic || 'general'}`);

    const mockNews = [
      {
        headline: "Global Markets Rally as New Tech Regulations Announced",
        summary: "Major stock indices saw significant gains today...",
        source: "Global News Network",
      },
      {
        headline: "Breakthrough in Fusion Energy Achieved",
        summary: "Scientists announced a net energy gain...",
        source: "Science Today",
      },
      {
        headline: "Echo Message App Hits 10M Active Users",
        summary: "The app credits its VIP features for rapid growth.",
        source: "Tech Reports",
      },
    ];

    if (topic?.toLowerCase().includes('space')) {
      return [
        {
          headline: "New Mars Mission Reveals Geological Data",
          summary: "Odyssey orbiter discovers subsurface water ice.",
          source: "Astronomy Now",
        },
      ];
    }

    return mockNews;
  }
);

const getCurrentTime = ai.defineTool(
  {
    name: 'getCurrentTime',
    description: 'Gets the current server date and time.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => new Date().toLocaleString()
);

const SavedSongSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
});

const PlaySongOutputSchema = z.object({
  name: z.string(),
  url: z.string(),
});

const playSongFromPlaylist = ai.defineTool(
  {
    name: 'playSongFromPlaylist',
    description: 'Finds and returns a song by name from the saved playlist.',
    inputSchema: z.object({
      songName: z.string(),
    }),
    outputSchema: PlaySongOutputSchema.optional(),
  },
  async ({ songName }, context) => {
    const state = context?.flow?.state as BlueBirdAssistantInput | undefined;
    const savedSongs = state?.savedSongs || [];

    console.log(`[playSongFromPlaylist] searching="${songName}", list=`, savedSongs);

    const found = savedSongs.find(
      (s) => s.name.toLowerCase() === songName.toLowerCase()
    );

    return found ? { name: found.name, url: found.url } : undefined;
  }
);


/* -----------------------------------------------------
 * SCHEMAS
 * ----------------------------------------------------- */

const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

const BlueBirdAssistantInputSchema = z.object({
  userName: z.string(),
  userMessage: z.string(),
  chatHistory: z.array(ChatHistoryItemSchema).optional(),
  photoDataUri: z.string().optional(),
  audioDataUri: z.string().optional(),
  currentlyPlayingSong: z.string().optional(),
  savedSongs: z.array(SavedSongSchema).optional(),
});

export type BlueBirdAssistantInput = z.infer<typeof BlueBirdAssistantInputSchema>;

const BlueBirdAssistantOutputSchema = z.object({
  botResponse: z.string(),
  songToPlay: PlaySongOutputSchema.optional(),
});

export type BlueBirdAssistantOutput = z.infer<typeof BlueBirdAssistantOutputSchema>;


/* -----------------------------------------------------
 * PROMPT DEFINITION (UNCHANGED LOGIC)
 * ----------------------------------------------------- */

const blueBirdPrompt = ai.definePrompt({
  name: 'blueBirdPrompt',
  input: { schema: BlueBirdAssistantInputSchema },
  output: { schema: BlueBirdAssistantOutputSchema },
  tools: [getRealTimeNews, getCurrentTime, playSongFromPlaylist],
  prompt: `<< YOUR ORIGINAL LARGE PROMPT HERE >>`,
});


/* -----------------------------------------------------
 * CLEANED + SAFER FLOW
 * ----------------------------------------------------- */

const blueBirdAiFlow = ai.defineFlow(
  {
    name: 'blueBirdAiFlow',
    inputSchema: BlueBirdAssistantInputSchema,
    outputSchema: BlueBirdAssistantOutputSchema,
  },
  async (input) => {
    console.log('[Flow] Input:', JSON.stringify(input, null, 2));

    try {
      // Run the prompt with state attached
      const { output } = await blueBirdPrompt(input, { state: input });

      if (!output?.botResponse) {
        console.warn('[Flow] Missing botResponse — using fallback.');
        return {
          botResponse:
            "I couldn't fully process that. Could you say it another way?",
        };
      }

      console.log('[Flow] Output:', JSON.stringify(output, null, 2));

      return output;

    } catch (err) {
      console.error('[Flow] Error:', err);
      return {
        botResponse:
          "Something went wrong on my end. Please try again in a moment.",
      };
    }
  }
);


/* -----------------------------------------------------
 * PUBLIC ENTRY FUNCTION
 * ----------------------------------------------------- */

export async function blueBirdAssistant(
  input: BlueBirdAssistantInput
): Promise<BlueBirdAssistantOutput> {
  try {
    return await blueBirdAiFlow(input);
  } catch (err) {
    console.error('[blueBirdAssistant] Fatal Error:', err);
    return {
      botResponse:
        "I'm having some trouble right now, please try again shortly.",
    };
  }
}

