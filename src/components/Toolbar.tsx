import { Button } from "@/components/ui/button"
import { HistoryItem } from "@/hooks/useScreenshotLogic"
import Link from "next/link"
import { Copy, Download, Trash2, Maximize2, History, Pipette, Info, Wand2 } from "lucide-react"

interface ToolbarProps {
  image: HistoryItem
  historyCount: number
  onToggleHistory: () => void
  onToggleFullscreen: () => void
  onClear: () => void
  onNotify: (type: "success" | "error") => void
}

export const Toolbar = ({ image, historyCount, onToggleHistory, onToggleFullscreen, onClear, onNotify }: ToolbarProps) => {

  const copyToClipboard = async () => {
    try {
      const response = await fetch(image.dataUrl)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      onNotify("success")
    } catch (e) { onNotify("error") }
  }

  const handleColorPick = async () => {
    // @ts-ignore - EyeDropper API ist experimentell
    if (!window.EyeDropper) {
      alert("Your browser does not support the EyeDropper API"); return;
    }
    try {
      // @ts-ignore
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      await navigator.clipboard.writeText(result.sRGBHex)
      onNotify("success")
    } catch (e) { /* Cancelled */ }
  }

  const downloadImage = () => {
    const link = document.createElement("a")
    link.href = image.dataUrl
    link.download = `screenshot-${image.id}.png`
    link.click()
    onNotify("success")
  }

  return (
    <div className="flex flex-wrap items-center justify-between p-3 gap-2 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center gap-4 text-xs text-slate-500 font-mono hidden sm:flex">
        <span title="Dimensions">{image.width} x {image.height}px</span>
        <span title="File Size">{image.size}</span>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <Button onClick={handleColorPick} variant="ghost" size="sm" className="h-8 gap-2" title="Pick Color">
          <Pipette className="w-4 h-4" /> <span className="hidden sm:inline">Color</span>
        </Button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <Button variant="ghost" size="sm" asChild className="h-8 gap-2 bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
          <Link href={`/beautify?id=${image.id}`}>
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 font-medium">Beautify</span>
          </Link>
        </Button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <Button onClick={onToggleHistory} variant="ghost" size="sm" className="h-8 gap-2">
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History {historyCount > 0 && `(${historyCount})`}</span>
        </Button>
        <Button onClick={onToggleFullscreen} variant="ghost" size="sm" className="h-8">
          <Maximize2 className="w-4 h-4" />
        </Button>
        <Button onClick={copyToClipboard} variant="ghost" size="sm" className="h-8">
          <Copy className="w-4 h-4" />
        </Button>
        <Button onClick={downloadImage} variant="ghost" size="sm" className="h-8">
          <Download className="w-4 h-4" />
        </Button>
        <Button onClick={onClear} variant="ghost" size="sm" className="h-8 text-red-600 hover:text-red-700">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}