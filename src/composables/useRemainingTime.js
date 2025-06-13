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

        if (diffMs <= 0) {
            return 'Potrebné poliať'
        }

        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60)
        const seconds = Math.floor((diffMs / 1000) % 60)

        return `Uschne za ${hours}h ${minutes}m ${seconds}s`
    })

    return { remaining }
}