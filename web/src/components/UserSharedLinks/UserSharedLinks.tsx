import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { type Shared } from '../../types/Shared';
import { FaLink, FaTrash, FaLock } from 'react-icons/fa';
import moment from 'moment';

interface UserSharedLinksProps {
    username: string;
}

const UserSharedLinks: React.FC<UserSharedLinksProps> = ({ username }) => {
    const [sharedLinks, setSharedLinks] = useState<Shared[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const fetchSharedLinks = useCallback(() => {
        setIsLoading(true);
        axiosInstance.get(`/users/${username}/shared`)
            .then(res => {
                setSharedLinks(res.data.records || []);
                setError('');
            })
            .catch(err => {
                setError(err.response?.data?.err || 'Failed to fetch shared links');
            })
            .finally(() => setIsLoading(false));
    }, [username]);

    useEffect(() => {
        if (username) {
            fetchSharedLinks();
        }
    }, [username, fetchSharedLinks]);

    const handleDelete = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this shared link?")) return;

        axiosInstance.delete(`/shareds/${id}`)
            .then(() => {
                fetchSharedLinks();
            })
            .catch(err => {
                alert(err.response?.data?.err || 'Failed to delete');
            });
    };

    if (isLoading) return <div className="text-gray-400 mt-4">Loading shared links...</div>;
    if (error) return <div className="text-red-400 mt-4">{error}</div>;

    return (
        <div className="mt-8 space-y-4">
            <h2 className="text-xl text-white font-semibold flex items-center gap-2">
                <FaLink className="text-sky-400" /> Active Shared Links ({sharedLinks.length})
            </h2>

            {sharedLinks.length === 0 ? (
                <div className="text-gray-400 p-4 bg-gray-700/50 rounded-lg text-center">
                    This user has no active shared links.
                </div>
            ) : (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                    {sharedLinks.map(link => (
                        <div key={link.id} className="flex bg-gray-700 rounded-lg border border-gray-600 overflow-hidden">
                            <div className="flex-1 min-w-0 p-4 pr-2">
                                <div className="text-sky-300 font-medium truncate mb-1" title={link.displayName || link.path}>
                                    {link.displayName || link.path.split('/').pop()} {link.fileExtension && <span className="text-gray-400 text-xs ml-1 bg-gray-800 px-2 py-0.5 rounded uppercase">{link.fileExtension}</span>}
                                </div>
                                <div className="text-xs text-gray-400 truncate mb-2" title={link.path}>
                                    Path: {link.path}
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                                    <span>
                                        Downloads: {link.downloadCount}
                                    </span>
                                    <span>
                                        Created: {moment(link.created_at).format('DD MMM YYYY HH:mm')}
                                    </span>
                                    {link.expires_at && (
                                        <span className="text-sky-300">
                                            Expires: {moment(link.expires_at).format('DD MMM YYYY HH:mm')}
                                        </span>
                                    )}
                                    {link.password && (
                                        <span className="flex text-sky-300 items-center gap-1">
                                            <FaLock size={10} /> Password Protected
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(link.id)}
                                className="group flex items-center justify-center bg-sky-900/20 hover:bg-sky-600 text-sky-400 hover:text-white transition-all duration-300 w-12 hover:w-28 flex-shrink-0"
                                title="Remove Shared Link"
                            >
                                <FaTrash size={14} className="flex-shrink-0" />
                                <span className="overflow-hidden whitespace-nowrap max-w-0 group-hover:max-w-[65px] group-hover:ml-2 transition-all duration-300 opacity-0 group-hover:opacity-100 font-semibold">
                                    Remove
                                </span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserSharedLinks;
