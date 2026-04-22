interface TagProps {
  label: string
}

export function TagPill({ label }: TagProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-bg-tag text-[11px] text-text-secondary leading-none whitespace-nowrap">
      {label}
    </span>
  )
}
