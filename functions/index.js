const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin')
admin.initializeApp()
const db = admin.firestore()
const { FieldValue, Timestamp } = admin.firestore

exports.dailyPrecipHistory = onSchedule(
    { schedule: "0 6 * * *", timeZone: "Europe/Bratislava" },
    async () => {
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

                const precMm = dailyPrecip[station] || 0

                await orchDoc.ref.update({
                    last24hPrecip: precMm,
                    dailyPrecipHistory: FieldValue.arrayUnion({ date: dateStr, precip: precMm })
                })

                const logTime = Timestamp.now();

                const treesSnap = await orchDoc.ref.collection("trees").get();
                const hoursToAdd = computeWateringHours(precMm);
                const nowTs = logTime;

                if (hoursToAdd === 0) {
                    console.log(
                        `V Sade nepršalo`
                    );
                    continue
                }

                const batch = db.batch();
                for (const treeDoc of treesSnap.docs) {
                    const treeData = treeDoc.data();
                    const existing = treeData.wateredUntil instanceof Timestamp
                        ? treeData.wateredUntil
                        : nowTs;

                    const baseline = existing.toMillis() > nowTs.toMillis()
                        ? existing
                        : nowTs;

                    const newUntil = Timestamp.fromMillis(
                        baseline.toMillis() + hoursToAdd * 3600 * 1000
                    );

                    batch.update(treeDoc.ref, {
                        wateredUntil: newUntil
                    });

                    const logRef = treeDoc.ref.collection('logs').doc()
                    batch.set(logRef, {
                        type: 'AUTO_WATERING',
                        by: 'rain',
                        prevWateredUntil: existing,
                        newWateredUntil: newUntil,
                        addedHours: hoursToAdd,
                        loggedAt: logTime
                    })
                }
                await batch.commit();

                console.log(
                    `Sad ${orgDoc.id}/${orchDoc.id}: prec=${precMm} mm → ` +
                    `pridávam ${hoursToAdd} h pre ${treesSnap.size} stromov`
                );
            }
        }
        console.log(`dailyPrecipHistory done for ${dateStr}`);
        return null;
    }

)

function computeWateringHours(precipMm) {
    if (precipMm <= 2) return 0;
    if (precipMm <= 5) return 3 * 24;
    if (precipMm <= 10) return 6 * 24;
    if (precipMm <= 15) return 10 * 24;
    if (precipMm <= 20) return 13 * 24;
    if (precipMm <= 25) return 16 * 24;
    if (precipMm <= 30) return 20 * 24;
    if (precipMm <= 35) return 23 * 24;
    if (precipMm <= 40) return 26 * 24;

    return 30 * 24;
}