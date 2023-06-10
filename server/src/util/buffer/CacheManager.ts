import bytes        from "bytes"
import DeepReadonly from "util/type/DeepReadonly"

import { Logger   } from "winston"

export interface CacheEntry {
    keys:         CacheEntryKey[]
    rate:         number
    buffer:       Buffer
    lastModified: Date
}

export type ReadonlyCacheEntry = DeepReadonly<CacheEntry>

export type CacheEntryMultikey = CacheEntryKey[]
                               | CacheEntryKey

export type CacheEntryKey = string
                          | symbol
                          | number

export interface CacheEntryBufferSet {
    [key: CacheEntryKey]: Buffer | undefined
}

export default class CacheManager {
    private  _keyToId:     Map<CacheEntryKey, number> = new Map() // Maps keys to IDs
    private  _idToEntry:   Map<number, CacheEntry>    = new Map() // Maps IDs to entries
    private  _rateToIds:   Set<number>[]              = []        // Maps rates to ID-sets
    private  _lastId:      number                     = 0
    private  _used:        number                     = 0

    readonly max:          number
    readonly logger:       Logger | null

    constructor(max: number, logger: Logger | null = null) {
        if (max < 0)
            throw new Error("Maximum size is negative")

        if (Number.isNaN(max))
            throw new Error("Maximum size is NaN")

        this.max    = max
        this.logger = logger ?? null

        logger?.debug(`${bytes(max)} cache created`)
    }

    get used(): number {
        return this._used
    }

    entries(): IterableIterator<ReadonlyCacheEntry> {
        return this._idToEntry.values()
    }

    has(key: CacheEntryKey): boolean {
        return this._keyToId.has(key)
    }

    peek(key: CacheEntryKey): ReadonlyCacheEntry | undefined {
        const id = this._keyToId.get(key)

        if (id == null)
            return undefined

        const entry = this._idToEntry.get(id)

        if (entry == null)
            this._integrityError()

        return entry
    }

    get(key: CacheEntryKey): ReadonlyCacheEntry | undefined {
        this.logger?.debug(`Getting cache entry ${cacheEntryKeyToString(key)}...`)

        const id = this._keyToId.get(key)

        if (id == null) {
            this.logger?.debug("Not found")
            return undefined
        }

        const entry = this._idToEntry.get(id)

        if (entry == null)
            this._integrityError()

        let sameRateIds = this._rateToIds[entry.rate]

        if (sameRateIds == null)
            this._integrityError()

        sameRateIds.delete(id)

        if (sameRateIds.size === 0)
            delete this._rateToIds[entry.rate]

        sameRateIds = this._rateToIds[++entry.rate]

        if (sameRateIds == null)
            this._rateToIds[entry.rate] = sameRateIds = new Set()

        sameRateIds.add(id)

        this.logger?.debug(`Got. New rate is ${entry.rate}`)

        return entry
    }

    set(key: CacheEntryMultikey, buffer: Buffer): CacheEntry | undefined {
        this.logger?.debug(`Creating new cache entry ${cacheEntryMultikeyToString(key)} of size ${bytes(buffer.length)}...`)

        const keys = cacheEntryMultikeyToCacheEntryKeyArray(key)

        if (keys.length === 0) {
            this.logger?.debug("Cache entries with zero keys aren't allowed")
            return undefined
        }

        for (const key of keys)
            if (this._keyToId.has(key)) {
                this.logger?.debug(`Cache entry ${cacheEntryKeyToString(key)} alredy exists`)
                return undefined
            }

        const size = buffer.length

        if (size > this.max) {
            this.logger?.debug(`Too big. Cache size is ${bytes(this.max)}`)
            return undefined
        }

        let newUsed = this.used + size

        if (newUsed > this.max) {
            this.freeSpace(newUsed - this.max)
            newUsed = this.used + size
        }

        const rate = 0

        let sameRateIds = this._rateToIds[rate]

        if (sameRateIds == null)
            this._rateToIds[rate] = sameRateIds = new Set()

        const id = this._lastId++

        sameRateIds.add(id)

        const entry = {
            lastModified: new Date,
            buffer,
            keys,
            rate,
        }

        this._idToEntry.set(id, entry)

        for (const key of keys)
            this._keyToId.set(key, id)

        this._used = newUsed

        this.logger?.debug(`Created. ${this._makeCacheUsageString()}`)

        return entry
    }

    clear() {
        this._keyToId.clear()
        this._idToEntry.clear()

        this._rateToIds.length = 0
        this._lastId           = 0
        this._used             = 0
    }

    delete(key: CacheEntryKey): boolean {
        this.logger?.debug(`Deleting cache entry ${cacheEntryKeyToString(key)}...`)

        const id = this._keyToId.get(key)

        if (id == null) {
            this.logger?.debug("Not found")
            return false
        }

        const entry = this._idToEntry.get(id)

        if (entry == null)
            this._integrityError()

        if (entry.keys.length > 1)
            this.logger?.debug(`Found other names: ${cacheEntryKeysToString(entry.keys.slice(1))}`)

        const sameRateIds = this._rateToIds[entry.rate]

        if (sameRateIds == null)
            this._integrityError()

        sameRateIds.delete(id)

        if (sameRateIds.size === 0) {
            delete this._rateToIds[entry.rate]

            const newLength = this._rateToIds.findLastIndex(e => e !== undefined) + 1

            this._rateToIds.length = newLength
        }

        this._idToEntry.delete(id)

        for (const key of entry.keys)
            this._keyToId.delete(key)

        this._used -= entry.buffer.length

        if (this._keyToId.size === 0)
            this._lastId = 0

        this.logger?.debug(`Deleted. ${this._makeCacheUsageString()}`)

        return true
    }

    freeSpace(toFree: number): number {
        this.logger?.debug(`Freeing at least ${bytes(toFree)} of cache space...`)

        const toDelete = new Array<CacheEntryKey>()

        let freed = 0

        if (toFree > 0)
            outer:
            for (const i in this._rateToIds) {
                const sameRateIds = this._rateToIds[i]!

                for (const id of sameRateIds) {
                    const entry = this._idToEntry.get(id)

                    if (entry == null)
                        this._integrityError()

                    const key = entry.keys[0]

                    if (key == null)
                        this._integrityError()

                    toDelete.push(key)

                    freed += entry.buffer.length

                    if (freed >= toFree)
                        break outer
                }
            }

        for (const name of toDelete)
            this.delete(name)

        this.logger?.debug(`Freed ${bytes(freed)}. ${this._makeCacheUsageString()}`)

        return freed
    }

    private _integrityError(): never {
        throw new Error("Cache manager integrity is broken")
    }

    private _makeCacheUsageString(): string {
        return `Cache usage: ${bytes(this.used)} / ${bytes(this.max)}`
    }
}

export function cacheEntryMultikeyToCacheEntryKeyArray(key: CacheEntryMultikey): CacheEntryKey[] {
    return Array.isArray(key) ? [...key]
                              : [key]
}

export function cacheEntryMultikeyToString(key: CacheEntryMultikey): string {
    return Array.isArray(key) ? cacheEntryKeysToString(key)
                              : cacheEntryKeyToString(key)
}

export function cacheEntryKeysToString(keys: CacheEntryKey[]): string {
    return keys.map(cacheEntryKeyToString)
               .join(", ")
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