const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin')
admin.initializeApp()
const db = admin.firestore()
const { FieldValue } = admin.firestore

exports.dailyPrecipHistory = onSchedule(
    { schedule: "5 1 * * *", timeZone: "Europe/Bratislava" },
    async (context) => {
        const now = new Date();
        const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        const yyyy = yest.getFullYear()
        const mm = String(yest.getMonth() + 1).padStart(2, '0')
        const dd = String(yest.getDate()).padStart(2, '0')
        const dateStr = `${yyyy}-${mm}-${dd}`

        const shmuDoc = await db.collection('shmu').doc(dateStr).get()
        if (!shmuDoc.exists) {
            console.warn(`Missing shmu/${dateStr}`)
            return null
        }

        const dailyPrecip = shmuDoc.get('dailyPrecip') || {}

        const orgsSnap = await db.collection('organizations').get()
        for (const orgDoc of orgsSnap.docs) {
            const orchSnap = await orgDoc.ref.collection('orchards').get()
            for (const orchDoc of orchSnap.docs) {
                const data = orchDoc.data()
                const station = data.shmuStation
                if (!station) continue
                const prec = dailyPrecip[station] || 0
                await orchDoc.ref.update({
                    last24hPrecip: prec,
                    dailyPrecipHistory: FieldValue.arrayUnion({ date: dateStr, precip: prec })
                })
            }
        }
        console.log(`dailyPrecipHistory done for ${dateStr}`);
        return null;
    }

)