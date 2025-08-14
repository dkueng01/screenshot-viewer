"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Upload,
  Copy,
  Download,
  Trash2,
  Check,
  AlertCircle,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  History,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

type NotificationType = "success" | "error" | null

interface HistoryItem {
  id: string
  dataUrl: string
  timestamp: Date
  name: string
}

export default function ScreenshotViewer() {
  const [image, setImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<NotificationType>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showNotification = useCallback((type: NotificationType) => {
    setNotification(type)
    if (type) {
      setTimeout(() => setNotification(null), 2000)
    }
  }, [])

  const addToHistory = useCallback((dataUrl: string, fileName?: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      dataUrl,
      timestamp: new Date(),
      name: fileName || `Screenshot ${new Date().toLocaleTimeString()}`
    }

    setHistory(prev => {
      const updated = [newItem, ...prev.filter(item => item.dataUrl !== dataUrl)]
      return updated.slice(0, 5)
    })
    setCurrentHistoryIndex(0)
  }, [])

  const loadFromHistory = useCallback((item: HistoryItem, index: number) => {
    setImage(item.dataUrl)
    setCurrentHistoryIndex(index)
    setShowHistory(false)
    setZoom(1)
    setRotation(0)
  }, [])

  const navigateHistory = useCallback((direction: 'prev' | 'next') => {
    if (history.length === 0) return

    let newIndex: number
    if (direction === 'prev') {
      newIndex = currentHistoryIndex < history.length - 1 ? currentHistoryIndex + 1 : 0
    } else {
      newIndex = currentHistoryIndex > 0 ? currentHistoryIndex - 1 : history.length - 1
    }

    loadFromHistory(history[newIndex], newIndex)
  }, [history, currentHistoryIndex, loadFromHistory])

  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      showNotification("error")
      return
    }

    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        setImage(result)
        addToHistory(result, file.name)
        showNotification("success")
      }
      setIsLoading(false)
    }

    reader.onerror = () => {
      setIsLoading(false)
      showNotification("error")
    }

    reader.readAsDataURL(file)
  }, [showNotification, addToHistory])

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
        break
      }
    }
  }, [processImageFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith("image/"))

    if (imageFile) {
      processImageFile(imageFile)
    } else if (files.length > 0) {
      showNotification("error")
    }
  }, [processImageFile, showNotification])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
    e.target.value = ""
  }, [processImageFile])

  const copyToClipboard = useCallback(async () => {
    if (!image) return

    try {
      const response = await fetch(image)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      showNotification("success")
    } catch (error) {
      console.error("Failed to copy image:", error)
      showNotification("error")
    }
  }, [image, showNotification])

  const downloadImage = useCallback(() => {
    if (!image) return

    const link = document.createElement("a")
    link.href = image
    link.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotification("success")
  }, [image, showNotification])

  const clearImage = useCallback(() => {
    setImage(null)
    setNotification(null)
    setIsFullscreen(false)
    setZoom(1)
    setRotation(0)
    setCurrentHistoryIndex(-1)
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    setCurrentHistoryIndex(-1)
    setShowHistory(false)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
    if (!isFullscreen) {
      setZoom(1)
      setRotation(0)
    }
  }, [isFullscreen])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360)
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setRotation(0)
  }, [])

  // Global paste event listener
  useEffect(() => {
    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [handlePaste])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        switch (e.key) {
          case "Escape":
            setIsFullscreen(false)
            break
          case "=":
          case "+":
            e.preventDefault()
            handleZoomIn()
            break
          case "-":
            e.preventDefault()
            handleZoomOut()
            break
          case "r":
            e.preventDefault()
            handleRotate()
            break
          case "0":
            e.preventDefault()
            resetView()
            break
          case "ArrowLeft":
            e.preventDefault()
            navigateHistory('prev')
            break
          case "ArrowRight":
            e.preventDefault()
            navigateHistory('next')
            break
        }
        return
      }

      if (!image) return

      if (e.key === "Escape") {
        clearImage()
      } else if (e.key === "f") {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === "h") {
        e.preventDefault()
        setShowHistory(prev => !prev)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        navigateHistory('prev')
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        navigateHistory('next')
      } else if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "c":
            e.preventDefault()
            copyToClipboard()
            break
          case "s":
            e.preventDefault()
            downloadImage()
            break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [image, isFullscreen, clearImage, copyToClipboard, downloadImage, toggleFullscreen, handleZoomIn, handleZoomOut, handleRotate, resetView, navigateHistory])

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isFullscreen])

  const NotificationBadge = ({ type }: { type: NotificationType }) => {
    if (!type) return null

    const isSuccess = type === "success"
    return (
      <div
        className={`
          fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
          transition-all duration-300 transform
          ${isSuccess
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
          }
        `}
      >
        {isSuccess ? (
          <Check className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isSuccess ? "Success!" : "Invalid file type"}
        </span>
      </div>
    )
  }

  const HistoryPanel = () => {
    if (!showHistory) return null

    return (
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-800">
                Recent Screenshots
              </h2>
              <span className="text-sm text-slate-500">
                ({history.length}/5)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button
                  onClick={clearHistory}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              )}
              <Button
                onClick={() => setShowHistory(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No screenshots in history yet</p>
                <p className="text-sm mt-1">Upload or paste images to see them here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer
                      transition-all duration-200 hover:bg-slate-50
                      ${index === currentHistoryIndex
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200"
                      }
                    `}
                    onClick={() => loadFromHistory(item, index)}
                  >
                    <div className="relative w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.dataUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.timestamp.toLocaleString()}
                      </p>
                    </div>
                    {index === currentHistoryIndex && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const FullscreenViewer = () => {
    if (!isFullscreen || !image) return null

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
        {/* Controls */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 bg-black bg-opacity-50 rounded-lg p-2">
            <Button
              onClick={handleZoomOut}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:bg-opacity-20"
              title="Zoom out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-white text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              onClick={handleZoomIn}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:bg-opacity-20"
              title="Zoom in (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-white bg-opacity-30 mx-1" />
            <Button
              onClick={handleRotate}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:bg-opacity-20"
              title="Rotate (R)"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              onClick={resetView}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white hover:bg-opacity-20"
              title="Reset view (0)"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Navigation arrows */}
        {history.length > 1 && (
          <>
            <Button
              onClick={() => navigateHistory('prev')}
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white hover:bg-opacity-20"
              title="Previous image (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => navigateHistory('next')}
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white hover:bg-opacity-20"
              title="Next image (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Close button */}
        <Button
          onClick={() => setIsFullscreen(false)}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 z-10 text-white hover:bg-white hover:bg-opacity-20"
          title="Close fullscreen (Escape)"
        >
          <X className="w-6 h-6" />
        </Button>

        {/* Image */}
        <div className="flex items-center justify-center w-full h-full p-8">
          <img
            src={image}
            alt="Fullscreen screenshot"
            className="max-w-none transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxHeight: zoom <= 1 ? "100%" : "none",
              maxWidth: zoom <= 1 ? "100%" : "none",
            }}
            draggable={false}
          />
        </div>

        {/* Help text */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-50 rounded-lg px-4 py-2">
            <p className="text-white text-sm text-center">
              <kbd className="px-1 py-0.5 bg-white bg-opacity-20 rounded text-xs">Esc</kbd> Close •{" "}
              <kbd className="px-1 py-0.5 bg-white bg-opacity-20 rounded text-xs">←→</kbd> Navigate •{" "}
              <kbd className="px-1 py-0.5 bg-white bg-opacity-20 rounded text-xs">+/-</kbd> Zoom •{" "}
              <kbd className="px-1 py-0.5 bg-white bg-opacity-20 rounded text-xs">R</kbd> Rotate •{" "}
              <kbd className="px-1 py-0.5 bg-white bg-opacity-20 rounded text-xs">0</kbd> Reset
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <NotificationBadge type={notification} />
      <HistoryPanel />
      <FullscreenViewer />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src="/logo.png"
              alt="Screenshot Viewer Logo"
              width={24}
              height={24}
              className="object-contain"
              priority
            />

            <h1 className="text-3xl font-bold text-slate-800">
              Screenshot Viewer
            </h1>
          </div>
          <p className="text-slate-600">
            Paste your screenshot instantly • No fuss, just view
          </p>
        </div>

        {!image ? (
          <>
            <div
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center
                transition-all duration-200 cursor-pointer
                ${isDragging
                  ? "border-blue-400 bg-blue-50 scale-[1.02]"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
                }
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-600">Loading your screenshot...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">
                      Ready for your screenshot
                    </h2>
                    <p className="text-slate-500 mb-6">
                      Simply press{" "}
                      <kbd className="px-2 py-1 bg-slate-200 rounded text-sm font-mono">
                        Ctrl+V
                      </kbd>{" "}
                      to paste from clipboard
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <Upload className="w-4 h-4" />
                      Choose file or click anywhere
                    </Button>
                    <span className="text-slate-400 text-sm">
                      Drag & drop also works
                    </span>
                  </div>
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload image file"
              />
            </div>

            {history.length > 0 && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setShowHistory(true)}
                  variant="ghost"
                  className="flex items-center gap-2 text-slate-600 mx-auto"
                >
                  <History className="w-4 h-4" />
                  View Recent ({history.length})
                </Button>
              </div>
            )}
          </>
) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <div className="w-3 h-3 bg-green-400 rounded-full" />
                {history.length > 1 && (
                  <span className="ml-2 text-sm text-slate-500">
                    {currentHistoryIndex + 1} of {history.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {history.length > 1 && (
                  <>
                    <Button
                      onClick={() => navigateHistory('prev')}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      title="Previous image (←)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => navigateHistory('next')}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      title="Next image (→)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => setShowHistory(true)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  title="View history (H)"
                >
                  <History className="w-4 h-4" />
                  History
                </Button>
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  title="View fullscreen (F)"
                >
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen
                </Button>
                <Button
                  onClick={copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  title="Copy to clipboard (Ctrl+C)"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                <Button
                  onClick={downloadImage}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  title="Download image (Ctrl+S)"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  onClick={clearImage}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  title="Clear image (Escape)"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="p-4 flex justify-center">
              <img
                src={image}
                alt="Uploaded screenshot"
                className="max-w-full h-auto rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                style={{ maxHeight: "70vh" }}
                loading="lazy"
                onClick={toggleFullscreen}
                title="Click to view fullscreen"
              />
            </div>
          </div>
        )}

        <div className="text-center mt-8 text-sm text-slate-500">
          <p>Made for quick screenshot viewing • No data is stored or uploaded</p>
          {image && (
            <p className="mt-2">
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">H</kbd> history •{" "}
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">←→</kbd> navigate •{" "}
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">F</kbd> fullscreen •{" "}
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">Esc</kbd> clear •{" "}
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">Ctrl+C</kbd> copy •{" "}
              <kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">Ctrl+S</kbd> download
            </p>
          )}
        </div>
      </div>
    </div>
  )
}