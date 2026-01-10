import { useState, useCallback, useEffect, useRef } from "react"

export type NotificationType = "success" | "error" | null

export interface HistoryItem {
  id: string
  dataUrl: string
  timestamp: string
  name: string
  width: number
  height: number
  size: string
}

const MAX_HISTORY = 10

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function useScreenshotLogic() {
  const [image, setImage] = useState<HistoryItem | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [notification, setNotification] = useState<NotificationType>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("screenshot-history")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setHistory(parsed)
      } catch (e) {
        console.error("Failed to load history", e)
      }
    }
  }, [])

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("screenshot-history", JSON.stringify(history))
    }
  }, [history])

  const showNotificationMsg = useCallback((type: NotificationType) => {
    setNotification(type)
    setTimeout(() => setNotification(null), 2000)
  }, [])

  const addToHistory = useCallback((dataUrl: string, fileName: string, width: number, height: number, size: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      dataUrl,
      timestamp: new Date().toISOString(),
      name: fileName,
      width,
      height,
      size
    }

    setImage(newItem)

    setHistory(prev => {
      const filtered = prev.filter(item => item.dataUrl !== dataUrl)
      return [newItem, ...filtered].slice(0, MAX_HISTORY)
    })
  }, [])

  const processImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      showNotificationMsg("error")
      return
    }

    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result) {
        const img = new Image()
        img.onload = () => {
          const sizeStr = formatBytes(file.size)
          addToHistory(result, file.name, img.naturalWidth, img.naturalHeight, sizeStr)
          showNotificationMsg("success")
          setIsLoading(false)
        }
        img.src = result
      }
    }
    reader.onerror = () => {
      setIsLoading(false)
      showNotificationMsg("error")
    }
    reader.readAsDataURL(file)
  }, [addToHistory, showNotificationMsg])

  const clearImage = useCallback(() => {
    setImage(null)
    setZoom(1)
    setRotation(0)
    setIsFullscreen(false)
  }, [])

  const loadFromHistory = useCallback((item: HistoryItem) => {
    setImage(item)
    setShowHistory(false)
    setZoom(1)
    setRotation(0)
  }, [])

  return {
    image, setImage,
    history, setHistory,
    notification, showNotificationMsg,
    isLoading,
    isFullscreen, setIsFullscreen,
    zoom, setZoom,
    rotation, setRotation,
    showHistory, setShowHistory,
    processImageFile,
    clearImage,
    loadFromHistory
  }
}