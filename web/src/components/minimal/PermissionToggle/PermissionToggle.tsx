import SwitchToggle from "../SwitchToggle/SwitchToggle"
import { FaInfoCircle } from "react-icons/fa"
import { useState, useRef } from "react"
import { createPortal } from "react-dom"

interface PermissionToggleProps {
  label: string
  info?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const PermissionToggle = ({ label, info, checked, onChange }: PermissionToggleProps) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      })
    }
    setShowTooltip(true)
  }

  return (
    <div 
      ref={cardRef}
      className="relative flex items-center justify-between p-2 bg-gray-700 hover:bg-gray-600 rounded transition-all duration-200 group cursor-pointer hover:translate-x-1 hover:z-50"
      onClick={() => onChange(!checked)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2">
        <span className="text-white text-base transition-all">{label}</span>
        {info && (
          <div className="relative flex items-center">
            <FaInfoCircle className="text-sky-400" size={14} />
            {showTooltip && createPortal(
              <div 
                className="absolute w-48 p-2 bg-gray-800 text-xs text-gray-200 rounded shadow-lg border border-gray-600 z-[9999] break-words pointer-events-none"
                style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
              >
                {info}
                <div className="absolute left-4 bottom-full w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-gray-600"></div>
              </div>,
              document.body
            )}
          </div>
        )}
      </div>
      {/* Click event is already handled by the wrapper, prevent double firing if they click the switch */}
      <div onClick={(e) => e.stopPropagation()}>
        <SwitchToggle checked={checked} onChange={onChange} />
      </div>
    </div>
  )
}

export default PermissionToggle;