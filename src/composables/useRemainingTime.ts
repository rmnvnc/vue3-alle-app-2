import { computed, unref } from 'vue'
import type { ComputedRef } from 'vue'
import { Timestamp } from 'firebase/firestore/lite'

export function useRemainingTime(wateredUntil: ComputedRef<Timestamp | null>) {
    const remaining = computed(() => {
        const raw = unref(wateredUntil)
        if (!raw) return { text: 'Ešte nezaliaty', days: null }

        const targetDate = raw.toDate()

        const now = Timestamp.now()
        const diffMs = targetDate.getTime() - now.toMillis()

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        return formatDays(days)
    })

    const remainingText = computed(() => remaining.value.text)
    const remainingDays = computed(() => remaining.value.days)

    return { remainingText, remainingDays }
}

function formatDays(count: number) {
    const abs = Math.abs(count)
    let word: string

    if (count < 0) {
        word = abs === 1 ? 'dňom' : 'dňami'
    } else {
        if (abs === 1) {
            word = 'deň'
        } else {
            word = 'dní'
        }
    }
    const text = count < 0 ? `Uschol pred ${abs} ${word}` : `Uschne za ${abs} ${word}`

    return { text, days: count }
}
