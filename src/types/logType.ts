import { Timestamp } from 'firebase/firestore'

export type LogType = 'MANUAL_WATERING' | 'AUTOMATIC_WATERING' | 'CREATE'

export interface TreeLogEntry {
    type: LogType
    by: string
    byId: string
    loggedAt: Timestamp
    prevWateredUntil: Timestamp | null
    newWateredUntil: Timestamp | null
}

export function createLogEntry(params: {
    type: LogType
    by: string | null
    byId: string | null
    prevWateredUntil?: Timestamp | null
    newWateredUntil?: Timestamp | null
}): TreeLogEntry {
    return {
        type: params.type,
        by: params.by ?? 'system',
        byId: params.byId ?? 'system',
        prevWateredUntil: params.prevWateredUntil ?? null,
        newWateredUntil: params.newWateredUntil ?? null,
        loggedAt: Timestamp.now(),
    }
}
