'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import getCroppedImg from '@/lib/crop-image'
import { Loader2 } from 'lucide-react'

interface ImageCropperDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string | null
  aspect?: number
  onCropCompleteAction: (croppedFile: File) => Promise<void>
  title?: string
  description?: string
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropperDialog({
  isOpen,
  onOpenChange,
  imageSrc,
  aspect,
  onCropCompleteAction,
  title = "Crop Image",
  description = "Drag the edges to crop. You can adjust the area as you like."
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    // Start with a crop that covers as much of the image as possible
    if (aspect) {
      setCrop(centerAspectCrop(width, height, aspect))
    } else {
      setCrop({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0
      })
    }
  }

  const handleSave = async () => {
    if (!imageSrc || !completedCrop || !imgRef.current) return

    try {
      setIsProcessing(true)
      const image = imgRef.current
      
      // We use the percentage crop and multiply it by the natural image dimensions
      // to get the exact pixels regardless of how the image is scaled in CSS
      const pixelCrop = {
        x: (completedCrop.x / 100) * image.naturalWidth,
        y: (completedCrop.y / 100) * image.naturalHeight,
        width: (completedCrop.width / 100) * image.naturalWidth,
        height: (completedCrop.height / 100) * image.naturalHeight,
      }

      const croppedImageFile = await getCroppedImg(imageSrc, pixelCrop)
      if (croppedImageFile) {
        await onCropCompleteAction(croppedImageFile)
        onOpenChange(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset states when opened with a new image
  useEffect(() => {
    if (isOpen) {
      setCrop(undefined)
      setCompletedCrop(undefined)
      setIsProcessing(false)
    }
  }, [isOpen, imageSrc])

  return (
    <Dialog open={isOpen && !!imageSrc} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-md sm:max-w-xl !border !border-white/30 !bg-white/40 dark:!border-white/10 dark:!bg-black/40 p-6 !shadow-[0_8px_40px_rgba(0,0,0,0.2)] !backdrop-blur-3xl sm:!rounded-[32px] !rounded-t-[32px]" 
      >
        <DialogHeader className="hidden">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center overflow-hidden rounded-2xl bg-black/10 dark:bg-white/5 p-2 shadow-inner ring-1 ring-inset ring-black/10 dark:ring-white/10 max-h-[60vh] w-full backdrop-blur-md">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
              aspect={aspect}
              className="max-h-[55vh]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageSrc}
                onLoad={onImageLoad}
                className="max-h-[55vh] w-auto object-contain rounded-xl shadow-sm"
              />
            </ReactCrop>
          )}
        </div>

        <DialogFooter className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center sm:gap-4 !border-none !bg-transparent !p-0 sm:!m-0 sm:!mb-0">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 sm:w-32 bg-secondary/80 backdrop-blur-md hover:bg-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isProcessing || !imageSrc || !completedCrop}
            className="w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 sm:w-40"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crop & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
