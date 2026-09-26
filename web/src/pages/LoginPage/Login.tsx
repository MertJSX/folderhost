import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import { LuCornerDownLeft } from "react-icons/lu";
import logo from "../../assets/favicon.webp"

const Login = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [err, setErr] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [usernameFocused, setUsernameFocused] = useState<boolean>(false);
    const [passwordFocused, setPasswordFocused] = useState<boolean>(false);
    const [focusPassword, setFocusPassword] = useState<number>(0);
    const navigate = useNavigate();
    const errTimeout = useRef<number | null>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);

    async function verifyPassword(e: React.FormEvent) {
        e.preventDefault();

        if (!username || !password) {
            setErr("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        setErr("");

        try {
            const { data } = await axios.post(
                import.meta.env.VITE_API_BASE_URL + `/api/verify-password`,
                { username, password }
            );
            if (data.res) {
                Cookies.set("token", data.token);
                localStorage.setItem("last_username", username);

                const recoveryStr = localStorage.getItem("session_recovery");
                if (recoveryStr) {
                    try {
                        const recoveryData = JSON.parse(recoveryStr);
                        const isExpired = Date.now() - recoveryData.timestamp > 5 * 60 * 1000;
                        if (!isExpired && recoveryData.username === username) {
                            localStorage.removeItem("session_recovery");
                            navigate(recoveryData.path);
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to parse session_recovery", e);
                    }
                    localStorage.removeItem("session_recovery");
                }

                navigate('/');
            }
        } catch (err: any) {
            if (err.response?.data?.err) {
                setErr(err.response.data.err);
            } else {
                setErr("Cannot connect to the server!");
            }
            setPassword("");
            // Focus password input after clearing it (on next tick)
            setFocusPassword(prev => prev + 1);
            clearTimeout(errTimeout.current!)
            errTimeout.current = setTimeout(() => setErr(""), 5000);
        } finally {
            Cookies.remove("username")
            setIsLoading(false);
        }
    }

    useEffect(() => {
        document.title = "Login - folderhost"
    }, [])

    useEffect(() => {
        if (focusPassword > 0 && !isLoading) {
            passwordInputRef.current?.focus();
        }
    }, [focusPassword, isLoading]);

    const handleUsernameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            passwordInputRef.current?.focus();
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <form
                onSubmit={verifyPassword}
                className="relative flex flex-col p-10 gap-6 rounded-xl w-full max-w-md bg-slate-800 border border-slate-700 shadow-2xl"
            >
                {/* Logo/Icon */}
                <div className="flex flex-col items-center gap-3 mb-2">
                    <img src={logo} width={100} alt='' />
                    <h1 className="text-center font-extrabold text-4xl italic text-white select-none">
                        FolderHost
                    </h1>
                    <p className="text-slate-400 text-sm">Sign in to continue</p>
                </div>

                {/* Error Message */}
                {err && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                        <p className='text-center text-sm text-red-400' role="alert">
                            {err}
                        </p>
                    </div>
                )}

                {/* Username Input */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="username" className="text-slate-300 text-sm font-medium pl-1">
                        Username
                    </label>
                    <div className="relative">
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            id="username"
                            type="text"
                            className='bg-slate-700 border border-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-lg w-full pl-11 pr-12 py-3 text-white placeholder-slate-400 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed'
                            placeholder='Enter your username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={handleUsernameKeyDown}
                            onFocus={() => setUsernameFocused(true)}
                            onBlur={() => setUsernameFocused(false)}
                            disabled={isLoading}
                            aria-label="Username"
                            autoComplete="username"
                            autoFocus
                        />
                        {/* Enter hint — only visible when username is focused */}
                        {usernameFocused && (
                            <span className="hidden absolute right-3 top-1/2 -translate-y-1/2 md:flex items-center gap-1 px-2 py-0.5 bg-slate-900/60 rounded text-xs text-slate-400 pointer-events-none transition-opacity">
                                <LuCornerDownLeft size={10} />
                                <span>Enter</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-slate-300 text-sm font-medium pl-1">
                        Password
                    </label>
                    <div className="relative">
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            id="password"
                            ref={passwordInputRef}
                            type={showPassword ? "text" : "password"}
                            className='bg-slate-700 border border-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 rounded-lg w-full pl-11 pr-24 py-3 text-white placeholder-slate-400 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed'
                            placeholder='Enter your password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                            disabled={isLoading}
                            aria-label="Password"
                            autoComplete="current-password"
                        />
                        {/* Enter hint — only visible when password is focused */}
                        {passwordFocused && (
                            <span className="hidden absolute right-12 top-1/2 -translate-y-1/2 md:flex items-center gap-1 px-2 py-0.5 bg-slate-900/60 rounded text-xs text-slate-400 pointer-events-none transition-opacity">
                                <LuCornerDownLeft size={10} />
                                <span>Login</span>
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none transition-colors"
                            disabled={isLoading}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaEyeSlash className="w-5 h-5" /> : <FaEye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className='relative overflow-hidden bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed w-full px-4 py-3 rounded-lg mt-2 font-bold text-white text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:shadow-none disabled:scale-100'
                    disabled={isLoading}
                >
                    {isLoading && (
                        <span className="absolute inset-0 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </span>
                    )}
                    <span className={isLoading ? "opacity-0" : ""}>
                        LOGIN
                    </span>
                </button>
            </form>
        </div>
    )
}

export default Login