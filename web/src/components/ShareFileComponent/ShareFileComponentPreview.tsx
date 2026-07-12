import { type DirectoryItem } from '../../types/DirectoryItem'
import { DirectoryItemIcon } from '../../utils/DirectoryItemIcon'
import { FiLock, FiGlobe } from 'react-icons/fi'
import moment from 'moment'

interface ShareFileComponentPreviewProps {
    itemInfo: DirectoryItem | null;
    displayName: string;
    downloadCount: number;
    expiresAt: string;
    hasPassword: boolean;
    sharedUser?: string;
    createdAt?: string;
}

const ShareFileComponentPreview = ({ itemInfo, displayName, downloadCount, expiresAt, hasPassword, sharedUser, createdAt }: ShareFileComponentPreviewProps) => {
    if (!itemInfo) return null;

    const fileExtension = itemInfo.name.includes('.') ? itemInfo.name.split('.').pop()?.toUpperCase() : "FILE";
    const timeAgo = createdAt ? moment(createdAt).fromNow() : "Just now";
    const isExpired = expiresAt && moment().isAfter(expiresAt);
    const expiresText = expiresAt ? (isExpired ? moment(expiresAt).fromNow() : moment(expiresAt).toNow(true) + " left") : "Never";

    return (
        <div className="flex flex-col bg-gray-800 rounded-2xl shadow-xl p-5 border border-gray-700/50 w-full max-w-[320px] relative min-h-[380px]">

            {/* Edges: Visibility Icons */}
            <div className="absolute top-5 left-5 flex items-center gap-2">
                <FiGlobe className="text-sky-500" size={18} title="Public" />
            </div>

            {/* Basic Info: Icon, Name, Size, Type */}
            <div className="flex flex-col items-center mt-10 mb-4">
                <div className="relative inline-block">
                    <DirectoryItemIcon itemInfo={itemInfo} logoSize={90} />
                    {hasPassword && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-700 rounded-full p-1.5 shadow-lg border border-gray-700/50">
                            <FiLock className="text-red-500" size={22} title="Password Protected" />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-white mt-4 mb-2 text-center break-words px-2" title={displayName || itemInfo.name}>
                    {displayName || itemInfo.name}
                </h1>

                {/* Size & Type */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-amber-400 tracking-wide">{itemInfo.size || "Unknown"}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-900/60 px-2 py-0.5 rounded">
                        {fileExtension}
                    </span>
                </div>
            </div>

            {/* Author Info */}
            <div className="flex items-center justify-center gap-1.5 mb-8">
                <span className="text-sm font-semibold text-gray-600">Author:</span>
                <span className="text-sm font-bold text-sky-400">{sharedUser || "Unknown"}</span>
            </div>

            {/* Footer: Downloads (Left) & Date (Right) */}
            <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-700/30">
                <div className="flex flex-col">
                    <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Downloads</span>
                    <span className="text-xs font-medium text-gray-400">
                        {downloadCount}
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
                        {expiresAt ? (isExpired ? "Expired" : "Expires") : "Shared"}
                    </span>
                    <span className={`text-xs ${expiresAt ? (isExpired ? 'text-red-500 font-bold' : 'text-amber-500 font-bold') : 'text-gray-400 font-medium'}`}>
                        {expiresAt ? expiresText : timeAgo}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ShareFileComponentPreview
