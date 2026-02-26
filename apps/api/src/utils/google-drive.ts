import { google } from "googleapis";
import fs from "fs/promises";
import { config } from "../config.js";
import { logger } from "./logger.js";
import { AppError } from "./errors.js";

let driveClient: any = null;

async function initializeDrive() {
  if (driveClient) return driveClient;

  try {
    // Load service account credentials
    const credentialsPath = config.GOOGLE_APPLICATION_CREDENTIALS;
    const credentials = JSON.parse(await fs.readFile(credentialsPath, "utf-8"));

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    driveClient = google.drive({ version: "v3", auth });
    logger.info("Google Drive initialized successfully");
    return driveClient;
  } catch (error) {
    logger.error("Failed to initialize Google Drive", {
      error: (error as Error).message,
    });
    throw new AppError(500, "Google Drive initialization failed");
  }
}

export async function uploadFile(
  fileName: string,
  mimeType: string,
  fileContent: Buffer
): Promise<string> {
  const drive = await initializeDrive();

  try {
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
        parents: [config.GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: mimeType,
        body: fileContent,
      },
      fields: "id, name, createdTime, mimeType",
    });

    const fileId = response.data.id;
    logger.info("File uploaded to Google Drive", { fileName, fileId });
    return fileId;
  } catch (error) {
    logger.error("Failed to upload file to Google Drive", {
      error: (error as Error).message,
      fileName,
    });
    throw new AppError(500, "Failed to upload file to Google Drive");
  }
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = await initializeDrive();

  try {
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      { responseType: "stream" }
    );

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      response.data.on("data", (chunk: any) => {
        chunks.push(chunk);
      });
      response.data.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      response.data.on("error", (error: any) => {
        reject(error);
      });
    });
  } catch (error) {
    logger.error("Failed to download file from Google Drive", {
      error: (error as Error).message,
      fileId,
    });
    throw new AppError(500, "Failed to download file");
  }
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = await initializeDrive();

  try {
    await drive.files.delete({
      fileId: fileId,
    });
    logger.info("File deleted from Google Drive", { fileId });
  } catch (error) {
    logger.error("Failed to delete file from Google Drive", {
      error: (error as Error).message,
      fileId,
    });
    throw new AppError(500, "Failed to delete file");
  }
}

export async function getFileMetadata(
  fileId: string
): Promise<{
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
}> {
  const drive = await initializeDrive();

  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: "id, name, mimeType, createdTime, modifiedTime, size",
    });

    return response.data;
  } catch (error) {
    logger.error("Failed to get file metadata from Google Drive", {
      error: (error as Error).message,
      fileId,
    });
    throw new AppError(500, "Failed to get file metadata");
  }
}

export async function listFiles(folderIds?: string[]): Promise<any[]> {
  const drive = await initializeDrive();

  try {
    const query =
      folderIds && folderIds.length > 0
        ? `parents in ('${folderIds.join("','")}')`
        : "trashed = false";

    const response = await drive.files.list({
      q: query,
      fields: "files(id, name, mimeType, createdTime, modifiedTime, size)",
      pageSize: 100,
    });

    return response.data.files || [];
  } catch (error) {
    logger.error("Failed to list files from Google Drive", {
      error: (error as Error).message,
    });
    return [];
  }
}

export async function testDriveAccess(): Promise<boolean> {
  try {
    const drive = await initializeDrive();
    const response = await drive.files.list({
      q: `'${config.GOOGLE_DRIVE_FOLDER_ID}' in parents`,
      pageSize: 1,
      fields: "files(id)",
    });
    logger.info("Google Drive access test successful");
    return true;
  } catch (error) {
    logger.error("Google Drive access test failed", {
      error: (error as Error).message,
    });
    return false;
  }
}
