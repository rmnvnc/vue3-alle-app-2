import { ref } from 'vue'
import { defineStore } from 'pinia'
import { collection, doc, getDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'


export const useOrganizationsStore = defineStore('organizations', () => {
    const organization = ref(null)
    const orchards = ref([])
    const treesByOrchard = ref({})
    const loading = ref(false)
    const error = ref(null)

    async function fetchOrganization(orgId) {
        console.log('[🐶] fetchOrganization running')
        loading.value = true
        error.value = null

        try {
            if (!orgId) {
                throw new Error('Organization ID missing')
            }

            // Load organization Document
            const orgDocRef = doc(db, 'organizations', orgId)
            const orgSnapshot = await getDoc(orgDocRef)

            if (!orgSnapshot.exists()) {
                throw new Error(`Organization with ID "${orgId}" does not exist`)
            }

            organization.value = { id: orgSnapshot.id, ...orgSnapshot.data() }

            // Load orchards in Organization
            const orchardsCol = collection(db, 'organizations', orgId, 'orchards')
            const orchardsSnap = await getDocs(orchardsCol)

            orchards.value = orchardsSnap.docs.map(docSnapshot => ({
                id: docSnapshot.id,
                ...docSnapshot.data()
            }))

        } catch (err) {
            console.error('Error when loading:', err)
            error.value = err.message || 'Failed to load organization.'
        } finally {
            loading.value = false
        }
    }

    async function fetchTrees(orgId, orchardId) {
        console.log('[🐶] fetchTrees running')
        loading.value = true
        error.value = null

        try {
            if (!orgId || !orchardId) {
                throw new Error('Organization ID or Orchard ID missing')
            }
            const treesSnap = await getDocs(
                collection(db, 'organizations', orgId, 'orchards', orchardId, 'trees')
            );
            treesByOrchard.value[orchardId] = treesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        organization,
        orchards,
        treesByOrchard,
        fetchOrganization,
        fetchTrees
    }


})