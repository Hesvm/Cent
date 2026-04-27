import { useState, useEffect } from 'react'
import { getCategoryImage } from '../../utils/transactionImages'
import { CATEGORY_FALLBACK_URL } from '../../config/categories'

interface TransactionImageProps {
  category: string | null
  name: string
  size?: number
}

export function TransactionImage({ category, name, size = 36 }: TransactionImageProps) {
  const [src, setSrc] = useState(() => getCategoryImage(category))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setSrc(getCategoryImage(category))
    setLoaded(false)
  }, [category])

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
        onError={() => { setSrc(CATEGORY_FALLBACK_URL); setLoaded(true) }}
      />
    </div>
  )
}
