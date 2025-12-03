// src/services/storage.ts
import { ref, uploadString, getDownloadURL, type FirebaseStorage } from 'firebase/storage';

/**
 * Uploads a base64 encoded image string to Firebase Storage.
 *
 * @param storage - The Firebase Storage instance.
 * @param userId - The UID of the user uploading the avatar.
 * @param dataUrl - The image encoded as a data URL (e.g., "data:image/png;base64,...").
 * @returns Promise<string> - The downloadable URL of the uploaded image.
 */
export const uploadAvatar = async (storage: FirebaseStorage, userId: string, dataUrl: string): Promise<string> => {
  if (!storage) {
    console.error("Firebase Storage is not initialized. Using placeholder.");
    // Return a placeholder but don't throw, to allow mock mode to function
    return `https://picsum.photos/seed/${userId}/200`;
  }
  
  if (!dataUrl.startsWith('data:image')) {
    console.error("[uploadAvatar] Invalid data URL format. It must include the data URI prefix.", dataUrl.substring(0, 30) + "...");
    throw new Error("Invalid image format provided for upload.");
  }
  
  const fileType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
  const extension = fileType.split('/')[1];
  const storageRef = ref(storage, `avatars/${userId}/profile.${extension}`);

  try {
    // 'data_url' is the correct format string for Firebase v9+ when using uploadString with a Data URL.
    const uploadResult = await uploadString(storageRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    console.log(`[uploadAvatar] Upload successful for ${userId}. URL: ${downloadUrl}`);
    return downloadUrl;
  } catch (error) {
    console.error(`[uploadAvatar] Error uploading avatar for ${userId}:`, error);
    throw new Error("Could not upload avatar. Please try again.");
  }
};
