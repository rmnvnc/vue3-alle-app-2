import { Timestamp } from 'firebase/firestore'

export type LogType = 'MANNUAL_WATERING' | 'AUTOMATIC_WATERING' | 'CREATE'

export interface TreeLogEntry {
    id: string
    type: LogType
    by: string
    byId: string
    loggedAt: Timestamp
    prevWateredUntil: Timestamp | null
    newWateredUntil: Timestamp | null
}

export function createLogEntry(params: {
    id: string
    type: LogType
    by: string
    byId: string
    prevWateredUntil?: Timestamp | null
    newWateredUntil?: Timestamp | null
}): TreeLogEntry {
    return {
        id: params.id,
        type: params.type,
        by: params.by ?? 'system',
        byId: params.byId ?? 'system',
        prevWateredUntil: params.prevWateredUntil ?? null,
        newWateredUntil: params.newWateredUntil ?? null,
        loggedAt: Timestamp.now(),
    }
}
