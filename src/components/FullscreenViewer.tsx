import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface FullscreenProps {
  imageSrc: string
  zoom: number
  rotation: number
  onClose: () => void
  setZoom: (z: number | ((prev: number) => number)) => void
  setRotation: (r: number | ((prev: number) => number)) => void
}

export const FullscreenViewer = ({ imageSrc, zoom, rotation, onClose, setZoom, setRotation }: FullscreenProps) => {
  // Panning State
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault()
      setIsDragging(true)
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  // Zoom mit Mausrad
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      // Verhindert das Browser-Zoomen
      e.preventDefault();
      if (e.deltaY < 0) setZoom(z => Math.min(z + 0.1, 4))
      else setZoom(z => Math.max(z - 0.1, 0.5))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center overflow-hidden" onWheel={handleWheel}>
      {/* Controls Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 backdrop-blur-sm rounded-full p-2 flex gap-2">
        <Button onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full w-8 h-8"><ZoomOut className="w-4 h-4" /></Button>
        <span className="text-white text-xs flex items-center min-w-[3rem] justify-center">{Math.round(zoom * 100)}%</span>
        <Button onClick={() => setZoom(z => Math.min(z + 0.25, 4))} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full w-8 h-8"><ZoomIn className="w-4 h-4" /></Button>
        <div className="w-px h-4 bg-white/20 my-auto mx-1" />
        <Button onClick={() => setRotation(r => (r + 90) % 360)} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full w-8 h-8"><RotateCw className="w-4 h-4" /></Button>
      </div>

      <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 z-50 text-white hover:bg-white/20">
        <X className="w-6 h-6" />
      </Button>

      {/* Image Container */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <img
          src={imageSrc}
          alt="Fullscreen"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            maxWidth: '100%',
            maxHeight: '100%',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        />
      </div>

      {/* Hint */}
      {zoom > 1 && !isDragging && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm pointer-events-none">
          Drag to pan
        </div>
      )}
    </div>
  )
}