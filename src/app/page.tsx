"use client"

import React, { useRef, useEffect } from "react"
import { Upload, AlertCircle, Check, History as HistoryIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useScreenshotLogic, NotificationType, HistoryItem } from "@/hooks/useScreenshotLogic"
import { Toolbar } from "@/components/Toolbar"
import { FullscreenViewer } from "@/components/FullscreenViewer"
import Image from "next/image"

const NotificationBadge = ({ type }: { type: NotificationType }) => {
  if (!type) return null
  const isSuccess = type === "success"
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 ${isSuccess ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
      {isSuccess ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span className="text-sm font-medium">{isSuccess ? "Success!" : "Invalid file type"}</span>
    </div>
  )
}

const HistoryDrawer = ({ history, onClose, onSelect, onClear }: { history: HistoryItem[], onClose: () => void, onSelect: (i: HistoryItem) => void, onClear: () => void }) => (
  <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm flex justify-end" onClick={onClose}>
    <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
      <div className="p-4 border-b flex items-center justify-between bg-slate-50">
        <h2 className="font-semibold flex items-center gap-2"><HistoryIcon className="w-4 h-4" /> Recent History ({history.length}/5)</h2>
        <div className="flex gap-2">
          {history.length > 0 && <Button variant="ghost" size="sm" onClick={onClear} className="text-red-500 hover:text-red-600 h-8">Clear</Button>}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8"><X className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? <p className="text-center text-slate-400 mt-10">No history yet.</p> :
          history.map((item) => (
            <div key={item.id} onClick={() => onSelect(item)} className="group flex items-start gap-3 p-2 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all">
              <div className="w-16 h-16 bg-slate-100 rounded overflow-hidden flex-shrink-0 relative border border-slate-200">
                <img src={item.dataUrl} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate text-slate-700">{item.name}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{item.width}x{item.height} • {item.size}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  </div>
)

const UploadZone = ({
  isLoading,
  onFileSelect,
  fileInputRef
}: {
  isLoading: boolean,
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void,
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) => (
  <div
    onClick={() => fileInputRef.current?.click()}
    className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center bg-white hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer group"
  >
    {isLoading ? (
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600">Processing image...</p>
      </div>
    ) : (
      <>
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-blue-50 group-hover:text-blue-500">
          <Upload className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Drag & Drop or Paste (Ctrl+V)</h2>
        <p className="text-slate-500 mb-6 text-sm">Supports PNG, JPG, WebP</p>
        <Button variant="outline">Browse Files</Button>
      </>
    )}
    <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileSelect} className="hidden" />
  </div>
)

// --- MAIN COMPONENT ---

export default function ScreenshotViewer() {
  const {
    image, setImage, history, setHistory,
    notification, showNotificationMsg,
    isLoading, processImageFile, clearImage, loadFromHistory,
    isFullscreen, setIsFullscreen, zoom, setZoom, rotation, setRotation,
    showHistory, setShowHistory
  } = useScreenshotLogic()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag & Drop Handler (müssen im UI Component bleiben für Events)
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith("image/"))
    if (file) processImageFile(file)
    else if (e.dataTransfer.files.length > 0) showNotificationMsg("error")
  }, [processImageFile, showNotificationMsg])

  // Global Paste Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith("image/"))
      const file = item?.getAsFile()
      if (file) processImageFile(file)
    }
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [processImageFile])

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 transition-colors ${isDragging ? "bg-blue-50" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false) }}
      onDrop={handleDrop}
    >
      <NotificationBadge type={notification} />

      {/* Fullscreen Modal */}
      {isFullscreen && image && (
        <FullscreenViewer
          imageSrc={image.dataUrl} zoom={zoom} rotation={rotation}
          onClose={() => setIsFullscreen(false)} setZoom={setZoom} setRotation={setRotation}
        />
      )}

      {/* History Side Panel */}
      {showHistory && (
        <HistoryDrawer
          history={history}
          onClose={() => setShowHistory(false)}
          onSelect={loadFromHistory}
          onClear={() => { setHistory([]); localStorage.removeItem("screenshot-history") }}
        />
      )}

      <div className="max-w-5xl mx-auto pt-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            Screenshot Viewer <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">v3.0</span>
          </h1>
          <p className="text-slate-500 mt-2">Paste your screenshot instantly • No fuss, just view</p>
        </div>

        {!image ? (
          <div className="max-w-2xl mx-auto">
            <UploadZone isLoading={isLoading} onFileSelect={(e) => e.target.files?.[0] && processImageFile(e.target.files[0])} fileInputRef={fileInputRef} />
            {history.length > 0 && (
              <div className="mt-8 text-center">
                <Button variant="ghost" className="text-slate-500" onClick={() => setShowHistory(true)}>
                  <HistoryIcon className="w-4 h-4 mr-2" /> Open History ({history.length})
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <Toolbar
              image={image}
              historyCount={history.length}
              onToggleHistory={() => setShowHistory(true)}
              onToggleFullscreen={() => { setIsFullscreen(true); setZoom(1); setRotation(0); }}
              onClear={clearImage}
              onNotify={showNotificationMsg}
            />

            <div className="relative bg-[url('/grid-pattern.svg')] bg-slate-50 min-h-[400px] flex items-center justify-center p-8 cursor-zoom-in" onClick={() => setIsFullscreen(true)}>
              <img
                src={image.dataUrl}
                alt="Preview"
                className="max-w-full max-h-[70vh] rounded-lg shadow-sm object-contain"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/5 pointer-events-none">
                <span className="bg-black/75 text-white px-3 py-1 rounded-full text-sm">Click for Fullscreen</span>
              </div>
            </div>
          </div>
        )}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-xs">Made for quick screenshot viewing • No data is stored or uploaded</p>
        </div>
      </div>
    </div>
  )
}