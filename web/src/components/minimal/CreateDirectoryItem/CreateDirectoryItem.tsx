import { useContext, useEffect } from "react";
import ExplorerContext from "../../../utils/ExplorerContext";
import { AiOutlineFileAdd, AiOutlineFolderAdd } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import { useState } from "react";

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <kbd className="ml-1 inline-flex items-center gap-0.5 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/70">
        {children}
    </kbd>
)

const CreateDirectoryItem: React.FC = () => {
    const { createItem, path, showCreateItemMenu, setShowCreateItemMenu } = useContext(ExplorerContext)
    const [itemName, setItemName] = useState<string>("")
    const [isDirectory, setIsDirectory] = useState<boolean>(true)

    useEffect(() => {
        setItemName("");
    }, [showCreateItemMenu])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return
        if (itemName.trim() === "") return
        const dir = !itemName.includes(".")
        setShowCreateItemMenu?.(false)
        createItem(path, dir, itemName)
    }

    return showCreateItemMenu && (
        <section className='bg-black fixed inset-0 flex items-center justify-center w-full bg-opacity-60 z-30 animate-in fade-in duration-200'>
            <div className='flex flex-col bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200'>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Create New Item</h2>
                        <p className="text-sm text-slate-400 mt-1">Enter a name for your file or folder</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowCreateItemMenu?.(false)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white"
                        aria-label="Close"
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Input Field */}
                <div className="mb-6">
                    <label htmlFor="itemName" className="text-slate-300 text-sm font-medium pl-1 mb-2 block">
                        Item Name
                    </label>
                    <input
                        id="itemName"
                        type="text"
                        className='bg-slate-700 border border-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-lg w-full px-4 py-3 text-white placeholder-slate-400 transition-all outline-none'
                        placeholder='example.txt or my-folder'
                        value={itemName}
                        onChange={(e) => {
                            setItemName(e.target.value)
                            setIsDirectory(!e.target.value.includes("."))
                        }}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        autoFocus
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    {itemName !== "" && (
                        <div className="flex gap-3">
                            {/* Create File */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateItemMenu?.(false)
                                    createItem(path, false, itemName)
                                }}
                                className={
                                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-colors active:scale-[0.98] " +
                                    (!isDirectory
                                        ? "bg-emerald-700 text-white hover:bg-emerald-600"
                                        : "bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200")
                                }
                            >
                                <AiOutlineFileAdd size={20} />
                                <span>Create File</span>
                                {!isDirectory && <Kbd>↵</Kbd>}
                            </button>

                            {/* Create Folder */}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateItemMenu?.(false)
                                    createItem(path, true, itemName)
                                }}
                                className={
                                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-colors active:scale-[0.98] " +
                                    (isDirectory
                                        ? "bg-sky-600 text-white hover:bg-sky-600"
                                        : "bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200")
                                }
                            >
                                <AiOutlineFolderAdd size={20} />
                                <span>Create Folder</span>
                                {isDirectory && <Kbd>↵</Kbd>}
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        className='w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-slate-600 active:scale-[0.98]'
                        onClick={() => setShowCreateItemMenu?.(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </section>
    )
}

export default CreateDirectoryItem