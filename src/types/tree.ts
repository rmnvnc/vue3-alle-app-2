import { TreeLogEntry } from '@/types/log'
import { Timestamp } from 'firebase/firestore'

/**
 * Základný typ stromu – zodpovedá dátam uloženým vo Firestore v dokumente stromu.
 */
export interface Tree {
    id: string
    name: string
    slug: string
    type: 'tree'
    createdBy: string
    createdAt: Timestamp | Date
    updatedAt: Timestamp | Date
    wateredUntil?: Timestamp | null
    owner: string | null
    variety: string | null
}

/**
 * Rozšírený typ stromu s logmi – používa sa napríklad v cache alebo UI.
 */
export interface TreeWithLogs extends Tree {
    logs: TreeLogEntry[]
}
