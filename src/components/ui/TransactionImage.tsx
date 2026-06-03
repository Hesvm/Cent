import { useState, useEffect } from 'react'
import { getCategoryImage } from '../../utils/transactionImages'
import { CATEGORY_FALLBACK_URL } from '../../config/categories'
import { inferCategory } from '../../hooks/useAIParsing'

interface TransactionImageProps {
  category: string | null
  name: string
  size?: number
}

// When category is null, try to infer one from the transaction name
function resolveCategory(category: string | null, name: string): string | null {
  if (category) return category
  const { category: inferred, confidence } = inferCategory(name)
  return confidence >= 0.75 ? inferred : null
}

export function TransactionImage({ category, name, size = 36 }: TransactionImageProps) {
  // Compute the resolved URL on every render (pure function, cheap)
  const resolvedSrc = getCategoryImage(resolveCategory(category, name))

  const [src, setSrc] = useState(resolvedSrc)
  const [loaded, setLoaded] = useState(false)

  // Only reset the image (and its loaded state) when the URL itself changes,
  // not when category/name change independently — avoids re-triggering
  // lazy-load after partial hydration updates.
  useEffect(() => {
    setSrc(resolvedSrc)
    setLoaded(false)
  }, [resolvedSrc])

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
        loading="lazy"
        decoding="async"
        className={`object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
        style={{ width: size, height: size }}
        onLoad={() => setLoaded(true)}
        onError={() => { setSrc(CATEGORY_FALLBACK_URL); setLoaded(true) }}
      />
    </div>
  )
}
