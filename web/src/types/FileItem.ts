export interface FileItem {
    id: string;
    file: File;
    progress: number;       // 0-100
    loaded: number;         // byte
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
    startedAt?: number;     // ms timestamp
    speed?: number;         // byte/s
}