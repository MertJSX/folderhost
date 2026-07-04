import { useCallback, useEffect, useState } from "react"
import moment from "moment";
import axiosInstance from "../../utils/axiosInstance"
import { FaSync, FaSearch, FaCalendar, FaUser, FaPencilAlt, FaList } from "react-icons/fa";
import MessageBox from "../../components/minimal/MessageBox/MessageBox";
import type { AuditLog } from "../../types/AuditLog";
import { Link } from "react-router-dom";

const Logs: React.FC = () => {
    const [logs, setLogs] = useState<Array<AuditLog>>([]);
    const [filteredLogs, setFilteredLogs] = useState<Array<AuditLog>>([]);
    const [loadIndex, setLoadIndex] = useState<number>(1);
    const [isError, setIsError] = useState<boolean>(false);
    const [isEmpty, setIsEmpty] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string>("");
    const [usernameFilter, setUsernameFilter] = useState<string>("");
    const [dateFilter, setDateFilter] = useState<string>("");

    useEffect(() => {
        document.title = "Logs - folderhost"
        getLogs();
    }, []);

    useEffect(() => {
        let filtered = [...logs];

        if (usernameFilter && usernameFilter !== "all") {
            filtered = filtered.filter(log =>
                log.username.toLowerCase().includes(usernameFilter.toLowerCase())
            );
        }

        if (dateFilter) {
            filtered = filtered.filter(log =>
                moment(log.created_at).format("YYYY-MM-DD") === dateFilter
            );
        }

        setFilteredLogs(filtered);
    }, [logs, usernameFilter, dateFilter]);

    const getLogs = useCallback((reset: boolean = false) => {
        let page: number = reset ? 1 : loadIndex;
        if (loadIndex == 0 && !reset) {
            return;
        }

        setIsLoading(true);

        axiosInstance.get(`/logs?page=${page}`).then((data) => {
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
            if (!data.data.logs) {
                setIsEmpty(true);
                setLogs([]);
                setFilteredLogs([]);
                return;
            }

            if (data.data.isLast) {
                setLoadIndex(0);
            } else if (reset) {
                setLoadIndex(2);
            } else {
                setLoadIndex(loadIndex + 1);
            }

            if (!reset) {
                const newLogs = [...logs, ...data.data.logs];
                setLogs(newLogs);
                setFilteredLogs(newLogs);
                return
            }

            setLogs(data.data.logs);
            setFilteredLogs(data.data.logs);

        }).catch((error) => {
            setTimeout(() => {
                setIsLoading(false);
            }, 500);
            setLogs([])
            setIsError(true);
            setLoadIndex(0);

            if (error.response?.data?.err) {
                setMessage(error.response.data.err);
                return;
            }
            setMessage("Unknown error while trying to load logs.");
        });
    }, [loadIndex, logs]);

    const uniqueUsernames = Array.from(new Set(logs.map(log => log.username)));

    return (
        <div>
            {/* <Header /> */}
            <MessageBox message={message} isErr={isError} setMessage={setMessage} />
            <main className="mt-10 flex flex-col mx-auto bg-gray-800 gap-4 w-full max-w-6xl p-6 min-h-[600px] h-[700px] max-h-[800px] shadow-2xl rounded-lg">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-sky-500 rounded-lg">
                            <FaPencilAlt size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
                            <p className="text-gray-400">System activity and user actions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-base text-gray-300">
                            <span className="font-semibold text-white">{filteredLogs.length}</span> log(s)
                        </span>
                    </div>
                </div>

                {/* Action Buttons and Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-3 flex-1">
                        <button
                            onClick={() => getLogs(true)}
                            className="flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded transition-colors flex-1"
                            title="Refresh logs"
                        >
                            <FaSync className={`text-sm ${isLoading ? "animate-spin-once" : ""}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-2 flex-1">
                        <div className="relative flex-1">
                            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                value={usernameFilter}
                                onChange={(e) => setUsernameFilter(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-sky-500"
                            >
                                <option value="">All Users</option>
                                {uniqueUsernames.map(username => (
                                    <option key={username} value={username}>
                                        {username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative flex-1">
                            <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-sky-500"
                            />
                        </div>

                        {(usernameFilter || dateFilter) && (
                            <button
                                onClick={() => {
                                    setUsernameFilter("");
                                    setDateFilter("");
                                }}
                                className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded transition-colors"
                                title="Clear filters"
                            >
                                <FaSearch className="text-sm" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                <hr className="border-gray-600" />

                {/* Logs List */}
                <section className="flex flex-col gap-3 overflow-y-auto flex-1 pr-2">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-900 sticky top-0 left-0 right-0">
                        <div className="col-span-2 text-gray-300 font-semibold">User</div>
                        <div className="col-span-2 text-gray-300 font-semibold">Action</div>
                        <div className="col-span-6 text-gray-300 font-semibold">Description</div>
                        <div className="col-span-2 text-gray-300 font-semibold text-right">Date & Time</div>
                    </div>

                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log, index) => (
                            <article
                                key={log.id || index}
                                className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-sky-400 transition-all"
                            >
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2">
                                        <FaUser className="text-sky-400 text-sm" />
                                        <Link to={`/users/${log.username}`} className="text-white font-medium truncate cursor-pointer hover:text-cyan-200">
                                            {log.username}
                                        </Link>
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${log.action.includes('DELETE') || log.action.includes('REMOVE')
                                        ? 'bg-red-600 text-white'
                                        : log.action.includes('CREATE') || log.action.includes('ADD')
                                            ? 'bg-green-600 text-white'
                                            : log.action.includes('UPDATE') || log.action.includes('MODIFY')
                                                ? 'bg-yellow-600 text-white'
                                                : 'bg-gray-500 text-white'
                                        }`}>
                                        {log.action}
                                    </span>
                                </div>

                                <div className="col-span-6">
                                    <div className="text-gray-300 whitespace-pre-wrap text-sm break-words">
                                        {log.description}
                                    </div>
                                </div>

                                <div className="col-span-2 text-right">
                                    <div className="text-gray-400 text-sm">
                                        {moment(log.created_at).format("MMM DD")}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                        {moment(log.created_at).format("HH:mm")}
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : !isLoading && (
                        <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                            <FaList size={48} className="mb-4 opacity-50" />
                            <h2 className="text-xl font-semibold mb-2">
                                {logs.length === 0 ? "No logs available" : "No logs match filters"}
                            </h2>
                            <p className="text-center">
                                {logs.length === 0
                                    ? "System activity will appear here"
                                    : "Try adjusting your filters"
                                }
                            </p>
                        </div>
                    )}

                    {/* Load More Button */}
                    {loadIndex > 0 && !isEmpty ? (
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => getLogs()}
                                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded transition-colors"
                            >
                                <FaSync className="text-sm" />
                                Load More Logs
                            </button>
                        </div>
                    ) : filteredLogs.length < 0 &&
                    (<div className="flex justify-center mt-4">
                        <button
                            disabled
                            className="flex items-center gap-2 text-white font-semibold py-2 px-6 rounded transition-colors"
                        >
                            No more items to load
                        </button>
                    </div>)}
                </section>
            </main>
        </div>
    );
};

export default Logs;