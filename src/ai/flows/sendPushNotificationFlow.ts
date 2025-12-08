
'use server';
/**
 * @fileOverview A Genkit flow for sending FCM push notifications.
 *
 * - sendPushNotification - A function that invokes the flow.
 * - PushNotificationInput - The input type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PushNotificationInputSchema = z.object({
    recipientTokens: z.array(z.string()).describe("An array of FCM device tokens for the recipient."),
    senderName: z.string().describe("The name of the message sender."),
    senderAvatar: z.string().describe("The URL of the sender's avatar image."),
    messageText: z.string().describe("The content of the message."),
    chatId: z.string().describe("The ID of the chat the message belongs to."),
});

export type PushNotificationInput = z.infer<typeof PushNotificationInputSchema>;

export async function sendPushNotification(input: PushNotificationInput): Promise<void> {
    try {
        await sendPushNotificationFlow(input);
    } catch (error) {
        console.error('[sendPushNotification] Error invoking flow:', error);
    }
}

const sendPushNotificationFlow = ai.defineFlow(
  {
    name: 'sendPushNotificationFlow',
    inputSchema: PushNotificationInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { recipientTokens, senderName, senderAvatar, messageText, chatId } = input;
    
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) {
        console.error("FCM Server Key is not configured. Cannot send push notification.");
        return;
    }
    
    if (!recipientTokens || recipientTokens.length === 0) {
        console.log("No FCM tokens provided. Skipping notification.");
        return;
    }

    // Notification payload with customizations for Blue Bird theme
    const notificationPayload = {
      notification: {
        title: "Echo Message", // App name as title
        body: `${senderName}: ${messageText}`, // Body shows sender and message
        icon: '/icon.png', // Main app icon
        badge: '/icon.png', // Custom badge for Android
        image: '/icon.png', // Image to show in notification
      },
      data: {
        url: `/chat/${chatId}`, // URL to open when notification is clicked
        chatId: chatId,
      },
    };

    for (const token of recipientTokens) {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${serverKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: token,
            ...notificationPayload,
          }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to send push notification to token ${token}. Status: ${response.status}`, errorData);
        } else {
            console.log(`Push notification sent successfully to token ${token}.`);
        }

      } catch (error) {
        console.error(`Exception when trying to send push notification to token ${token}:`, error);
      }
    }
  }
);
