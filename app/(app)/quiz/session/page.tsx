"use client"

import { Suspense, useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, X, Trophy, Award, BookOpen, BookX } from "lucide-react"
import { getQuizWords, saveQuizSession } from "@/app/actions/quiz"
import { BADGE_DISPLAY } from "@/lib/badge-display"
import { Button } from "@/components/ui/button"

type QuizMode = "last_lesson" | "last_week" | "random_30"
type Word = Awaited<ReturnType<typeof getQuizWords>>[number]

type GameState = "loading" | "playing" | "results_saving" | "done"

interface Answer {
  wordId: string
  userAnswer: string
  isCorrect: boolean
}

interface QuizResults {
  score: number
  total: number
  xpEarned: number
  missedWords: { word: string; translation: string }[]
  newBadges: string[]
}

const MODE_LABELS: Record<QuizMode, string> = {
  last_lesson: "Last Lesson",
  last_week: "Last Week",
  random_30: "Random 30",
}

function Spinner({ color = "border-t-primary" }: { color?: string }) {
  return (
    <div className={`w-10 h-10 rounded-full border-[3px] border-border ${color} animate-[spin-slow_0.8s_linear_infinite] mx-auto mb-4`} />
  )
}

// Build a cloze (fill-in-the-blank) from the word's first example that has a
// highlighted target word. Returns null if no usable example.
function getCloze(word: Word) {
  const ex = word.lemma?.examples.find((e) => e.targetOffsets.length === 2)
  if (!ex) return null
  const [a, b] = ex.targetOffsets
  return {
    before: ex.sourceText.slice(0, a),
    answer: ex.sourceText.slice(a, b),
    after: ex.sourceText.slice(b),
    translation: ex.targetText,
  }
}

function QuizSessionInner() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get("mode") ?? "random_30") as QuizMode
  const languageId = searchParams.get("lang") ?? undefined
  const style: "words" | "sentences" = searchParams.get("style") === "sentences" ? "sentences" : "words"

  const [gameState, setGameState] = useState<GameState>("loading")
  const [words, setWords] = useState<Word[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [results, setResults] = useState<QuizResults | null>(null)
  const [feedbackClass, setFeedbackClass] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)

  const loadWords = useCallback(async () => {
    setGameState("loading")
    const fetched = await getQuizWords(mode, languageId, style)
    setWords(fetched)
    setGameState(fetched.length > 0 ? "playing" : "done")
  }, [mode, languageId, style])

  useEffect(() => {
    loadWords()
  }, [loadWords])

  useEffect(() => {
    if (gameState === "playing" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [gameState, currentIndex, submitted])

  const currentWord = words[currentIndex]
  const totalWords = words.length
  const cloze = style === "sentences" && currentWord ? getCloze(currentWord) : null
  const useCloze = cloze !== null

  function checkAnswer(input: string, word: Word): boolean {
    const v = input.trim().toLowerCase()
    if (useCloze && cloze) {
      // Accept the exact inflected form in the sentence, or the headword.
      return v === cloze.answer.toLowerCase() || v === word.word.toLowerCase()
    }
    return v === word.translation.trim().toLowerCase()
  }

  function handleSubmit() {
    if (!currentWord || submitted) return
    const isCorrect = checkAnswer(userInput, currentWord)
    const answer: Answer = { wordId: currentWord.id, userAnswer: userInput.trim(), isCorrect }
    setAnswers((prev) => [...prev, answer])
    setFeedbackClass(isCorrect ? "correct" : "incorrect")
    if (isCorrect) setCorrectCount((c) => c + 1)
    setSubmitted(true)
  }

  function handleReveal() {
    if (!currentWord || submitted) return
    setAnswers((prev) => [...prev, { wordId: currentWord.id, userAnswer: "", isCorrect: false }])
    setFeedbackClass("incorrect")
    setRevealed(true)
    setSubmitted(true)
  }

  async function handleNext() {
    const nextIndex = currentIndex + 1
    if (nextIndex >= totalWords) {
      await finishQuiz([...answers])
    } else {
      setCurrentIndex(nextIndex)
      setUserInput("")
      setSubmitted(false)
      setRevealed(false)
      setFeedbackClass("")
    }
  }

  async function finishQuiz(finalAnswers: Answer[]) {
    if (savingRef.current) return
    savingRef.current = true
    setGameState("results_saving")
    const score = finalAnswers.filter((a) => a.isCorrect).length
    try {
      const { xpEarned } = await saveQuizSession({ mode, score, total: totalWords, languageId, answers: finalAnswers })
      const missed = finalAnswers
        .filter((a) => !a.isCorrect)
        .map((a) => { const w = words.find((w) => w.id === a.wordId); return { word: w?.word ?? "", translation: w?.translation ?? "" } })
        .filter((m) => m.word)
      setResults({ score, total: totalWords, xpEarned, missedWords: missed, newBadges: [] })
      setGameState("done")
    } catch {
      setGameState("done")
      setResults({ score, total: totalWords, xpEarned: 0, missedWords: [], newBadges: [] })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (!submitted) handleSubmit()
      else handleNext()
    }
  }

  function resetQuiz() {
    savingRef.current = false
    setCurrentIndex(0)
    setUserInput("")
    setSubmitted(false)
    setRevealed(false)
    setAnswers([])
    setCorrectCount(0)
    setResults(null)
    setFeedbackClass("")
    loadWords()
  }

  if (gameState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner />
          <p className="text-text-muted">Loading your quiz…</p>
        </div>
      </div>
    )
  }

  if (gameState === "results_saving") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner color="border-t-xp" />
          <p className="text-text-muted">Saving your results…</p>
        </div>
      </div>
    )
  }

  if (gameState === "done" && words.length === 0) {
    return (
      <div className="max-w-[520px] mx-auto mt-16 px-4 text-center">
        <div className="flex justify-center mb-4 text-text-muted">
          <BookX size={48} strokeWidth={1.25} />
        </div>
        <h1 className="font-display text-[1.8rem] text-text mb-3">No words for this mode</h1>
        <p className="text-text-muted mb-6 leading-relaxed">
          There are no words available for <strong>{MODE_LABELS[mode]}</strong>. Try a different mode or add more words to your vocabulary.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button className="gap-1.5" nativeButton={false} render={<Link href={`/quiz?style=${style}${languageId ? `&lang=${languageId}` : ""}`} />}>
            <ArrowLeft size={14} strokeWidth={2} /> Choose another mode
          </Button>
          <Button variant="secondary" nativeButton={false} render={<Link href="/vocabulary" />}>Add words</Button>
        </div>
      </div>
    )
  }

  if (gameState === "done" && results) {
    const pct = results.total > 0 ? Math.round((results.score / results.total) * 100) : 0
    const isPerfect = results.score === results.total
    const scoreColor = isPerfect ? "text-success" : pct >= 70 ? "text-primary" : "text-gold"
    const iconColor = isPerfect ? "text-success" : pct >= 70 ? "text-primary" : "text-gold"

    return (
      <div className="animate-fade-in max-w-[560px] mx-auto px-4 py-8">
        <div className="card-elevated p-8 text-center mb-6">
          <div className={`flex justify-center mb-2 ${iconColor}`}>
            {isPerfect ? <Trophy size={48} strokeWidth={1.5} /> : pct >= 70 ? <Award size={48} strokeWidth={1.5} /> : <BookOpen size={48} strokeWidth={1.5} />}
          </div>
          <h1 className="font-display text-[clamp(1.8rem,5vw,2.4rem)] text-text mb-1">
            {isPerfect ? "Perfect score!" : pct >= 70 ? "Great work!" : "Keep it up!"}
          </h1>
          <div className={`font-display text-[3.5rem] font-extrabold leading-none my-3 ${scoreColor}`}>
            {results.score} / {results.total}
          </div>
          <div className="animate-pop inline-flex items-center gap-1.5 bg-xp-bg text-xp mt-2 px-4 py-1.5 rounded-full font-bold text-base">
            +{results.xpEarned} XP
          </div>
        </div>

        {results.newBadges.length > 0 && (
          <div className="card animate-pop p-5 mb-4 text-center">
            <p className="font-display text-text mb-2">New badges earned!</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {results.newBadges.map((key) => (
                <span key={key} className="badge bg-gold text-white text-[0.9rem] px-3.5 py-1.5">
                  {BADGE_DISPLAY[key] ?? key}
                </span>
              ))}
            </div>
          </div>
        )}

        {results.missedWords.length > 0 && (
          <div className="card p-5 mb-5">
            <h2 className="font-display text-text mb-3">Words to review ({results.missedWords.length})</h2>
            <div className="flex flex-col gap-1.5">
              {results.missedWords.map((m, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-error-bg rounded-[var(--radius-sm)] text-[0.9rem]">
                  <X size={14} strokeWidth={2.5} className="text-error shrink-0" />
                  <span className="font-semibold text-text">{m.word}</span>
                  <span className="text-text-muted">→</span>
                  <span className="text-text-secondary">{m.translation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button onClick={resetQuiz}>Try again</Button>
          <Button variant="secondary" nativeButton={false} render={<Link href="/vocabulary" />}>Back to vocabulary</Button>
          <Button variant="ghost" nativeButton={false} render={<Link href="/dashboard" />}>Dashboard</Button>
        </div>
      </div>
    )
  }

  if (!currentWord) return null

  const progressPct = ((currentIndex + 1) / totalWords) * 100
  const isCorrectAnswer = submitted && checkAnswer(userInput, currentWord)

  return (
    <div className="animate-fade-in max-w-[560px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-[0.82rem]"
          nativeButton={false}
          render={<Link href={`/quiz?style=${style}${languageId ? `&lang=${languageId}` : ""}`} />}
        >
          <ArrowLeft size={14} strokeWidth={2} /> {MODE_LABELS[mode]}
        </Button>
        <span className="text-[0.88rem] text-text-muted font-semibold">
          {correctCount} / {currentIndex + (submitted ? 1 : 0)} correct
        </span>
      </div>

      {/* Progress */}
      <div className="mb-7">
        <div className="flex justify-between text-[0.8rem] text-text-muted mb-1.5">
          <span>Question {currentIndex + 1} of {totalWords}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-1.5 bg-bg-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-[width] duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Quiz card */}
      <div
        className={[
          "card-elevated relative overflow-hidden transition-all duration-200 px-8 py-10 text-center mb-4",
          submitted
            ? isCorrectAnswer
              ? "border-2 border-success bg-success-bg"
              : "border-2 border-error bg-error-bg"
            : "",
          feedbackClass === "incorrect" ? "animate-shake" : "",
        ].join(" ")}
      >
        {submitted && (
          <div className="absolute top-3.5 right-4">
            {isCorrectAnswer
              ? <Check size={20} strokeWidth={2.5} className="text-success" />
              : <X size={20} strokeWidth={2.5} className="text-error" />
            }
          </div>
        )}

        {useCloze && cloze ? (
          <>
            <p className="text-[0.82rem] text-text-muted mb-3">Fill in the blank</p>
            <div className="font-display text-[clamp(1.3rem,3.5vw,1.7rem)] font-bold text-text leading-[1.5] mb-3">
              {cloze.before}
              {submitted ? (
                <mark className="bg-primary-subtle text-primary rounded-sm px-1 mx-0.5">{cloze.answer}</mark>
              ) : (
                <span className="text-primary tracking-widest font-black mx-0.5">_____</span>
              )}
              {cloze.after}
            </div>
            <p className={`text-[0.95rem] text-text-secondary ${submitted ? "mb-3" : "mb-6"}`}>{cloze.translation}</p>
          </>
        ) : (
          <>
            <p className="text-[0.82rem] text-text-muted mb-2">Translate this word</p>
            <div className={`font-display text-[clamp(2rem,6vw,2.8rem)] font-bold text-text leading-[1.2] ${submitted ? "mb-4" : "mb-6"}`}>
              {currentWord.word}
            </div>
          </>
        )}

        {submitted && (
          <div className="animate-fade-in">
            <p className="text-[0.82rem] text-text-muted mb-1">
              {isCorrectAnswer ? "Correct!" : "The answer was"}
            </p>
            <p className={`text-[1.2rem] font-bold ${isCorrectAnswer ? "text-success" : "text-error"}`}>
              {useCloze && cloze ? cloze.answer : currentWord.translation}
            </p>
            {!isCorrectAnswer && userInput && (
              <p className="text-[0.85rem] text-text-muted mt-1">
                You answered: {revealed ? <em>revealed</em> : `"${userInput}"`}
              </p>
            )}
          </div>
        )}

        {!submitted && (
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              className="input text-center text-[1.05rem]"
              placeholder={useCloze ? "Type the missing word…" : "Type the translation…"}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button size="lg" onClick={handleSubmit} disabled={!userInput.trim()}>
              Submit
            </Button>
            <Button variant="ghost" size="sm" className="text-text-muted text-[0.82rem]" onClick={handleReveal}>
              Reveal answer (counts as incorrect)
            </Button>
          </div>
        )}
      </div>

      {submitted && (
        <div className="animate-fade-in text-center">
          <Button size="lg" onClick={handleNext} disabled={savingRef.current}>
            {currentIndex + 1 >= totalWords
              ? "See results"
              : <span className="inline-flex items-center gap-1.5">Next <ArrowRight size={16} strokeWidth={2} /></span>
            }
          </Button>
        </div>
      )}
    </div>
  )
}

export default function QuizSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-[3px] border-border border-t-primary animate-[spin-slow_0.8s_linear_infinite]" />
        </div>
      }
    >
      <QuizSessionInner />
    </Suspense>
  )
}
