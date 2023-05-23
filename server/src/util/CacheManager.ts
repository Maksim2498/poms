export interface CacheEntry {
    name:         string
    rate:         number
    buffer:       Buffer
    lastModified: Date
}

export type ReadonlyCacheEntry = Readonly<CacheEntry>

export default class CacheManager {
    private  _entries:     Map<string, CacheEntry>   = new Map()
    private  ratedEntries: Map<string, CacheEntry>[] = []
    private  _used:        number                    = 0

    readonly max:          number

    constructor(max: number) {
        this.max = max
    }

    get used(): number {
        return this._used
    }

    entries(): IterableIterator<ReadonlyCacheEntry> {
        return this._entries.values()
    }

    has(name: string): boolean {
        return this._entries.has(name)
    }

    get(name: string): ReadonlyCacheEntry | undefined {
        const entry = this._entries.get(name)

        if (entry == null)
            return undefined

        let sameRateEntries = this.ratedEntries[entry.rate]

        sameRateEntries.delete(name)

        if (sameRateEntries.size === 0)
            delete this.ratedEntries[entry.rate]

        ++entry.rate

        sameRateEntries = this.ratedEntries[entry.rate]

        if (sameRateEntries == null)
            this.ratedEntries[entry.rate] = sameRateEntries = new Map()
        
        sameRateEntries.set(name, entry)

        return entry
    }

    set(name: string, buffer: Buffer): CacheEntry | undefined {
        const newSize = buffer.length

        if (newSize > this.max)
            return undefined

        let entry = this._entries.get(name)

        this.delete(name)

        if (entry == null)
            entry = {
                lastModified: new Date(),
                rate:         0,
                buffer,
                name,
            }
        else {
            entry.lastModified = new Date()
            entry.buffer       = buffer

            ++entry.rate
        }

        let newUsed = this.used + entry.buffer.length

        if (newUsed > this.max) {
            this.freeSpace(newUsed - this.max)
            newUsed = this.used + entry.buffer.length
        }

        let sameRateEntries = this.ratedEntries[entry.rate]

        if (sameRateEntries == null)
            this.ratedEntries[entry.rate] = sameRateEntries = new Map()

        sameRateEntries.set(name, entry)
        this._entries.set(name, entry)

        this._used = newUsed

        return entry
    }

    delete(name: string): boolean {
        const entry = this._entries.get(name)

        if (entry == null)
            return false

        const sameRateEntries = this.ratedEntries[entry.rate]

        sameRateEntries.delete(name)

        if (sameRateEntries.size === 0) {
            delete this.ratedEntries[entry.rate]

            const newLength = this.ratedEntries.findLastIndex(e => e !== undefined) + 1

            this.ratedEntries.length = newLength
        }
        
        this._entries.delete(name)

        this._used -= entry.buffer.length

        return true
    }

    freeSpace(toFree: number): number {
        const toDelete = [] as string[]
        let   freed    = 0

        if (toFree > 0)
            outer:
            for (const i in this.ratedEntries) {
                const sameRateEntries = this.ratedEntries[i]

                for (const entry of sameRateEntries.values()) {
                    toDelete.push(entry.name)

                    freed += entry.buffer.length

                    if (freed >= toFree)
                        break outer
                }
            }

        for (const name of toDelete)
            this.delete(name)

        return freed
    }
}