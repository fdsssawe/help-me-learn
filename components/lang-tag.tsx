function langHue(name: string): number {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return h % 360
}

export function LangTag({ name }: { name: string }) {
  const hue = langHue(name)
  return (
    <span className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-text-secondary">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: `hsl(${hue}, 55%, 52%)` }}
      />
      {name}
    </span>
  )
}

export function LangDot({ name, size = 8 }: { name: string; size?: number }) {
  const hue = langHue(name)
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: `hsl(${hue}, 55%, 52%)` }}
    />
  )
}
