// ============================================
// IMAGE UTILITIES
// Fix: WebP convert + EXIF metadata removal
// ============================================

/**
 * Convert image to WebP on CLIENT SIDE (browser)
 * Fix: Avoids server RAM crash with sharp on free hosting
 */
export async function convertToWebP(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<File> {
  const { maxWidth = 1200, maxHeight = 1600, quality = 0.85 } = options

  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas not supported'))
      return
    }

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // Draw image (this strips EXIF metadata!)
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Conversion failed'))
            return
          }
          const webpFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.webp'),
            { type: 'image/webp' }
          )
          resolve(webpFile)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Upload image to Supabase Storage
 * Converts to WebP first, removes EXIF
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  supabaseClient: any
): Promise<string | null> {
  try {
    // Convert to WebP (client-side, no server RAM needed)
    const webpFile = await convertToWebP(file, {
      maxWidth: 1200,
      maxHeight: 1600,
      quality: 0.85,
    })

    const fileName = `${productId}/${Date.now()}.webp`

    const { error } = await supabaseClient.storage
      .from('product-images')
      .upload(fileName, webpFile, {
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data } = supabaseClient.storage
      .from('product-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch (err) {
    console.error('Image upload failed:', err)
    return null
  }
}

/**
 * Generate blur placeholder for next/image
 * Server-side using sharp (for SSR blur generation only)
 */
export async function generateBlurPlaceholder(imageUrl: string): Promise<string> {
  try {
    // Fetch tiny version
    const response = await fetch(imageUrl + '?width=10')
    const buffer = await response.arrayBuffer()

    // Convert to base64
    const base64 = Buffer.from(buffer).toString('base64')
    const mimeType = 'image/jpeg'
    return `data:${mimeType};base64,${base64}`
  } catch {
    // Default blur placeholder
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAAIAAoDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k='
  }
}
