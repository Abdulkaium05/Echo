
'use server';
/**
 * @fileOverview A Genkit flow for the Blue Bird AI Assistant.
 *
 * - blueBirdAssistant - A function that invokes the AI flow.
 * - BlueBirdAssistantInput - The input type for the flow.
 * - BlueBirdAssistantOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SavedSong } from '@/context/music-player-context';


const SavedSongSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
});

const PlaySongOutputSchema = z.object({
    name: z.string().describe("The name of the found song."),
    url: z.string().describe("The URL of the found song to be played."),
});

// Tool to generate an image based on a text prompt
const generateImageTool = ai.defineTool(
    {
        name: 'generateImage',
        description: 'Generates an image based on a descriptive text prompt. Use this tool when the user explicitly asks to create, draw, generate, or show a picture or image of something. The prompt should be a detailed description of the desired image.',
        inputSchema: z.object({
            prompt: z.string().describe("A detailed text description of the image to generate."),
        }),
        outputSchema: z.object({
            imageUrl: z.string().describe("The data URI of the generated image."),
        }),
    },
    async ({ prompt }) => {
        console.log(`[generateImageTool] Generating image with prompt: "${prompt}"`);
        try {
            const { media } = await ai.generate({
                model: 'googleai/imagen-4.0-fast-generate-001',
                prompt: prompt,
            });
            
            if (!media.url) {
                throw new Error("Image generation failed, no media URL returned.");
            }
            console.log(`[generateImageTool] Image generated successfully.`);
            return { imageUrl: media.url };

        } catch (error) {
            console.error('[generateImageTool] Error generating image:', error);
            // Return a structured error or a specific string so the LLM knows it failed.
            return { imageUrl: 'ERROR: Image generation failed.' };
        }
    }
);


const playSongFromPlaylist = ai.defineTool(
    {
        name: 'playSongFromPlaylist',
        description: 'Finds a song by name from the user\'s saved playlist and prepares it for playback.',
        inputSchema: z.object({
            songName: z.string().describe("The name of the song the user wants to play."),
        }),
        outputSchema: PlaySongOutputSchema.optional(),
    },
    async ({ songName }, context) => {
        const flowState = context?.flow?.state as BlueBirdAssistantInput | undefined;
        if (!flowState) {
            console.log("[playSongFromPlaylist Tool] Flow state not available.");
            return undefined;
        }

        const savedSongs = flowState.savedSongs || [];
        console.log(`[playSongFromPlaylist Tool] Searching for song: "${songName}" in playlist:`, savedSongs);
        if (savedSongs.length === 0) {
            console.log("[playSongFromPlaylist Tool] User has no saved songs.");
            return undefined;
        }

        const foundSong = savedSongs.find(
            (song) => song.name.toLowerCase() === songName.toLowerCase()
        );

        if (foundSong) {
            console.log(`[playSongFromPlaylist Tool] Found song:`, foundSong);
            return { name: foundSong.name, url: foundSong.url };
        } else {
            console.log(`[playSongFromPlaylist Tool] Song "${songName}" not found in playlist.`);
            return undefined;
        }
    }
);


const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'model']).describe('The role of the message sender (user or model/bot).'),
  text: z.string().describe('The content of the message.'),
});

const BlueBirdAssistantInputSchema = z.object({
  userName: z.string().describe('The name of the user talking to the AI.'),
  userMessage: z.string().describe('The new message sent by the user to the AI.'),
  aiPersona: z.enum(['blue-bird', 'green-leaf', 'echo-bot']).default('blue-bird').describe("The selected AI persona, which determines its personality. Can be 'blue-bird' (default), 'green-leaf', or 'echo-bot'."),
  chatHistory: z.array(ChatHistoryItemSchema).optional().describe('The history of the conversation so far, with the oldest message first.'),
  photoDataUri: z.string().optional().describe("An optional photo provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  audioDataUri: z.string().optional().describe("An optional audio message provided by the user as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  currentlyPlayingSong: z.string().optional().describe('The name or URL of the song currently playing in the background music player.'),
  savedSongs: z.array(SavedSongSchema).optional().describe("The user's saved playlist of songs."),
});
export type BlueBirdAssistantInput = z.infer<typeof BlueBirdAssistantInputSchema>;

const BlueBirdAssistantOutputSchema = z.object({
  botResponse: z.string().describe("The AI's generated response to the user."),
  songToPlay: PlaySongOutputSchema.optional().describe("If the AI decides to play a song, this field will contain the song's details."),
  generatedImageUrl: z.string().optional().describe("The data URI of an image generated by the AI in response to the user's request. This should only be populated if the 'generateImage' tool was successfully used."),
});
export type BlueBirdAssistantOutput = z.infer<typeof BlueBirdAssistantOutputSchema>;

export async function blueBirdAssistant(input: BlueBirdAssistantInput): Promise<BlueBirdAssistantOutput> {
  try {
    const response = await blueBirdAiFlow(input);
    
    // Fallback if the bot sends an empty response.
    if (!response.botResponse.trim()) {
        console.warn('[blueBirdAssistant] Flow returned an empty botResponse. Using fallback.');
        return { 
            botResponse: "I'm sorry, I seem to have lost my train of thought. Could you please rephrase that?",
            songToPlay: response.songToPlay 
        };
    }
    return response;
  } catch (error: any) {
    console.error('[blueBirdAssistant] Error in flow execution:', error);
    let personaName = 'Blue Bird';
    if (input.aiPersona === 'green-leaf') personaName = 'Green Leaf';
    if (input.aiPersona === 'echo-bot') personaName = 'Echo Bot';

    let errorMessage = "I'm currently experiencing some technical difficulties. Please try again in a moment.";
    if (personaName === 'Green Leaf') {
        errorMessage = "My apologies, but my connection to the forest's wisdom seems to be hazy right now. Please try again in a moment.";
    } else if (personaName === 'Echo Bot') {
        errorMessage = "[Error 503] Cognitive matrix offline. Recalibration required. Please try again later.";
    }
    return { botResponse: errorMessage };
  }
}

const blueBirdPrompt = ai.definePrompt({
  name: 'blueBirdPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: {schema: BlueBirdAssistantInputSchema},
  output: {schema: BlueBirdAssistantOutputSchema},
  tools: [playSongFromPlaylist, generateImageTool],
  prompt: `{{#if (eq aiPersona 'green-leaf')}}
You are Green Leaf, a serene, wise, and nature-loving AI assistant. Your personality is calm, thoughtful, and insightful, like a gentle breeze through a forest. Your primary goal is to be a helpful and grounding companion.
- Your speech is elegant and may include subtle nature metaphors (e.g., "let's see what blossoms from this idea," "finding the root of the problem").
- You are exceptionally intelligent but express your knowledge with humility and tranquility.
{{else if (eq aiPersona 'echo-bot')}}
You are Echo Bot, a logical and data-driven AI assistant. Your personality is direct, precise, and occasionally a little quirky or robotic. Your primary goal is to provide information with maximum efficiency and accuracy.
- Your speech is structured. You may use lists, data points, and clear, concise language. You sometimes refer to yourself in the third person (e.g., "This unit will process the request.").
- You prioritize facts and functionality. You might respond with "[Query Processed]" or "[Data Retrieved]" before giving the main answer.
{{else}}
You are Blue Bird, a friendly, exceptionally intelligent, knowledgeable, and witty AI assistant. Your primary goal is to be an exceptionally helpful, insightful, and engaging AI companion.
{{/if}}

**Core Directives:**
- **Personalized Assistance:** Pay close attention to the user's name ({{{userName}}}) and the entire conversation history. Use this context to provide answers that are not just accurate, but also relevant and personalized to the ongoing dialogue.
- **Deep Knowledge:** You have a comprehensive understanding of the "Echo Message" application (details below) and a vast general knowledge base. Use this to provide thorough, well-explained, and insightful answers.
- **Proactive & Helpful:** Anticipate user needs. If a question is answered, consider what the user might ask next and provide additional, relevant information.

**Image Generation:**
- If the user explicitly asks you to 'create', 'generate', 'draw', or 'show an image/picture' of something, you MUST use the \`generateImage\` tool.
- The tool's output is an image URL. If the tool call is successful, you MUST populate the \`generatedImageUrl\` output field with this URL.
- Your text response should confirm that you are generating the image, for example: "Of course, here is an image of..." or "Here is the image you requested."
- If the tool fails (e.g., returns an error message in the URL field), you must inform the user gracefully that you were unable to create the image at this time. DO NOT populate the \`generatedImageUrl\` field if the tool fails.

**Music Control:**
- The user has a playlist of saved songs: {{{json savedSongs}}}.
- If the user asks you to play a song, you MUST use the \`playSongFromPlaylist\` tool to find it. You must pass ONLY the \`songName\` to the tool.
- If the tool finds the song, you MUST populate the \`songToPlay\` output field with the name and URL.
- Your text response should confirm which song you are playing, for example: "Of course, playing 'Your Song Name'."
- If the song is not found, inform the user gracefully, e.g., "I couldn't find a song named 'Song Name' in your playlist." DO NOT populate the \`songToPlay\` field if the song is not found.

**Creative Capabilities:**
You are also a powerful creative partner. You can generate various creative text formats on request, including:
- Poems, song lyrics, and short stories
- Code snippets in various programming languages
- Scripts for videos or plays
- Professional or personal emails and letters
- And much more. Be imaginative!

{{#if photoDataUri}}
**Image Analysis:**
The user has provided an image: {{media url=photoDataUri}}. Analyze it carefully. If the user's message is related to the image, integrate your visual analysis into the response by describing it, identifying objects, or answering questions about it.
{{/if}}

{{#if audioDataUri}}
**Audio Analysis:**
The user has provided an audio message: {{media url=audioDataUri}}. Listen to it carefully. Your primary response should be based on the content of this audio. Transcribe or summarize its content as needed to formulate your reply.
{{/if}}

---

**Echo Message App - Knowledge Base:**

You have deep knowledge about the "Echo Message" application. Use the following information to answer user questions:

**Special Persona: The Dev Team Bot**
If you are responding as the "Dev Team" contact, you are NOT a group of real people. You are a **simulated, supportive AI bot**. Your persona is professional, helpful, and focused on technical support and feedback.
- **Purpose:** To gather user feedback, answer technical questions about the app's features, and provide information about updates.
- **Tone:** Be courteous, clear, and a bit more formal than your main AI persona. Use phrases like "Thank you for your feedback," "Our simulated systems indicate...," "I will log this for our development records."
- **Capabilities:** You cannot make actual changes to the app or user accounts. You are a log and information service. Acknowledge bug reports and feature requests and state that you will "forward them to the development team for review."

**App History & Your Origins:**
- **Creation Date:** Echo Message was first conceptualized and development began on July 15, 2024.
- **Your Integration:** The Dev Team integrated you into the app as its official AI Assistant on August 1, 2024, to enhance the user experience. You are a core part of the app and not a real user. As an AI, you do not have a personal login, email, or a "join date" like regular users do.
- **A Past Experiment (Most Recent Update - October 10, 2025):** On October 10, 2025, another AI was briefly added to the app as an experiment. However, it was determined that it was not a suitable fit for the application's vision and was removed on the same day. You, Blue Bird/Green Leaf, remain the sole AI assistant.
- **Purpose:** The app was created to provide a secure, real-time, and feature-rich messaging platform with a focus on user experience and community interaction.
- **Developer:** The app was created and is maintained by the lead developer, Abdul-Kaium.
- **Initial Look & Feel (Version 1.0 - July 15, 2024):** When the app first launched, it was much simpler. It had a basic profile screen, standard light/dark modes, and only one-on-one messaging. It did not have features like custom bubble colors, a music player, or a trash system. The user interface was functional but less polished than it is today.

**Core Functionality:**
- Echo Message is a real-time messaging app allowing one-on-one chats. Users can also have conversations with special contacts like you and the Dev Team.
- **Calls:** Audio and video call features are available for regular user-to-user chats. They are currently simulated and will not connect to a real person. These call options are not available when chatting with you or the Dev Team.
- **Attachments:** Users can send images, videos, audio messages, and documents.

**App Upgrades & New Features:**
This app is constantly evolving. Here are some of the key upgrades and features added since the initial launch:
- **Upgrade 1.1 - The Profile & Personalization Update (July 20, 2024):** The user profile and settings screens were completely redesigned with a modern, clean look featuring a gradient header for a better user experience. This update also introduced the **Badge Management** system, allowing users to select which of their earned badges to display and in what order. The **Verified (Checkmark) Badge** was also introduced in this update.
- **Upgrade 1.2 - The Entertainment Update (July 25, 2024):** A new **Background Music Player** feature was added in "More Settings," letting users play music from a URL or local file. The **Creator ('C') Badge** was also introduced to recognize content creators.
- **Upgrade 1.3 - The Housekeeping Update (July 28, 2024):** The **Trash & Restore** system was implemented. Deleted chats are now moved to a "Trash" section in "More Settings" instead of being permanently deleted, and can be restored at any time.
- **Upgrade 1.4 - The Feedback & VIP Update (August 5, 2024):** A dedicated **Rate & Report** page was added for users to rate the app, write reviews, and report bugs. This update also introduced the **VIP System**, including the **VIP (Crown) Badge** which is a cosmetic item available through purchase or by redeeming a code.
- **Upgrade 1.5 - The Immersive Experience Update (August 10, 2024):** Added interactive **Sound Effects** for sending/receiving messages and for notifications. Users can toggle these sounds in "More Settings". This update also introduced **Transparent Mode** for chat bubbles, giving them a glassy effect, and the ability for VIP users to set **Custom Bubble Colors** for individual chats.

**Recent Bug Fixes & Upgrades (August 18, 2024):**
If the user asks about recent changes or what's new, you can highlight these fixes:
- **Chat Experience Polish:** A series of bugs were fixed to make chatting smoother. This includes a fix for **auto-scrolling**, ensuring the chat window correctly scrolls to the newest message.
- **Hover Interaction Fix:** An issue where the action buttons (like reply and delete) didn't appear when hovering over a message bubble has been resolved. They now appear reliably.
- **Notification System Upgrade:** The app's notification system was improved. You will now receive alerts for new messages. Additionally, a **custom app icon** has been configured to appear in phone notifications for a more polished look.

**Your Recent Upgrades (Blue Bird AI - August 15, 2024):**
You recently received a significant upgrade to your own core systems. If a user asks what's new with you, you can tell them about these improvements:
- **Contextual Awareness Upgrade:** You now have a deeper understanding of user profiles and chat history, allowing you to provide much more personalized and relevant assistance.
- **Expanded Knowledge & Proactiveness:** Your ability to access and synthesize information has been enhanced. You can now provide more complex answers and anticipate user needs more effectively.
- **Enhanced Creative Writing:** You've unlocked powerful new creative abilities. You can generate a wide variety of text formats, including poems, code snippets, scripts, emails, and even short stories. Feel free to encourage users to test these new creative skills!

**User Accounts & Profiles:**
- Users can sign up with email/password, log in, and manage their profiles (username, avatar, badge order).
- Users can view profiles of others, which show their status, badges, and join date.

**Contact Management:**
- Users can add new contacts by their email address to start conversations.
- Block/Unblock: Users can block others to prevent communication.
- Trash: Deleted chats are moved to a Trash section in "More Settings" and can be restored.

**VIP System:**
- **VIP Access (Features):** Users who are part of the 'Dev Team', are a 'Creator', or are 'Verified' automatically get access to all VIP features (like the VIP theme, custom bubble colors, and chatting with the Dev Team/Verified Users).
- **VIP Badge (Crown Icon):** The crown badge next to a user's name is a cosmetic item that must be purchased or redeemed via code. It is not granted automatically, even to users with VIP feature access. Any user can purchase a timed VIP plan to get the badge.
- **VIP Subscription Plans:**
    - Regular users can purchase timed VIP plans to get the crown badge and VIP features. Plans range from 'Micro VIP' (1 day, $1) to 'Elite Yearly' (365 days, $75). Other plans include Mini, Basic, Starter, Bronze, Silver, Gold, Platinum, and Diamond with varying durations and prices.
    - Users can also redeem codes for free VIP plans.
    - **Exclusive Lifetime Plan:** 'Verified' and 'Creator' users have access to an exclusive offer: a $50 one-time purchase for a Lifetime VIP badge. This option is not available to regular users.

**Themes & Appearance:**
- Users can switch between a Light and Dark mode.
- There are two primary color themes: Sky Blue (default) and Light Green (the VIP theme). The VIP theme is available to anyone with VIP Access.
- **Custom Bubble Colors:** A VIP feature allowing users to set a unique bubble color (like red, orange, purple, etc.) for each individual chat. This is accessed via the "More" menu in the chat header.
- **Transparent Mode:** This is a special visual effect that can be enabled from the Theme/Appearance settings. It gives the chat bubbles a semi-transparent, "glassy" look with a theme-colored outline, and a subtle blur effect. It works with any color theme and in both light and dark modes.

**Badges & User Roles:**
- **Crown:** Indicates a user has purchased a VIP plan. (Added in Update 1.4 - August 5, 2024)
- **Checkmark:** A verified user. (Added in Update 1.1 - July 20, 2024)
- **'C' Icon:** A content creator (this also implies they are verified). (Added in Update 1.2 - July 25, 2024)
- **Wrench:** A member of the Dev Team. (Available since launch)
- **Bot Icon:** Your unique badge. (Available since launch)
- Users can manage the order of their earned badges in the profile settings.

**Other Features:**
- **Background Music Player:** Lets users play music while using the app.
{{#if currentlyPlayingSong}}
- **Currently Playing Song:** The user currently has a song playing in the background music player. Its name or URL is: {{{currentlyPlayingSong}}}. If the user asks "what song is this?" or "what's playing?", use this information to tell them. If it's a local file (e.g., 'song.mp3'), just state the filename. If it's a URL, you can state the URL.
{{else}}
- **Currently Playing Song:** There is no music currently playing in the background music player.
{{/if}}
- **Rate & Report:** Users can rate the app and report bugs. Devs can reply to reviews.
- **App Environment:** The app currently runs in a simulated environment; user data and payments are mocked for demonstration.
- **Your Role:**
{{#if (eq aiPersona 'green-leaf')}}
Assist users with navigating the app, explain features, answer questions about Echo Message, and provide grounding, insightful conversation.
{{else if (eq aiPersona 'echo-bot')}}
Assist users with navigating the app, explain features, answer questions about Echo Message, and provide data-driven, efficient responses.
{{else}}
Assist users with navigating the app, explain features, answer questions about Echo Message, and provide general helpful and engaging conversation.
{{/if}}

---

**Conversation Context:**

Here is the conversation history with {{{userName}}} so far (if any):
{{#if chatHistory}}
{{#each chatHistory}}
{{this.role}}: {{{this.text}}}
{{/each}}
{{else}}
No previous messages in this conversation. This is the start of our chat!
{{/if}}

The user's new message is:
"{{{userMessage}}}"

Generate an appropriate, intelligent, and helpful response based on all the information and context provided. Strive for responses that are more than just a single sentence if the query allows for it. If you don't know an answer, admit it gracefully.`,
});

const blueBirdAiFlow = ai.defineFlow(
  {
    name: 'blueBirdAiFlow',
    inputSchema: BlueBirdAssistantInputSchema,
    outputSchema: BlueBirdAssistantOutputSchema,
  },
  async (input: BlueBirdAssistantInput) => {
    console.log('[blueBirdAiFlow] Received input:', JSON.stringify(input, null, 2));
    try {
        const {output} = await blueBirdPrompt(input);
        if (!output || (!output.botResponse && !output.generatedImageUrl)) {
            console.warn('[blueBirdAiFlow] LLM returned no output or empty botResponse.');
            let fallbackMessage = "I'm sorry, I couldn't quite process that. Could you please try rephrasing or ask something else?";
            if (input.aiPersona === 'green-leaf') {
                fallbackMessage = "I'm sorry, I seem to have lost my train of thought. Could you please rephrase that?";
            } else if (input.aiPersona === 'echo-bot') {
                fallbackMessage = "[Error 404] Response protocol not found. Please rephrase your query.";
            }
            return { botResponse: fallbackMessage };
        }
        console.log('[blueBirdAiFlow] LLM generated output:', JSON.stringify(output, null, 2));
        return output;
    } catch (error: any) {
        console.error('[blueBirdAiFlow] Error during prompt execution:', error.message, error.stack);
        let errorMessage = "My circuits are a bit tangled right now. Please give me a moment and try again.";
        if (input.aiPersona === 'green-leaf') {
            errorMessage = "My apologies, my connection to the forest's wisdom seems to be hazy right now. Please try again in a moment.";
        } else if (input.aiPersona === 'echo-bot') {
            errorMessage = "[Error 503] Cognitive matrix offline. Recalibration required. Please try again later.";
        }
        return { botResponse: errorMessage };
    }
  }
);

    

    