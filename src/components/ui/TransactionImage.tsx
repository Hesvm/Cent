import { useState, useEffect } from 'react'
import { getImageSlug, getImageUrl, preloadAndCache } from '../../utils/transactionImages'

interface TransactionImageProps {
  category: string
  name: string
  size?: number
}

export function TransactionImage({ category, name, size = 36 }: TransactionImageProps) {
  const slug = getImageSlug(category, name)
  const fallbackUrl = getImageUrl(slug)
  const [src, setSrc] = useState<string>(fallbackUrl)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    preloadAndCache(slug).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => { cancelled = true }
  }, [slug])

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {!loaded && (
        <div
          className="shimmer rounded-full"
          style={{ width: size, height: size }}
        />
      )}
      <img
        src={src}
        alt={name}
        className={`object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
        style={{ width: size, height: size }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  )
}
