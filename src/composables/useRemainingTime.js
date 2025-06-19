import { computed, unref } from 'vue'
import { Timestamp } from 'firebase/firestore'

export function useRemainingTime(wateredUntil) {
    const remaining = computed(() => {
        const raw = unref(wateredUntil)
        if (!raw) return ''

        // ak je to Firestore Timestamp, premeň ho na Date
        let targetDate
        if (raw instanceof Timestamp) {
            targetDate = raw.toDate()
        } else if (raw.toDate) {
            // prípadne pre staršie verzie SDK: raw.toDate()
            targetDate = raw.toDate()
        } else {
            // ak by to náhodou už bol reťazec alebo číslo
            targetDate = new Date(raw)
        }

        const now = new Date()
        const diffMs = targetDate - now

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        return formatDays(days)
    })

    const remainingText = computed(() => remaining.value.text)
    const remainingDays = computed(() => remaining.value.days)

    return { remainingText, remainingDays }
}

function formatDays(count) {
    const abs = Math.abs(count)
    const lastTwoDigits = abs % 100
    const lastDigit = abs % 10

    let word

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        word = 'dňami'
    } else if (lastDigit === 1) {
        word = count < 0 ? 'dňom' : 'deň'
    } else if (lastDigit >= 2 && lastDigit <= 4) {
        word = count < 0 ? 'dňami' : 'dni'
    } else {
        word = 'dňami'
    }
    const text = count < 0
        ? `Vyschol pred ${abs} ${word}`
        : `Uschne za ${abs} ${word}`

    return { text, days: abs }
}