export async function checkImageSafe(base64Image: string): Promise<{ safe: boolean; reason?: string }> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY
  if (!apiKey) {
    console.error('GOOGLE_CLOUD_API_KEY is not defined in environment variables.')
    // If not configured, we allow it or reject it? Let's allow but log a warning.
    return { safe: true }
  }

  // Remove data URI prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Data,
              },
              features: [
                {
                  type: 'SAFE_SEARCH_DETECTION',
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Google Vision API responded with status ${response.status}: ${errText}`)
    }

    const data = await response.json()
    const annotation = data.responses?.[0]?.safeSearchAnnotation

    if (!annotation) {
      return { safe: true } // No annotation found, default to safe
    }

    const unsafeLevels = ['LIKELY', 'VERY_LIKELY']
    const flags = {
      adult: annotation.adult,
      violence: annotation.violence,
      racy: annotation.racy,
      medical: annotation.medical,
      spoof: annotation.spoof,
    }

    if (unsafeLevels.includes(flags.adult)) {
      return { safe: false, reason: 'Adult content detected' }
    }
    if (unsafeLevels.includes(flags.violence)) {
      return { safe: false, reason: 'Violent content detected' }
    }
    if (unsafeLevels.includes(flags.racy)) {
      return { safe: false, reason: 'Racy or suggestive content detected' }
    }

    return { safe: true }
  } catch (error) {
    console.error('Error calling Google Vision API:', error)
    // In production, we might want to fail-open or fail-closed. Here, we fail-open but log.
    return { safe: true }
  }
}
