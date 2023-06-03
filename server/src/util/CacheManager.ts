import bytes        from "bytes"
import DeepReadonly from "./DeepReadonly"

import { Logger   } from "winston"

export interface CacheEntry {
    key:          CacheEntryKey
    rate:         number
    buffer:       Buffer
    lastModified: Date
}

export type ReadonlyCacheEntry = DeepReadonly<CacheEntry>

export type CacheEntryKey = string
                          | symbol
                          | number

export interface CacheEntryBufferSet {
    [key: CacheEntryKey]: Buffer | undefined
}

export default class CacheManager {
    private  _entries:     Map<CacheEntryKey, CacheEntry>   = new Map()
    private  ratedEntries: Map<CacheEntryKey, CacheEntry>[] = []
    private  _used:        number                           = 0

    readonly max:          number
    readonly logger:       Logger | null

    constructor(max: number, logger: Logger | null = null) {
        this.max    = max
        this.logger = logger ?? null

        logger?.debug(`${bytes(max)} cache created`)
    }

    get used(): number {
        return this._used
    }

    entries(): IterableIterator<ReadonlyCacheEntry> {
        return this._entries.values()
    }

    has(key: CacheEntryKey): boolean {
        return this._entries.has(key)
    }

    get(key: CacheEntryKey): ReadonlyCacheEntry | undefined {
        this.logger?.debug(`Getting cache entry ${cacheEntryKeyToString(key)}...`)

        const entry = this._entries.get(key)

        if (entry == null) {
            this.logger?.debug("Not found")
            return undefined
        }

        let sameRateEntries = this.ratedEntries[entry.rate]!

        sameRateEntries.delete(key)

        if (sameRateEntries.size === 0)
            delete this.ratedEntries[entry.rate]

        ++entry.rate

        sameRateEntries = this.ratedEntries[entry.rate]!

        if (sameRateEntries == null)
            this.ratedEntries[entry.rate] = sameRateEntries = new Map()
        
        sameRateEntries.set(key, entry)

        this.logger?.debug(`Got. New rate is ${entry.rate}`)

        return entry
    }

    set(key: CacheEntryKey, buffer: Buffer): CacheEntry | undefined {
        this.logger?.debug(`Creating new cache entry ${cacheEntryKeyToString(key)} of size ${bytes(buffer.length)}...`)

        const size = buffer.length

        if (size > this.max) {
            this.logger?.debug(`Too big. Cache size is ${bytes(this.max)}`)
            return undefined
        }

        let entry = this._entries.get(key)

        this.delete(key)

        if (entry == null)
            entry = {
                lastModified: new Date(),
                rate:         0,
                key,
                buffer,
            }
        else {
            entry.lastModified = new Date()
            entry.buffer       = buffer

            ++entry.rate
        }

        let newUsed = this.used + size

        if (newUsed > this.max) {
            this.freeSpace(newUsed - this.max)
            newUsed = this.used + size
        }

        let sameRateEntries = this.ratedEntries[entry.rate]

        if (sameRateEntries == null)
            this.ratedEntries[entry.rate] = sameRateEntries = new Map()

        sameRateEntries.set(key, entry)
        this._entries.set(key, entry)

        this._used = newUsed

        this.logger?.debug(`Created. ${this.makeCacheUsageString()}`)

        return entry
    }

    delete(key: CacheEntryKey): boolean {
        this.logger?.debug(`Deleting cache entry ${cacheEntryKeyToString(key)}...`)

        const entry = this._entries.get(key)

        if (entry == null) {
            this.logger?.debug("Not found")
            return false
        }

        const sameRateEntries = this.ratedEntries[entry.rate]!

        sameRateEntries.delete(key)

        if (sameRateEntries.size === 0) {
            delete this.ratedEntries[entry.rate]

            const newLength = this.ratedEntries.findLastIndex(e => e !== undefined) + 1

            this.ratedEntries.length = newLength
        }
        
        this._entries.delete(key)

        this._used -= entry.buffer.length

        this.logger?.debug(`Deleted. ${this.makeCacheUsageString()}`)

        return true
    }

    freeSpace(toFree: number): number {
        this.logger?.debug(`Freeing at least ${bytes(toFree)} of cache space...`)

        const toDelete = [] as CacheEntryKey[]
        let   freed    = 0

        if (toFree > 0)
            outer:
            for (const i in this.ratedEntries) {
                const sameRateEntries = this.ratedEntries[i]!

                for (const entry of sameRateEntries.values()) {
                    toDelete.push(entry.key)

                    freed += entry.buffer.length

                    if (freed >= toFree)
                        break outer
                }
            }

        for (const name of toDelete)
            this.delete(name)

        this.logger?.debug(`Freed ${bytes(freed)}. ${this.makeCacheUsageString()}`)

        return freed
    }

    private makeCacheUsageString(): string {
        return `Cache usage: ${bytes(this.used)} / ${bytes(this.max)}`
    }
}

export function cacheEntryKeyToString(key: CacheEntryKey): string {
    switch (typeof key) {
        case "string":
            return `"${key}"`

        case "bigint":
        case "symbol":
        case "number":
            return key.toString()
    }
}