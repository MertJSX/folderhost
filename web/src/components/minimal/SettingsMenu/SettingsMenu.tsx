import { useContext, useEffect } from "react";
import ExplorerContext from "../../../utils/ExplorerContext";
import { IoSettingsSharp } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { useState } from "react";
import SwitchToggle from "../SwitchToggle/SwitchToggle";
import Cookies from "js-cookie";

interface SettingsMenuProps {
    isOpen: boolean,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, setIsOpen }) => {
    const { showDisabled, setShowDisabled, disableCaching, setDisableCaching, readDir } = useContext(ExplorerContext)
    const [folderSizeMode, setFolderSizeMode] = useState(Cookies.get("mode") == "Quality mode" ? true : false)

    useEffect(() => {
        Cookies.set("mode", folderSizeMode ? "Quality mode" : "Optimized mode", {
            expires: 7
        })
        readDir()
    }, [folderSizeMode])

    return isOpen && (
        <section
            className='bg-black fixed inset-0 flex items-center justify-center w-full bg-opacity-60 z-30 animate-in fade-in duration-200'
            onClick={() => setIsOpen(false)}
        >
            <div
                className='flex flex-col bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200'
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-white"><IoSettingsSharp />Settings</h2>
                        <p className="text-sm text-slate-400 mt-1">Choose your personal settings for the Explorer</p>
                    </div>
                    <button
                        className="p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white"
                        aria-label="Close"
                        onClick={() => { setIsOpen(prev => !prev) }}
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Input Field */}
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center justify-between p-2 rounded transition-colors bg-gray-700">
                        <div className="flex flex-col">
                            <span className="text-white text-md">Show Disabled</span>
                            <span className="text-gray-300 text-xs">Shows options that you can't do.</span>
                        </div>
                        <SwitchToggle checked={showDisabled} onChange={() => {
                            Cookies.set("show-disabled", `${!showDisabled}`, {
                                expires: 7
                            });
                            setShowDisabled((prev) => (!prev))
                        }} />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded transition-colors bg-gray-700">
                        <div className="flex flex-col max-w-[80%]">
                            <span className="text-white text-md">Show folder size</span>
                            <span className="text-gray-300 text-xs">Bad performance, if it's not cached.</span>
                        </div>
                        <SwitchToggle checked={folderSizeMode} onChange={() => {
                            setFolderSizeMode((prev) => (!prev))
                        }} />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded transition-colors bg-gray-700">
                        <div className="flex flex-col max-w-[80%]">
                            <span className="text-white text-md">Disable caching</span>
                            <span className="text-gray-300 text-xs">If you disable caching, you will get the real updated folder information. Other clients won't be able to see the update if you make a change to current folder without refreshing. It's good for performance to use caching.</span>
                        </div>
                        <SwitchToggle checked={disableCaching} onChange={() => {
                            Cookies.set("disable-caching", `${!disableCaching}`, {
                                expires: 7
                            });
                            setDisableCaching((prev) => (!prev))
                        }} />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default SettingsMenu