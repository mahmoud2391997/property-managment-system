/**
 * Image compression utility for property and room images
 * Provides light compression for main images and heavy compression for thumbnails
 */

type CompressionResult = {
  mainBlob: Blob
  thumbBlob: Blob
}

type CompressionOptions = {
  maxWidth?: number
  maxHeight?: number
  mainQuality?: number
  thumbWidth?: number
  thumbHeight?: number
  thumbQuality?: number
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  mainQuality: 0.8,
  thumbWidth: 400,
  thumbHeight: 300,
  thumbQuality: 0.6
}

/**
 * Compresses an image file and generates both main image and thumbnail
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      try {
        // Generate main compressed image
        const mainBlob = resizeAndCompress(
          img,
          opts.maxWidth,
          opts.maxHeight,
          opts.mainQuality
        )

        // Generate thumbnail
        const thumbBlob = resizeAndCompress(
          img,
          opts.thumbWidth,
          opts.thumbHeight,
          opts.thumbQuality,
          true // crop to fit
        )

        Promise.all([mainBlob, thumbBlob])
          .then(([main, thumb]) => {
            resolve({ mainBlob: main, thumbBlob: thumb })
          })
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Resizes and compresses an image
 */
function resizeAndCompress(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  cropToFit = false
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    let width = img.width
    let height = img.height

    if (cropToFit) {
      // Crop to fit aspect ratio (cover mode)
      const targetRatio = maxWidth / maxHeight
      const imgRatio = width / height

      let sourceX = 0
      let sourceY = 0
      let sourceWidth = width
      let sourceHeight = height

      if (imgRatio > targetRatio) {
        // Image is wider - crop sides
        sourceWidth = height * targetRatio
        sourceX = (width - sourceWidth) / 2
      } else {
        // Image is taller - crop top/bottom
        sourceHeight = width / targetRatio
        sourceY = (height - sourceHeight) / 2
      }

      canvas.width = maxWidth
      canvas.height = maxHeight

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        maxWidth,
        maxHeight
      )
    } else {
      // Scale to fit (contain mode)
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)
    }

    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Validates file size and type
 */
export function validateImageFile(
  file: File,
  maxSizeMB = 2
): { valid: boolean; error?: string } {
  const maxSize = maxSizeMB * 1024 * 1024

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size must not exceed ${maxSizeMB}MB` }
  }

  return { valid: true }
}

/**
 * Creates a preview URL for an image file
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Revokes a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}
