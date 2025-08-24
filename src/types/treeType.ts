import { Timestamp } from 'firebase/firestore/lite'

export type HydratationLevel = 'summary' | 'full'
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

export interface TreeEntity {
    data: Tree
    hydratation: HydratationLevel
    fetchedAt: number
}

export interface TreeIndex {
    ids: string[]
    fetchedAt: number
}
