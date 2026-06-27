import { ArrowLeft, BookOpen, Clock3, GraduationCap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn } from '@/lib/cn'
import { CATEGORIES, GLOSSARY, LESSONS, type Lesson, type Level } from '@/lib/learnContent'

const FILTER_OPTIONS = ['All', ...CATEGORIES].map((c) => ({ value: c, label: c }))

const LEVEL_STYLE: Record<Level, string> = {
  Beginner: 'text-up',
  Intermediate: 'text-warning',
  Advanced: 'text-down',
}

function LessonCard({ lesson, onOpen }: { lesson: Lesson; onOpen: () => void }) {
  return (
    <Card
      spotlight
      onClick={onOpen}
      className="flex cursor-pointer flex-col gap-3 p-5 hover:border-border-hover"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge className="border-border-accent">{lesson.category}</Badge>
        <span className={cn('text-[11px] font-medium', LEVEL_STYLE[lesson.level])}>
          {lesson.level}
        </span>
      </div>
      <h3 className="text-base font-semibold tracking-tight">{lesson.title}</h3>
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{lesson.summary}</p>
      <div className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        {lesson.readMins} min read
      </div>
    </Card>
  )
}

function LessonReader({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  return (
    <article className="animate-fade-up mx-auto max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to lessons
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <Badge className="border-border-accent">{lesson.category}</Badge>
        <span className={cn('text-xs font-medium', LEVEL_STYLE[lesson.level])}>{lesson.level}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" />
          {lesson.readMins} min read
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{lesson.summary}</p>

      <div className="mt-10 space-y-10">
        {lesson.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-semibold tracking-tight">{s.heading}</h2>
            <div className="mt-3 space-y-4">
              {s.body.map((p, i) => (
                <p key={i} className="leading-relaxed text-foreground/85">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Card className="mt-10" spotlight>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
            Key takeaways
          </h2>
        </div>
        <ul className="mt-4 space-y-2.5">
          {lesson.takeaways.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>
    </article>
  )
}

export default function Learning() {
  const [filter, setFilter] = useState<string>('All')
  const [openId, setOpenId] = useState<string | null>(null)

  const open = useMemo(() => LESSONS.find((l) => l.id === openId) ?? null, [openId])
  const visible = useMemo(
    () => (filter === 'All' ? LESSONS : LESSONS.filter((l) => l.category === filter)),
    [filter],
  )

  if (open) {
    return <LessonReader lesson={open} onBack={() => setOpenId(null)} />
  }

  return (
    <div className="animate-fade-up space-y-8">
      <header>
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-widest uppercase">Trading Academy</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Learn</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          A focused curriculum for the Forex and gold trader — from market mechanics and price
          structure to risk, psychology and the macro forces that move XAU/USD. Pick a lesson, or
          skim the glossary below.
        </p>
      </header>

      <SegmentedControl
        label="Lesson category"
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons in this category yet"
          description="Pick a different category to keep learning."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} onOpen={() => setOpenId(lesson.id)} />
          ))}
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold tracking-tight">Glossary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The essential vocabulary, defined in plain language.
        </p>
        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.term} className="border-l-2 border-border-accent pl-4">
              <dt className="text-sm font-semibold tracking-tight">{g.term}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{g.def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
