"use client"

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, Image as ImageIcon, Wand2 } from "lucide-react"
import Image from "next/image"
import { toPng } from "html-to-image"

import { Button } from "@/components/ui/button"
import { HistoryItem } from "@/hooks/useScreenshotLogic"

const GRADIENTS = [
  "bg-gradient-to-br from-purple-500 to-pink-500",
  "bg-gradient-to-tr from-cyan-400 to-blue-500",
  "bg-gradient-to-r from-teal-400 to-emerald-400",
  "bg-gradient-to-bl from-orange-400 to-rose-400",
  "bg-gradient-to-tl from-slate-800 to-slate-900",
  "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
  "bg-gradient-to-r from-green-300 to-purple-400",
  "bg-gradient-to-r from-rose-400 to-orange-300",
]

const PADDING_OPTIONS = [
  { label: "Small", value: "p-6 md:p-8", exportPadding: 24 },
  { label: "Medium", value: "p-10 md:p-12", exportPadding: 40 },
  { label: "Large", value: "p-14 md:p-16", exportPadding: 56 },
  { label: "Extra Large", value: "p-20 md:p-24", exportPadding: 80 },
]

const RADIUS_OPTIONS = [
  { label: "None", value: "rounded-none", exportRadius: 0 },
  { label: "Small", value: "rounded-lg", exportRadius: 12 },
  { label: "Medium", value: "rounded-xl", exportRadius: 16 },
  { label: "Large", value: "rounded-2xl", exportRadius: 24 },
]

const SHADOW_OPTIONS = [
  {
    label: "None",
    value: "shadow-none",
    exportShadow: "none",
  },
  {
    label: "Subtle",
    value: "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)]",
    exportShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.15)",
  },
  {
    label: "Medium",
    value: "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]",
    exportShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.3)",
  },
  {
    label: "Intense",
    value: "shadow-[0_30px_90px_-20px_rgba(0,0,0,0.5)]",
    exportShadow: "0 30px 90px -20px rgba(0, 0, 0, 0.5)",
  },
]

function BeautifierContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [imageItem, setImageItem] = useState<HistoryItem | null>(null)
  const [gradient, setGradient] = useState(GRADIENTS[0])
  const [padding, setPadding] = useState(PADDING_OPTIONS[1])
  const [radius, setRadius] = useState(RADIUS_OPTIONS[2])
  const [shadow, setShadow] = useState(SHADOW_OPTIONS[2])
  const [isExporting, setIsExporting] = useState(false)

  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

    const saved = localStorage.getItem("screenshot-history")
    if (!saved) return

    try {
      const parsed: HistoryItem[] = JSON.parse(saved)
      const found = parsed.find((item) => item.id === id)
      if (found) {
        setImageItem(found)
      }
    } catch (error) {
      console.error("Failed to load image from history", error)
    }
  }, [id])

  const imageOrientation = useMemo(() => {
    if (!imageItem) return "portrait"
    return imageItem.width >= imageItem.height ? "landscape" : "portrait"
  }, [imageItem])

  const previewFrameClasses = useMemo(() => {
    if (imageOrientation === "landscape") {
      return "w-full max-w-[960px]"
    }

    return "w-full max-w-[720px] md:max-w-[820px]"
  }, [imageOrientation])

  const imageSizingClasses = useMemo(() => {
    if (imageOrientation === "landscape") {
      return "max-w-full max-h-[72vh]"
    }

    return "w-auto max-w-full max-h-[78vh] md:max-h-[82vh]"
  }, [imageOrientation])

  const handleExport = async () => {
    if (!exportRef.current || !imageItem) return

    setIsExporting(true)

    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const link = document.createElement("a")
      const fileName = imageItem.name || "screenshot"
      const baseName = fileName.replace(/\.[^/.]+$/, "")

      link.download = `beautified-${baseName}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Failed to export image", error)
      alert("Failed to export image. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  if (!imageItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="mb-4 text-slate-500">Loading image...</p>
          <Button onClick={() => router.push("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 transition-colors">
      <div className="mx-auto max-w-6xl pt-4 md:pt-10">
        <div className="relative mb-8 hidden text-center md:block">
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-3">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
            Screenshot Viewer <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">v3.0</span>
          </h1>

          <p className="mt-2 text-slate-500">
            Add beautiful backgrounds, corners, and drop shadows
          </p>
        </div>

        <div className="relative mb-6 flex items-center justify-center gap-3 md:hidden">
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 border border-slate-200 text-slate-500"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="flex items-center justify-center gap-2 text-xl font-bold text-slate-800">
            <Wand2 className="h-5 w-5 text-purple-500" />
            Beautify Screenshot
          </h1>
        </div>

        <div className="flex min-h-[500px] flex-col overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200 md:h-[calc(100vh-180px)] md:min-h-0 md:flex-row">
          <div className="flex min-h-0 flex-1 flex-col border-b border-slate-200 md:border-b-0 md:border-r">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/50 p-3">
              <span className="ml-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                Preview Window
              </span>

              <span className="mr-2 hidden text-xs font-mono text-slate-400 sm:block">
                {imageItem.width} x {imageItem.height}px
              </span>
            </div>

            <div className="relative flex min-h-[500px] flex-1 items-start justify-center overflow-auto bg-[url('/grid-pattern.svg')] bg-slate-50 p-4 md:min-h-0 md:p-8">
              <div className={`${previewFrameClasses} flex justify-center`}>
                <div
                  ref={exportRef}
                  className={`inline-flex items-center justify-center transition-all duration-300 ease-in-out ${gradient} ${padding.value}`}
                  style={{
                    minWidth: imageOrientation === "portrait" ? "min(100%, 560px)" : "auto",
                  }}
                >
                  <img
                    src={imageItem.dataUrl}
                    alt="Screenshot"
                    className={`object-contain transition-all duration-300 ${imageSizingClasses} ${radius.value} ${shadow.value}`}
                    style={{
                      borderRadius: radius.exportRadius,
                      boxShadow: shadow.exportShadow,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 w-full flex-col bg-white md:w-80 md:flex-shrink-0">
            <div className="flex-shrink-0 border-b border-slate-100 py-[10px] px-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-700">
                <Wand2 className="h-4 w-4 text-blue-500" />
                Settings
              </h3>
            </div>

            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Background
                </h3>

                <div className="grid grid-cols-4 gap-2">
                  {GRADIENTS.map((grad, index) => (
                    <button
                      key={grad}
                      onClick={() => setGradient(grad)}
                      className={`h-10 rounded-md transition-all ${grad
                        } ${gradient === grad
                          ? "ring-2 ring-blue-500 ring-offset-2"
                          : "border border-black/5 hover:scale-105"
                        }`}
                      title={`Gradient ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Padding
                </h3>

                <div className="flex flex-col gap-2">
                  {PADDING_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      onClick={() => setPadding(option)}
                      className={`justify-start font-normal transition-colors ${padding.value === option.value
                        ? "border-blue-200 bg-blue-50/50 text-blue-700"
                        : "text-slate-600"
                        }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rounded Corners
                </h3>

                <div className="flex flex-col gap-2">
                  {RADIUS_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      onClick={() => setRadius(option)}
                      className={`justify-start font-normal transition-colors ${radius.value === option.value
                        ? "border-blue-200 bg-blue-50/50 text-blue-700"
                        : "text-slate-600"
                        }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Drop Shadow
                </h3>

                <div className="flex flex-col gap-2">
                  {SHADOW_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant="outline"
                      onClick={() => setShadow(option)}
                      className={`justify-start font-normal transition-colors ${shadow.value === option.value
                        ? "border-blue-200 bg-blue-50/50 text-blue-700"
                        : "text-slate-600"
                        }`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="z-10 w-full flex-shrink-0 border-t border-slate-100 bg-white p-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)]">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="h-11 w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-base text-white shadow-md transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
              >
                {isExporting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                Download Image
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 hidden pb-8 text-center md:block">
          <p className="text-xs text-slate-500">
            Made for quick screenshot viewing • No data is stored or uploaded
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BeautifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <BeautifierContent />
    </Suspense>
  )
}