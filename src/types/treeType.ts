import { TreeLogEntry } from '@/types/logType'
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
    createdAt: Timestamp
    updatedAt: Timestamp
    wateredUntil: Timestamp | null
    owner: string | null
    variety: string | null
}

/**
 * Rozšírený typ stromu s logmi – používa sa napríklad v cache alebo UI.
 */
export interface TreeWithLogs extends Tree {
    logs: TreeLogEntry[]
}

export type TreeUpdate = Partial<Pick<Tree, 'name' | 'slug' | 'wateredUntil' | 'updatedAt'>>
