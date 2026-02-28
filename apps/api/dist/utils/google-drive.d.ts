export declare function uploadFile(fileName: string, mimeType: string, fileContent: Buffer): Promise<string>;
export declare function downloadFile(fileId: string): Promise<Buffer>;
export declare function deleteFile(fileId: string): Promise<void>;
export declare function getFileMetadata(fileId: string): Promise<{
    id: string;
    name: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    size: string;
}>;
export declare function listFiles(folderIds?: string[]): Promise<any[]>;
export declare function testDriveAccess(): Promise<boolean>;
//# sourceMappingURL=google-drive.d.ts.map