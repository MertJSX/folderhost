import { type ContextMenuType } from "./ContextMenuType.js"
import React from "react"
import { type DirectoryItem } from "./DirectoryItem.js"
import { type AccountPermissions } from "./AccountPermissions.js"
export interface ExplorerContextType {
        path: string,
        setPath: React.Dispatch<React.SetStateAction<string>>,
        readDir: Function,
        error: string,
        response: string,
        setShowDisabled: React.Dispatch<React.SetStateAction<boolean>>,
        directory: DirectoryItem[],
        setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>>,
        itemInfo: DirectoryItem | null,
        setItemInfo: React.Dispatch<React.SetStateAction<DirectoryItem | null>>,
        isEmpty: boolean,
        moveItem: Function,
        getParent: Function,
        directoryInfo: DirectoryItem | null,
        downloading: boolean,
        unzipping: boolean,
        waitingResponse: boolean,
        permissions: AccountPermissions | null,
        unzipProgress: string,
        createCopy: Function,
        startUnzipping: Function,
        createItem: Function,
        deleteItem: Function,
        renameItem: Function,
        downloadFile: Function,
        contextMenu: ContextMenuType,
        setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuType>>,
        setMessageBoxMsg: React.Dispatch<React.SetStateAction<string>>,
        setError: React.Dispatch<React.SetStateAction<string>>,
        setRes: React.Dispatch<React.SetStateAction<string>>,
        showDisabled: boolean,
        downloadProgress: number,
        scrollIndex: React.MutableRefObject<number>,
        isDirLoading: boolean,
        showCreateItemMenu: boolean,
        setShowCreateItemMenu: React.Dispatch<React.SetStateAction<boolean>>,
        showRenameItemMenu: boolean,
        setShowRenameItemMenu: React.Dispatch<React.SetStateAction<boolean>>,
        disableCaching: boolean,
        setDisableCaching: React.Dispatch<React.SetStateAction<boolean>>,
        startZipping: Function,
        zipProgress: string,
        zipping: boolean,
        setShowFileViewer: React.Dispatch<React.SetStateAction<boolean>>,
        showUploadMenu: boolean,
        setShowUploadMenu: React.Dispatch<React.SetStateAction<boolean>>,
        selectedItems: DirectoryItem[];
        setSelectedItems: (items: DirectoryItem[] | ((prev: DirectoryItem[]) => DirectoryItem[])) => void;
        clearSelection: () => void;
        bulkDelete: () => Promise<void>;
        bulkCopy: () => Promise<void>;
        bulkMove: (targetPath: string) => Promise<void>;
        isBulkActionLoading: boolean;
        showShareModal: boolean;
        setShowShareModal: React.Dispatch<React.SetStateAction<boolean>>;
}