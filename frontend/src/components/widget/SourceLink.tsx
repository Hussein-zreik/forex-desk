interface Props {
  /** Display name of the data source, e.g. "alternative.me". */
  name: string
  /** Source / methodology URL. */
  href: string
}

/** A small muted attribution link to a widget's upstream data source. */
export function SourceLink({ name, href }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="no-drag mt-auto block pt-1 text-center text-[10px] tracking-wide text-muted-foreground/70 transition-colors hover:text-primary"
    >
      source: {name} ↗
    </a>
  )
}
