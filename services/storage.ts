
// src/services/storage.ts

/**
 * Simulates uploading an avatar file (File object or base64 string).
 *
 * @param userId - The UID of the user uploading the avatar.
 * @param fileOrBase64 - The image as a File object or a base64 data URI.
 * @param fileType - The MIME type of the file (e.g., 'image/png').
 * @returns Promise<string> - A base64 data URI for the uploaded image.
 */
export const uploadAvatar = async (userId: string, fileOrBase64: File | string, fileType: string = 'image/png'): Promise<string> => {
  console.log(`[uploadAvatar] Called for userId: ${userId}`);

  // If it's already a base64 string, return it after a delay.
  if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image')) {
    console.log(`[uploadAvatar] Input is already a data URI. Simulating upload.`);
    await new Promise(resolve => setTimeout(resolve, 300));
    return fileOrBase64;
  }

  // If it's a File object, convert it to a base64 data URI.
  if (fileOrBase64 instanceof File) {
    console.log(`[uploadAvatar] Input is a File object. Converting to data URI.`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          console.log(`[uploadAvatar] Conversion successful.`);
          resolve(result);
        } else {
          reject(new Error("Failed to read file as data URI."));
        }
      };
      reader.onerror = (error) => {
        console.error("[uploadAvatar] Error reading file:", error);
        reject(new Error("Error reading file."));
      };
      reader.readAsDataURL(fileOrBase64);
    });
  }

  // Fallback for invalid input
  console.error("[uploadAvatar] Invalid input provided. Expected a File object or a data URI string.");
  throw new Error("Invalid file format for avatar upload.");
};

