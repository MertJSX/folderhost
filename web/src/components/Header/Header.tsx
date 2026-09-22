import Cookies from 'js-cookie';
import { Link, useLocation } from 'react-router-dom';
import { MdExplore, MdMiscellaneousServices } from "react-icons/md";
import { FaUserFriends, FaPencilAlt, FaBars, FaTimes } from "react-icons/fa"
import { FaArrowRotateLeft } from "react-icons/fa6"
import { useCallback, useLayoutEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import UserMenu from './UserMenu';
import fullLogo from '../../assets/folderhost-logo.webp'

const Header = () => {
    let location = useLocation();
    const [username, setUsername] = useState<string>(Cookies.get("username") as string);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useLayoutEffect(() => {
        const cookieUsername = Cookies.get("username");
        if (cookieUsername) {
            localStorage.setItem("last_username", cookieUsername);
            return;
        }

        fetchUserInfo()
    }, []);

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
            <section className='flex md:hidden flex-col items-center w-full px-6 py-3'>
                {/* Logo */}
                <div className="flex items-center gap-3 mb-4">
                    <img src={fullLogo} width={200} alt='' />
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
                        >
                            {isMobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </section>

            {/* Mobile Navigation Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden w-full bg-slate-800 border-t border-slate-700/50 animate-fadeIn">
                    <nav className='flex flex-col w-full'>
                        <Link
                            className={getNavLinkClass('/explorer')}
                            to={"/explorer/.%2F"}
                            onClick={closeMobileMenu}>
                            <MdExplore className="w-5 h-5" />
                            Explorer
                        </Link>
                        <Link
                            className={getNavLinkClass('/services')}
                            to={"/services"}
                            onClick={closeMobileMenu}>
                            <MdMiscellaneousServices className="w-5 h-5" />
                            Services
                        </Link>
                        <Link
                            className={getNavLinkClass('/recovery')}
                            to={"/recovery"}
                            onClick={closeMobileMenu}>
                            <FaArrowRotateLeft className="w-4 h-4" />
                            Recovery
                        </Link>
                        <Link
                            className={getNavLinkClass('/users')}
                            to={"/users"}
                            onClick={closeMobileMenu}>
                            <FaUserFriends className="w-5 h-5" />
                            Users
                        </Link>
                        <Link
                            className={getNavLinkClass('/logs')}
                            to={"/logs"}
                            onClick={closeMobileMenu}>
                            <FaPencilAlt className="w-4 h-4" />
                            Logs
                        </Link>
                    </nav>
                </div>
            )}
        </div>
    )
}

export default Header;