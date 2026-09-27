import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { IoMdSettings } from "react-icons/io";
import { FaArrowLeft } from "react-icons/fa";
import { FaArrowDown } from "react-icons/fa";
import ExplorerContext from '../../utils/ExplorerContext';
import { type ExplorerContextType } from '../../types/ExplorerContextType';
import SettingsMenu from '../minimal/SettingsMenu/SettingsMenu.js';


const OptionsBar = () => {
    const [settings, setSettings] = useState<boolean>(false);
    const navigate = useNavigate();
    const buttonSize = 20;
    const {
        path, setPath, readDir
    } = useContext<ExplorerContextType>(ExplorerContext)
    return (
        <div className='flex flex-col justify-center w-11/12 mx-auto py-3 2xl:pt-5'>
            <div className='flex flex-col sm:flex-row w-full justify-center items-center sm:items-stretch gap-3 sm:gap-0'>
                <input
                    type="text"
                    spellCheck={false}
                    className='w-full sm:w-1/2 bg-slate-700 text-sm min-w-[300px] font-bold font-sans rounded-t-lg rounded-l-lg rounded-b-lg md:rounded-r-none md:rounded-tr-none px-2 md:py-0'
                    placeholder='Path'
                    value={path}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            navigate(`/explorer/${encodeURIComponent(path)}`, { replace: true });
                            readDir()
                        }
                        if (e.key === "Backspace" && path === "./") {
                            e.preventDefault()
                        }
                        if (e.key === "/" && path.slice(-1) === "/") {
                            e.preventDefault()
                        }
                    }}
                    onChange={(e) => {
                        setPath(e.target.value)
                    }}
                />
                <button
                    className="bg-sky-600 px-5 active:bg-sky-600 hover:bg-sky-700 w-full py-1 rounded-md md:rounded-none md:py-0 md:w-auto"
                    onClick={() => {
                        readDir()
                    }}
                >Refresh</button>
                <button
                    className='sm:ml-5 inline-flex justify-between items-center w-full sm:w-48 px-3 py-1.5 2xl:py-2 text-left text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none'
                    onClick={() => { setSettings(!settings) }}>
                    <IoMdSettings size={buttonSize} />
                    Settings
                    {settings ? <FaArrowDown size={buttonSize - 5} /> : <FaArrowLeft size={buttonSize - 5} />}
                </button>
            </div>
            <SettingsMenu isOpen={settings} setIsOpen={setSettings} />
        </div>
    )
}

export default OptionsBar