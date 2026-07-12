import { useContext, useEffect, useState } from 'react'
import ExplorerContext from '../../utils/ExplorerContext'
import { type ExplorerContextType } from '../../types/ExplorerContextType'
import { type Shared } from '../../types/Shared'
import axiosInstance from '../../utils/axiosInstance'
import { FiShare, FiX, FiLock, FiFile } from 'react-icons/fi'
import ShareFileComponentPreview from './ShareFileComponentPreview'
import moment from 'moment'
import LoadingComponent from '../LoadingComponent/LoadingComponent'

const ShareFileComponent = () => {
    const { showShareModal, setShowShareModal, itemInfo, path } = useContext<ExplorerContextType>(ExplorerContext)
    const [shared, setShared] = useState<Shared | null>(null)
    const [sharedFile, setSharedFile] = useState<boolean>(false)
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")
    const [lifetime, setLifetime] = useState<string>("never")
    const [expiresAt, setExpiresAt] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>("")
    const [success, setSuccess] = useState<string>("")

    useEffect(() => {
        if (showShareModal) {
            fetchShared()
        } else {
            resetState()
        }
    }, [showShareModal])



    const fetchShared = async () => {
        setError("")
        setSuccess("")
        setIsLoading(true)
        setSharedFile(false)
        setShared(null)

        if (!itemInfo) {
            setError("No file selected!")
            return
        }

        try {
            const fullPath = (path === "./") ? itemInfo.name : `${path}${itemInfo.name}`
            const response = await axiosInstance.get<Shared>(`/shared/${fullPath}`)
            setShared(response.data)
            setSharedFile(true)
            setName(response.data.displayName)
            setExpiresAt(response.data.expires_at || "")
            setLifetime(response.data.expires_at ? "custom" : "never")
            setPassword(response.data.password || "")
        } catch (error: any) {
            if (error.response?.status !== 404) {
                setError(error.response?.data?.err || "Error loading share status")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const createShared = async () => {
        setError("")
        setSuccess("")
        setIsLoading(true)
        setShared(null)
        setSharedFile(false)

        if (!itemInfo) {
            setError("No file selected!")
            return
        }

        let calculatedExpiresAt = expiresAt;
        if (lifetime !== "custom" && lifetime !== "never") {
            const num = parseInt(lifetime.slice(0, -1));
            const unit = lifetime.slice(-1) as moment.unitOfTime.DurationConstructor;
            calculatedExpiresAt = moment().add(num, unit).toISOString();
        } else if (lifetime === "never") {
            calculatedExpiresAt = "";
        }

        try {
            const fullPath = (path === "./") ? itemInfo.name : `${path}${itemInfo.name}`
            const response = await axiosInstance.post<{ response: string, shared: Shared }>(`/shared`, {
                shared: {
                    username: "MertJSX",
                    path: fullPath,
                    displayName: name || itemInfo.name,
                    password: password,
                    expires_at: calculatedExpiresAt,
                },
            })
            setShared(response.data.shared)
            setSharedFile(true)
            setSuccess("Shared successfully!")
        } catch (error: any) {
            setError(error.response.data.err)
        } finally {
            setIsLoading(false)
        }
    }

    const deleteShared = async () => {
        setError("")
        setSuccess("")
        setIsLoading(true)

        if (!itemInfo) {
            setError("No file selected!")
            return
        }

        try {
            const fullPath = (path === "./") ? itemInfo.name : `${path}${itemInfo.name}`
            await axiosInstance.delete(`/shared/${fullPath}`)
            setShared(null)
            setSharedFile(false)
            setSuccess("Deleted successfully!")
        } catch (error: any) {
            setError(error.response.data.err)
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
            document.body.prepend(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (error) {
                console.error(error);
            } finally {
                textArea.remove();
            }
        }
        setSuccess("Link copied to clipboard!");
    }

    const recreateShared = async () => {
        setError("")
        setSuccess("")
        setIsLoading(true)

        if (!shared || !itemInfo) {
            setError("No file selected!")
            return
        }

        let calculatedExpiresAt = expiresAt;
        if (lifetime !== "custom" && lifetime !== "never") {
            const num = parseInt(lifetime.slice(0, -1));
            const unit = lifetime.slice(-1) as moment.unitOfTime.DurationConstructor;
            calculatedExpiresAt = moment().add(num, unit).toISOString();
        } else if (lifetime === "never") {
            calculatedExpiresAt = "";
        }

        try {
            const fullPath = (path === "./") ? itemInfo.name : `${path}${itemInfo.name}`
            await axiosInstance.delete(`/shared/${fullPath}`)
            const response = await axiosInstance.post<{ response: string, shared: Shared }>(`/shared`, {
                shared: {
                    username: shared.username,
                    path: fullPath,
                    displayName: name || itemInfo.name,
                    password: password,
                    expires_at: calculatedExpiresAt,
                },
            })
            setShared(response.data.shared)
            setSharedFile(true)
            setSuccess("Recreated successfully!")
        } catch (error: any) {
            setError(error.response?.data?.err || "Failed to recreate shared link.")
        } finally {
            setIsLoading(false)
        }
    }

    const resetState = () => {
        setShared(null)
        setSharedFile(false)
        setName("")
        setPassword("")
        setLifetime("never")
        setExpiresAt("")
        setIsLoading(true)
        setError("")
        setSuccess("")
    }

    return (
        <div
            className="fixed inset-0 z-[5] flex items-center justify-center p-4"
            style={{ display: showShareModal ? "flex" : "none" }}
        >
            {/* Modal Overlay */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowShareModal(false)}
            />

            {/* Modal Container */}
            <div className="relative flex w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-2xl shadow-2xl z-10 animate-slide-up overflow-hidden">

                {/* Left Side: Preview (Hidden on small screens) */}
                <div className="hidden md:flex w-1/2 bg-gray-800/30 p-8 border-r border-gray-800 flex-col items-center justify-center relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none" />
                    <ShareFileComponentPreview
                        itemInfo={itemInfo}
                        displayName={name || itemInfo?.name || ""}
                        downloadCount={shared?.downloadCount || 0}
                        expiresAt={lifetime === "custom" ? expiresAt : (lifetime !== "never" ? moment().add(parseInt(lifetime.slice(0, -1)), lifetime.slice(-1) as moment.unitOfTime.DurationConstructor).toISOString() : "")}
                        hasPassword={password.length > 0}
                        sharedUser={shared?.username || localStorage.getItem("last_username") || "Unknown"}
                        createdAt={shared?.created_at || new Date().toISOString()}
                    />
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto">
                    {/* Close Button */}
                    <button
                        onClick={() => setShowShareModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20 bg-gray-900/50 rounded-full p-1"
                    >
                        <FiX size={24} />
                    </button>

                    {/* Modal Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            <FiShare size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Share File</h1>
                            <p className="text-sm text-gray-400">Generate a shareable link for this file</p>
                        </div>
                    </div>

                    {/* Loading Spinner */}
                    {isLoading && !sharedFile && !error && (
                        <div className="flex items-center justify-center py-8">
                            <LoadingComponent />
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm border border-red-500/30">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm border border-emerald-500/30">
                            {success}
                        </div>
                    )}

                    {/* Form Content - Show when loaded */}
                    {!isLoading && (
                        <div className="space-y-4">
                            {/* Readonly Target File */}
                            <div className="p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-700/50 text-gray-400 flex-shrink-0">
                                    <FiFile size={16} />
                                </div>
                                <div className="flex flex-col overflow-hidden w-full">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target File</span>
                                    <input
                                        type="text"
                                        readOnly
                                        value={(path === "./") ? itemInfo?.name : `${path}${itemInfo?.name}`}
                                        className="bg-transparent text-sm text-gray-300 w-full focus:outline-none truncate"
                                    />
                                </div>
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={itemInfo?.name}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-sky-500"
                                />
                            </div>

                            {/* Password (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password (Optional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiLock className="text-gray-400" size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Leave blank for no password"
                                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-sky-500"
                                    />
                                </div>
                            </div>

                            {/* Lifetime / Expires */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-300">
                                    Link Lifetime
                                </label>
                                <select
                                    value={lifetime}
                                    onChange={(e) => setLifetime(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-sky-500 appearance-none cursor-pointer"
                                >
                                    <option value="never">Forever (Never Expires)</option>
                                    <option value="5m">5 Minutes</option>
                                    <option value="30m">30 Minutes</option>
                                    <option value="1h">1 Hour</option>
                                    <option value="1d">1 Day</option>
                                    <option value="3d">3 Days</option>
                                    <option value="1w">1 Week</option>
                                    <option value="1M">1 Month</option>
                                    <option value="3M">3 Months</option>
                                    {lifetime === "custom" && <option value="custom">Custom Date</option>}
                                </select>
                            </div>



                            {/* Share Link - Only show if created */}
                            {sharedFile && shared && (
                                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                                    <label className="block text-sm font-medium text-sky-400 mb-2">Share Link</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${window.location.origin}/share/${shared.id}`}
                                            className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(`${window.location.origin}/share/${shared.id}`)}
                                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-8">
                                {!sharedFile ? (
                                    <button
                                        onClick={createShared}
                                        className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Share
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={recreateShared}
                                            className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            Recreate
                                        </button>
                                        <button
                                            onClick={deleteShared}
                                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ShareFileComponent