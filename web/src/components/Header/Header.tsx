import Cookies from 'js-cookie';
import { Link, useLocation } from 'react-router-dom';
import { MdExplore, MdMiscellaneousServices } from "react-icons/md";
import { FaUserFriends, FaPencilAlt, FaBars, FaTimes } from "react-icons/fa"
import { FaArrowRotateLeft } from "react-icons/fa6"
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import UserMenu from './UserMenu';
import fullLogo from '../../assets/folderhost-logo.webp'
import favicon from '../../assets/favicon.webp'

const Header = () => {
    let location = useLocation();
    const [username, setUsername] = useState<string>(Cookies.get("username") as string);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const [menuHeight, setMenuHeight] = useState<number>(0);

    useLayoutEffect(() => {
        const cookieUsername = Cookies.get("username");
        if (cookieUsername) {
            localStorage.setItem("last_username", cookieUsername);
            return;
        }

        fetchUserInfo()
    }, []);

    useLayoutEffect(() => {
        if (mobileMenuRef.current) {
            setMenuHeight(mobileMenuRef.current.scrollHeight);
        }
    }, [isMobileMenuOpen]);

    const fetchUserInfo = useCallback(() => {
        axiosInstance.get('/user-info'
        ).then((response) => {
            if (response.data.username) {
                setUsername(response.data.username);
                localStorage.setItem("last_username", response.data.username);
            }
        }).catch((err) => {
            console.error('Failed to fetch user info:', err);
        });
    }, [])

    const isActiveLink = (path: string) => {
        return location.pathname.startsWith(path);
    }

    const getNavLinkClass = (path: string) => {
        const baseClasses =
            'flex items-center gap-1.5 lg:gap-2 ' +
            'px-2.5 py-2 lg:px-3.5 lg:py-2.5 xl:px-5 xl:py-3 ' +
            'text-sm lg:text-[15px] xl:text-sm 2xl:text-base ' +
            'transition-all border-b-2 whitespace-nowrap';
        const activeClasses = 'text-sky-400 border-sky-500';
        const inactiveClasses =
            'text-white border-transparent hover:bg-slate-700 hover:text-sky-400 hover:border-sky-500';

        return `${baseClasses} ${isActiveLink(path) ? activeClasses : inactiveClasses}`;
    }

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    }

    return (
        <div className='flex flex-col items-center justify-center bg-slate-800 2xl:pt-1 sticky left-0 right-0 top-0 w-full border-b-2 border-slate-700 shadow-lg z-50'>
            {/* Desktop Header */}
            <section className='hidden md:flex flex-row items-center justify-between w-full px-6'>
                {/* Logo Section */}
                <div className="flex items-center gap-3 2xl:mb-1">
                    <img src={fullLogo} width={180} alt='' />
                </div>

                {/* Desktop Navigation */}
                <nav className='hidden md:flex flex-row justify-center items-center gap-0.5 lg:gap-1 h-full'>
                    <Link
                        className={getNavLinkClass('/explorer')}
                        to={"/explorer/.%2F"}>
                        <MdExplore className="w-4 h-4 lg:w-[18px] lg:h-[18px] xl:w-5 xl:h-5" />
                        Explorer
                    </Link>
                    <Link
                        className={getNavLinkClass('/services')}
                        to={"/services"}>
                        <MdMiscellaneousServices className="w-4 h-4 lg:w-[18px] lg:h-[18px] xl:w-5 xl:h-5" />
                        Services
                    </Link>
                    <Link
                        className={getNavLinkClass('/recovery')}
                        to={"/recovery"}>
                        <FaArrowRotateLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4" />
                        Recovery
                    </Link>
                    <Link
                        className={getNavLinkClass('/users')}
                        to={"/users"}>
                        <FaUserFriends className="w-4 h-4 lg:w-[18px] lg:h-[18px] xl:w-5 xl:h-5" />
                        Users
                    </Link>
                    <Link
                        className={getNavLinkClass('/logs')}
                        to={"/logs"}>
                        <FaPencilAlt className="w-3.5 h-3.5 lg:w-4 lg:h-4 xl:w-4 xl:h-4" />
                        Logs
                    </Link>
                </nav>

                {/* User Info and Logout Section */}
                <div className="flex items-center gap-2 lg:gap-3 xl:gap-4 shrink-0">
                    <UserMenu username={username} />
                </div>
            </section>

            {/* Mobile Header */}
            <section className='flex md:hidden items-center justify-center w-full px-6 py-3'>
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 pr-3 border-r border-white">
                    <img src={favicon} width={40} alt='' />
                </div>

                {/* User Info and Logout */}
                <div className="flex items-center justify-between w-full">
                    {/* User Info */}
                    <UserMenu username={username} />

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 text-white hover:bg-slate-700 rounded-lg transition-all border border-slate-600"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-menu"
                        >
                            <div className="relative w-5 h-5">
                                <FaBars
                                    className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                                        isMobileMenuOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                                    }`}
                                />
                                <FaTimes
                                    className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
                                        isMobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                                    }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>
            </section>

            {/* Mobile Navigation Menu */}
            <div
                id="mobile-menu"
                ref={mobileMenuRef}
                className="md:hidden w-full bg-slate-800 border-t border-slate-700/50 overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                    maxHeight: isMobileMenuOpen ? `${menuHeight}px` : '0px',
                    opacity: isMobileMenuOpen ? 1 : 0,
                    transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(-8px)',
                    borderTopWidth: isMobileMenuOpen ? '1px' : '0px',
                }}
                aria-hidden={!isMobileMenuOpen}
            >
                <nav className='flex flex-col w-full'>
                    <Link
                        className={`${getNavLinkClass('/explorer')} transform transition-all duration-300 ${
                            isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                        }`}
                        style={{ transitionDelay: isMobileMenuOpen ? '50ms' : '0ms' }}
                        to={"/explorer/.%2F"}
                        onClick={closeMobileMenu}
                        tabIndex={isMobileMenuOpen ? 0 : -1}>
                        <MdExplore className="w-5 h-5" />
                        Explorer
                    </Link>
                    <Link
                        className={`${getNavLinkClass('/services')} transform transition-all duration-300 ${
                            isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                        }`}
                        style={{ transitionDelay: isMobileMenuOpen ? '100ms' : '0ms' }}
                        to={"/services"}
                        onClick={closeMobileMenu}
                        tabIndex={isMobileMenuOpen ? 0 : -1}>
                        <MdMiscellaneousServices className="w-5 h-5" />
                        Services
                    </Link>
                    <Link
                        className={`${getNavLinkClass('/recovery')} transform transition-all duration-300 ${
                            isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                        }`}
                        style={{ transitionDelay: isMobileMenuOpen ? '150ms' : '0ms' }}
                        to={"/recovery"}
                        onClick={closeMobileMenu}
                        tabIndex={isMobileMenuOpen ? 0 : -1}>
                        <FaArrowRotateLeft className="w-4 h-4" />
                        Recovery
                    </Link>
                    <Link
                        className={`${getNavLinkClass('/users')} transform transition-all duration-300 ${
                            isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                        }`}
                        style={{ transitionDelay: isMobileMenuOpen ? '200ms' : '0ms' }}
                        to={"/users"}
                        onClick={closeMobileMenu}
                        tabIndex={isMobileMenuOpen ? 0 : -1}>
                        <FaUserFriends className="w-5 h-5" />
                        Users
                    </Link>
                    <Link
                        className={`${getNavLinkClass('/logs')} transform transition-all duration-300 ${
                            isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                        }`}
                        style={{ transitionDelay: isMobileMenuOpen ? '250ms' : '0ms' }}
                        to={"/logs"}
                        onClick={closeMobileMenu}
                        tabIndex={isMobileMenuOpen ? 0 : -1}>
                        <FaPencilAlt className="w-4 h-4" />
                        Logs
                    </Link>
                </nav>
            </div>
        </div>
    )
}

export default Header;