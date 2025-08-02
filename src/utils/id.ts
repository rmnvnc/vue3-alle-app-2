export function generateRandomId(length = 4) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let id = ''
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * charset.length)
        id += charset[idx]
    }
    return id
}

export function generateSlug(str: string) {
    const delimiter = '-'

    return (
        str
            // 1. odstránime nadbytočné medzery na kraji
            .trim()
            // 2. Unicode normalizácia do NFD – dekomponuje písmená + diakritiku
            .normalize('NFD')
            // 3. odstránime všetky kombinačné diakritické znaky
            .replace(/[\u0300-\u036f]/g, '')
            // 4. nahradíme medzery a viacnásobné delimiter jedným delimiterom
            .replace(/\s+/g, delimiter)
            .replace(new RegExp(`${delimiter}{2,}`, 'g'), delimiter)
            // 5. na lowercase
            .toLowerCase()
            // 6. odstránime všetko, čo nie je a–z, 0–9 alebo delimiter
            .replace(new RegExp(`[^a-z0-9${delimiter}]`, 'g'), '')
            // 7. odstránime delimiter na začiatku/konci
            .replace(new RegExp(`^${delimiter}|${delimiter}$`, 'g'), '')
    )
}
