import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { FiLock, FiDownload, FiAlertCircle, FiUser, FiClock, FiDownloadCloud } from 'react-icons/fi'
import moment from 'moment'
import { type Shared } from '../../types/Shared'
import { DirectoryItemIcon } from '../../utils/DirectoryItemIcon'
import { type DirectoryItem } from '../../types/DirectoryItem'
import LoadingComponent from '../../components/LoadingComponent/LoadingComponent'

const SharePage = () => {
    const { id } = useParams()
    const [shared, setShared] = useState<Shared | null>(null)
    const [hasPassword, setHasPassword] = useState(false)
    const [passwordInput, setPasswordInput] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)

    useEffect(() => {
        const fetchShared = async () => {
            try {
                const res = await axios.get((import.meta.env.VITE_API_BASE_URL || "") + `/shared/${id}`)
                setShared(res.data.shared)
                setHasPassword(res.data.hasPassword)
            } catch (err: any) {
                setError(err.response?.data?.err || "Failed to load shared file.")
            } finally {
                setLoading(false)
            }
        }
        if (id) fetchShared()
    }, [id])

    const handleDownload = async () => {
        setError("")
        setDownloading(true)
        try {
            const res = await axios.post((import.meta.env.VITE_API_BASE_URL || "") + `/shared/${id}/download`, {
                password: passwordInput
            })
            window.location.href = (import.meta.env.VITE_API_BASE_URL || "") + `/download?id=${res.data.id}`

            setShared(prev => prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : prev)
        } catch (err: any) {
            setError(err.response?.data?.err || "Failed to download.")
        } finally {
            setDownloading(false)
        }
    }

    useEffect(() => {
        if (shared) {
            document.title = `${shared.displayName} - folderhost`
        } else {
            document.title = `folderhost`
        }
        return () => {
            document.title = `folderhost`
        }
    }, [shared])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <LoadingComponent />
            </div>
        )
    }

    if (error && !shared) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl max-w-md w-full flex flex-col items-center text-center">
                    <FiAlertCircle className="text-red-500 mb-4" size={48} />
                    <h1 className="text-2xl font-bold text-white mb-2">Unavailable</h1>
                    <p className="text-gray-400">{error}</p>
                </div>
            </div>
        )
    }

    if (!shared) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="text-white">Could not find shared file information.</div>
            </div>
        )
    }


    const fileExtension = shared.fileExtension || (shared.displayName?.includes('.') ? shared.displayName.split('.').pop()?.toUpperCase() : "FILE");

    const mockItemInfo = {
        name: `${shared.displayName}.${shared.fileExtension}`,
        path: shared.path || "",
        isDirectory: false,
    } as unknown as DirectoryItem;

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">

                {/* Left Panel: File Icon & Name */}
                <div className="w-full md:w-5/12 bg-slate-800/50 p-8 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-700">
                    <div className="mb-6 flex items-center justify-center">
                        <DirectoryItemIcon itemInfo={mockItemInfo} logoSize={100} />
                    </div>

                    <h1 className="text-2xl font-bold text-white text-center break-words w-full px-2 mb-4">
                        {shared.displayName}
                    </h1>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 bg-slate-700 px-3 py-1 rounded">
                            {fileExtension}
                        </span>
                    </div>
                </div>

                {/* Right Panel: Details & Action */}
                <div className="w-full md:w-7/12 p-8 flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-700 pb-2">
                            Overview
                        </h2>

                        <div className="flex flex-col gap-4 mb-8">
                            <div className="flex items-center gap-4 text-slate-300">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                    <FiUser size={20} className="text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Shared By</span>
                                    <span className="font-medium text-slate-200">{shared.username || "Unknown"}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-300">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                    <FiClock size={20} className="text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Shared On</span>
                                    <span className="font-medium text-slate-200">{moment(shared.created_at).format('MMMM Do YYYY')}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-slate-300">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                    <FiDownloadCloud size={20} className="text-slate-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Downloads</span>
                                    <span className="font-medium text-slate-200">{shared.downloadCount} {shared.downloadCount === 1 ? 'time' : 'times'}</span>
                                </div>
                            </div>

                            {shared.expires_at && (
                                <div className="flex items-center gap-4 text-slate-300">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-500`}>
                                        <FiAlertCircle size={20} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Status</span>
                                        <span className={`font-medium ${moment().isAfter(shared.expires_at) ? 'text-red-400' : 'text-amber-400'}`}>
                                            {moment().isAfter(shared.expires_at) ? 'Expired' : 'Expires'} {moment(shared.expires_at).fromNow()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-6 border-t border-slate-700">
                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20 text-center font-medium flex items-center justify-center gap-2">
                                <FiAlertCircle className="shrink-0" /> {error}
                            </div>
                        )}

                        {hasPassword && (
                            <div className="mb-6 space-y-3">
                                <div className="text-left mb-2 pl-1">
                                    <h3 className="text-slate-200 text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                                        <FiLock className="text-sky-400" /> Password Required
                                    </h3>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                                        <FiLock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        placeholder="Enter password..."
                                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-500 font-medium"
                                        onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleDownload}
                            disabled={downloading || (hasPassword && !passwordInput)}
                            className="w-full flex justify-center items-center gap-3 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 transition-colors text-white font-bold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {downloading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <FiDownload size={22} />
                                    Download File
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SharePage
