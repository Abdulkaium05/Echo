
// src/services/storage.ts

/**
 * Simulates uploading a base64 encoded image string.
 *
 * @param userId - The UID of the user uploading the avatar.
 * @param base64String - The image encoded as a base64 string (must include data URI prefix).
 * @param fileType - The MIME type of the file (e.g., 'image/png', 'image/jpeg').
 * @returns Promise<string> - The base64 string itself or a placeholder URL.
 */
export const uploadAvatar = async (userId: string, base64String: string, fileType: string = 'image/png'): Promise<string> => {
  console.log(`[uploadAvatar] Called for userId: ${userId}, fileType: ${fileType}`);

  if (!base64String.startsWith('data:image')) {
    console.error("[uploadAvatar] Invalid base64 string format. Missing data URI prefix.");
    return `https://picsum.photos/seed/${userId}-error/200`;
  }

  console.log(`[uploadAvatar] Simulating upload for ${userId}. Returning data URI.`);
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  return base64String;
};
