import bytes      from "bytes"

import { Logger } from "winston"

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
    readonly logger?:      Logger

    constructor(max: number, logger?: Logger) {
        this.max    = max
        this.logger = logger

        logger?.debug(`Created ${bytes(max)} cache`)
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
        this.logger?.debug(`Getting cache entry "${name}"...`)

        const entry = this._entries.get(name)

        if (entry == null) {
            this.logger?.debug("Not found")
            return undefined
        }

        let sameRateEntries = this.ratedEntries[entry.rate]

        sameRateEntries.delete(name)

        if (sameRateEntries.size === 0)
            delete this.ratedEntries[entry.rate]

        ++entry.rate

        sameRateEntries = this.ratedEntries[entry.rate]

        if (sameRateEntries == null)
            this.ratedEntries[entry.rate] = sameRateEntries = new Map()
        
        sameRateEntries.set(name, entry)

        this.logger?.debug(`Got. New rate is ${entry.rate}`)

        return entry
    }

    set(name: string, buffer: Buffer): CacheEntry | undefined {
        this.logger?.debug(`Creating new cache entry "${name}" of size ${bytes(buffer.length)}...`)

        const newSize = buffer.length

        if (newSize > this.max) {
            this.logger?.debug(`Too big. Cache size is ${bytes(this.max)}`)
            return undefined
        }

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

        this.logger?.debug(`Created. Cache usage: ${bytes(this.used)} / ${bytes(this.max)}`)

        return entry
    }

    delete(name: string): boolean {
        this.logger?.debug(`Deleting cache entry "${name}"...`)

        const entry = this._entries.get(name)

        if (entry == null) {
            this.logger?.debug("Not found")
            return false
        }

        const sameRateEntries = this.ratedEntries[entry.rate]

        sameRateEntries.delete(name)

        if (sameRateEntries.size === 0) {
            delete this.ratedEntries[entry.rate]

            const newLength = this.ratedEntries.findLastIndex(e => e !== undefined) + 1

            this.ratedEntries.length = newLength
        }
        
        this._entries.delete(name)

        this._used -= entry.buffer.length

        this.logger?.debug(`Deleted. Cache usage: ${bytes(this.used)} / ${bytes(this.max)}`)

        return true
    }

    freeSpace(toFree: number): number {
        this.logger?.debug(`Freeing at least ${bytes(toFree)} of cache space...`)

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

        this.logger?.debug(`Freed ${bytes(freed)}. Cache usage: ${bytes(this.used)} / ${bytes(this.max)}`)

        return freed
    }
}