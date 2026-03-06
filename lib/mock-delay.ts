export function simulateAsync<T>(data: T, delayMs = 800): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delayMs))
}

export function simulateUpload(onProgress: (progress: number) => void): Promise<void> {
  return new Promise((resolve) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        onProgress(100)
        clearInterval(interval)
        setTimeout(resolve, 300)
      } else {
        onProgress(Math.min(progress, 95))
      }
    }, 200)
  })
}

export function simulateOcr(onStage: (stage: string) => void): Promise<void> {
  const stages = [
    'Validating file...',
    'Pre-processing image...',
    'Running OCR extraction...',
    'Recognizing medical entities...',
    'Normalizing units...',
    'Validating markers...',
    'Complete.',
  ]
  return new Promise((resolve) => {
    let i = 0
    const interval = setInterval(() => {
      onStage(stages[i])
      i++
      if (i >= stages.length) {
        clearInterval(interval)
        setTimeout(resolve, 300)
      }
    }, 500)
  })
}
