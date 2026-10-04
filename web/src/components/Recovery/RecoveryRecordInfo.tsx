import { useEffect, useState } from "react"
import { FaUndo, FaTrash, FaUser, FaCalendar, FaMapMarkerAlt, FaClock } from "react-icons/fa"
import moment from "moment";
import { type RecoveryRecord } from "../../types/RecoveryRecord";
import { DirectoryItemIcon } from "../../utils/DirectoryItemIcon";
import { getRemainingLifetime, getLifetimeColor } from "../../utils/recoveryLifetime";

interface RecoveryRecordInfoProps {
    recordInfo: RecoveryRecord,
    handleRecoverRecord: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
    handleDeleteRecord: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
    timeoutMs: number
}

const RecoveryRecordInfo: React.FC<RecoveryRecordInfoProps> = ({
    recordInfo,
    handleRecoverRecord,
    handleDeleteRecord,
    timeoutMs
}) => {
    const logoSize = 70;

    const [, setTick] = useState<number>(0);
    useEffect(() => {
        if (!timeoutMs || timeoutMs <= 0) return;
        const id = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(id);
    }, [timeoutMs, recordInfo.id]);

    const handleRemoveClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (!window.confirm("Are you sure you want to permanently remove this record? This action cannot be undone.")) {
            return;
        }
        handleDeleteRecord(event);
    };

    const remainingLifetime = getRemainingLifetime(recordInfo.created_at, timeoutMs, "long");
    const lifetimeColor = getLifetimeColor(recordInfo.created_at, timeoutMs, "text-sky-200");

    return recordInfo && (
        <article className="flex flex-col w-1/3 my-4 md:my-0 min-w-[380px] max-w-[450px] min-h-[600px] 2xl:min-h-[600px] h-[95vh] max-h-[800px]">
            <div className="flex flex-col bg-gray-800 gap-4 rounded-xl shadow-2xl w-full h-full p-2">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-4">
                    <div className="flex items-center justify-center mb-3 min-h-[70px]">
                        <DirectoryItemIcon
                            logoSize={logoSize}
                            itemInfo={{
                                isDirectory: recordInfo.isDirectory,
                                name: recordInfo.oldLocation.split('/').pop() || recordInfo.oldLocation,
                                path: recordInfo.oldLocation
                            } as any}
                        />
                    </div>
                    <h1 className="text-lg 2xl:text-xl font-bold text-sky-200 break-words w-full">
                        {recordInfo.oldLocation.split('/').pop() || recordInfo.oldLocation}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1 break-all">
                        {recordInfo.oldLocation}
                    </p>
                </div>

                {/* File Info Section */}
                <div className="flex flex-col gap-2 bg-gray-700 rounded-lg p-2 2xl:p-4">
                    {/* Size */}
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 font-medium">Size:</span>
                        <span className="text-yellow-300 font-bold text-base 2xl:text-lg">
                            {recordInfo.sizeDisplay}
                        </span>
                    </div>

                    {/* Deleted Date */}
                    <div className="flex items-center gap-3">
                        <FaCalendar className="text-gray-400" />
                        <div className="flex-1">
                            <span className="text-gray-300">Deleted:</span>
                            <div className="text-gray-400 text-sm">
                                {moment(recordInfo.created_at).format("HH:mm Do MMMM YYYY")}
                            </div>
                        </div>
                    </div>

                    {/* Remaining Lifetime — only shown if auto cleanup is enabled */}
                    {remainingLifetime && (
                        <div className="flex items-center gap-3">
                            <FaClock className="text-gray-400" />
                            <div className="flex-1">
                                <span className="text-gray-300">Auto-delete in:</span>
                                <div className={`${lifetimeColor} text-sm font-semibold`}>
                                    {remainingLifetime}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-gray-400 mt-1" />
                        <div className="flex-1">
                            <span className="text-gray-300">Current Location:</span>
                            <div className="text-sky-300 text-sm break-words">
                                {recordInfo.binLocation}
                            </div>
                        </div>
                    </div>

                    {/* Deleted By */}
                    <div className="flex items-center gap-3">
                        <FaUser className="text-gray-400" />
                        <div className="flex-1">
                            <span className="text-gray-300">Deleted by:</span>
                            <div className="text-green-300 text-sm">
                                {recordInfo.username}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 mt-auto">
                    <button
                        onClick={handleRecoverRecord}
                        className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FaUndo className="text-sm" />
                        Recover Item
                    </button>

                    <button
                        onClick={handleRemoveClick}
                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <FaTrash className="text-sm" />
                        Remove Permanently
                    </button>
                </div>

                {/* Warning Text */}
                <div className="text-xs text-gray-400 text-center mt-2">
                    Note: Removing items permanently cannot be undone
                </div>
            </div>
        </article>
    )
}

export default RecoveryRecordInfo