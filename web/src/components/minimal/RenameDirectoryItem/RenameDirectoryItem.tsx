import { useContext, useEffect, useCallback } from "react";
import ExplorerContext from "../../../utils/ExplorerContext";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { useState } from "react";

const RenameDirectoryItem: React.FC = () => {
    const { renameItem, showRenameItemMenu, setShowRenameItemMenu, itemInfo } = useContext(ExplorerContext)
    const [itemName, setItemName] = useState<string>("")

    useEffect(() => {
        if (itemInfo?.name) {
            setItemName(itemInfo?.name);
        }
    }, [itemInfo])

    const handleEnterKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key !== 'Enter' || itemInfo?.id == -1) {
            return
        }
        if (itemName != itemInfo?.name && itemName != "") {
            setShowRenameItemMenu?.(false)
            renameItem(itemInfo, itemName)
        }
    }, [itemInfo, itemName]);

    useEffect(() => {
        window.addEventListener('keydown', handleEnterKeyDown);
        return () => {
            window.removeEventListener('keydown', handleEnterKeyDown);
        };
    }, [handleEnterKeyDown]);

    return showRenameItemMenu && (
        <section className='bg-black fixed inset-0 flex items-center justify-center w-full bg-opacity-60 z-30 animate-in fade-in duration-200'
            onClick={() => setShowRenameItemMenu?.(false)}>
            <div onClick={(e) => e.stopPropagation()} className='flex flex-col bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200'>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Rename {itemInfo?.name}</h2>
                        <p className="text-sm text-slate-400 mt-1">Enter a new name for your {itemInfo?.isDirectory ? "folder" : "file"}</p>
                    </div>
                    <button
                        onClick={() => setShowRenameItemMenu?.(false)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white"
                        aria-label="Close"
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Input Field */}
                <div className="mb-6">
                    <label htmlFor="itemName" className="text-slate-300 text-sm font-medium pl-1 mb-2 block">
                        Name
                    </label>
                    <input
                        id="itemName"
                        type="text"
                        className='bg-slate-700 border border-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-lg w-full px-4 py-3 text-white placeholder-slate-400 transition-all outline-none'
                        placeholder='example.txt or my-folder'
                        value={itemName}
                        onChange={(e) => {
                            setItemName(e.target.value)
                        }}
                        autoComplete="off"
                        autoFocus
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        {
                            itemName != itemInfo?.name && itemName != "" ?
                                <button
                                    className='flex gap-2 items-center justify-center flex-1 py-3 px-4 font-semibold rounded-lg transition-all bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white shadow-lg hover:shadow-sky-500/20'
                                    onClick={() => {
                                        setShowRenameItemMenu?.(false)
                                        renameItem(itemInfo, itemName)
                                    }}
                                >
                                    <MdDriveFileRenameOutline size={22} />
                                    Update
                                </button> :
                                <button
                                    className='flex gap-2 items-center justify-center flex-1 py-3 px-4 font-semibold rounded-lg transition-all bg-gray-600 opacity-60 text-white shadow-lg cursor-not-allowed'
                                    disabled
                                >
                                    <MdDriveFileRenameOutline size={22} />
                                    Update
                                </button>
                        }
                    </div>

                    <button
                        className='w-full py-3 px-4 font-semibold rounded-lg transition-all bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white active:scale-[0.98]'
                        onClick={() => setShowRenameItemMenu?.(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </section>
    )
}

export default RenameDirectoryItem