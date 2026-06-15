import { getWords } from "@/app/actions/words"
import { getLanguages } from "@/app/actions/languages"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/dal"
import { VocabularyClient } from "./vocabulary-client"

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const { lang } = await searchParams
  const user = await getCurrentUser()
  const [words, languages, totalWords] = await Promise.all([
    getWords(lang),
    getLanguages(),
    user ? prisma.word.count({ where: { userId: user.id } }) : Promise.resolve(0),
  ])
  return (
    <VocabularyClient
      words={words}
      languages={languages}
      activeLangId={lang}
      plan={user?.plan ?? "free"}
      totalWords={totalWords}
    />
  )
}
