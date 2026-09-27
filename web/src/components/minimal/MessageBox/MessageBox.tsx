import { FaCheckCircle } from "react-icons/fa";
import { MdError } from "react-icons/md";
import { useContext, useEffect, useCallback } from "react";
import { LuCornerDownLeft } from "react-icons/lu";
import ExplorerContext from "../../../utils/ExplorerContext";

interface MessageBoxProps {
    message: string,
    isErr: boolean,
    setMessage?: React.Dispatch<React.SetStateAction<string>>
}

const MessageBox: React.FC<MessageBoxProps> = ({ message, isErr, setMessage }) => {
    const { setMessageBoxMsg, setError, setRes } = useContext(ExplorerContext)

    const handleClose = useCallback(() => {
        setError("")
        setRes("")
        setMessageBoxMsg("")
        if (setMessage) {
            setMessage("")
        }
    }, [setError, setRes, setMessageBoxMsg, setMessage])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault()
                handleClose()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleClose])

    return message && (
        <section className='bg-black fixed inset-0 flex items-center justify-center w-full bg-opacity-60 z-30'>
            <div className={`flex flex-col justify-center items-center bg-slate-800 border rounded-xl w-[550px] p-5 ${isErr ? "border-red-400" : "border-sky-400"}`}>
                {isErr ?
                    <MdError className="m-5" size={100} />
                    :
                    <FaCheckCircle className="m-5" size={75} />}
                <p className="text-center text-lg">{message}</p>
                <button
                    className={`relative w-full mt-5 p-1 text-sm transition-all flex items-center justify-center ${isErr ? "bg-red-700 hover:bg-red-800" : "bg-sky-700 hover:bg-sky-800"}`}
                    onClick={handleClose}
                >
                    <span>Okay</span>
                    <span className="absolute right-2 flex items-center gap-1 px-2 py-0.5 bg-black/30 rounded text-xs">
                        <LuCornerDownLeft size={10} />
                        <span>Enter</span>
                    </span>
                </button>
            </div>
        </section>
    )
}

export default MessageBox