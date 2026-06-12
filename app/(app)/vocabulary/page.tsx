import { getWords } from "@/app/actions/words"
import { getLanguages } from "@/app/actions/languages"
import { VocabularyClient } from "./vocabulary-client"

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const { lang } = await searchParams
  const [words, languages] = await Promise.all([getWords(lang), getLanguages()])
  return <VocabularyClient words={words} languages={languages} activeLangId={lang} />
}
