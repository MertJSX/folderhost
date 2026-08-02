import { FaUndo, FaTrash, FaUser, FaCalendar, FaMapMarkerAlt } from "react-icons/fa"
import moment from "moment";
import { type RecoveryRecord } from "../../types/RecoveryRecord";
import { DirectoryItemIcon } from "../../utils/DirectoryItemIcon";

interface RecoveryRecordInfoProps {
    recordInfo: RecoveryRecord,
    handleRecoverRecord: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
    handleDeleteRecord: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

const RecoveryRecordInfo: React.FC<RecoveryRecordInfoProps> = ({
    recordInfo,
    handleRecoverRecord,
    handleDeleteRecord
}) => {
    const logoSize = 70;

    const handleRemoveClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (!window.confirm("Are you sure you want to permanently remove this record? This action cannot be undone.")) {
            return;
        }
        handleDeleteRecord(event);
    };

    return recordInfo && (
        <article className="flex flex-col w-1/3 my-4 md:my-0 min-w-[380px] max-w-[450px] min-h-[600px] h-[700px] max-h-[800px]">
            <div className="flex flex-col bg-gray-800 gap-4 rounded-xl shadow-2xl w-full h-full p-6">
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
                    <h1 className="text-xl font-bold text-yellow-200 break-words w-full">
                        {recordInfo.oldLocation.split('/').pop() || recordInfo.oldLocation}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1 break-all">
                        {recordInfo.oldLocation}
                    </p>
                </div>

                {/* File Info Section */}
                <div className="flex flex-col gap-4 bg-gray-700 rounded-lg p-4">
                    {/* Size */}
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300 font-medium">Size:</span>
                        <span className="text-green-300 font-bold text-lg">
                            {recordInfo.sizeDisplay}
                        </span>
                    </div>

                    {/* Deleted Date */}
                    <div className="flex items-center gap-3">
                        <FaCalendar className="text-gray-400" />
                        <div className="flex-1">
                            <span className="text-gray-300">Deleted:</span>
                            <div className="text-gray-400 text-sm">
                                {moment(recordInfo.created_at).format("Do MMMM YYYY")}
                            </div>
                            <div className="text-gray-400 text-sm">
                                {moment(recordInfo.created_at).format("HH:mm")}
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-gray-400 mt-1" />
                        <div className="flex-1">
                            <span className="text-gray-300">Current Location:</span>
                            <div className="text-yellow-200 text-sm break-words">
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
                <div className="flex flex-col gap-3 mt-auto pt-4">
                    <button
                        onClick={handleRecoverRecord}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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