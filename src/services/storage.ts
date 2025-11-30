// src/services/storage.ts
import { ref, uploadString, getDownloadURL, type FirebaseStorage } from 'firebase/storage';

/**
 * Uploads a base64 encoded image string to Firebase Storage.
 *
 * @param storage - The Firebase Storage instance.
 * @param userId - The UID of the user uploading the avatar.
 * @param base64String - The image encoded as a base64 string (must include data URI prefix).
 * @returns Promise<string> - The downloadable URL of the uploaded image.
 */
export const uploadAvatar = async (storage: FirebaseStorage, userId: string, base64String: string): Promise<string> => {
  if (!storage) {
    console.error("Firebase Storage is not initialized. Using placeholder.");
    return `https://picsum.photos/seed/${userId}/200`;
  }
  
  if (!base64String.startsWith('data:image')) {
    console.error("[uploadAvatar] Invalid base64 string format. Missing data URI prefix.");
    throw new Error("Invalid image format.");
  }
  
  const fileType = base64String.substring(base64String.indexOf(':') + 1, base64String.indexOf(';'));
  const extension = fileType.split('/')[1];
  const storageRef = ref(storage, `avatars/${userId}/profile.${extension}`);

  try {
    const uploadResult = await uploadString(storageRef, base64String, 'data_url');
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    console.log(`[uploadAvatar] Upload successful for ${userId}. URL: ${downloadUrl}`);
    return downloadUrl;
  } catch (error) {
    console.error(`[uploadAvatar] Error uploading avatar for ${userId}:`, error);
    throw new Error("Could not upload avatar.");
  }
};
