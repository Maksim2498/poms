import Config                         from "Config";
import DeepReadonly                   from "util/DeepReadonly";

import { Logger                     } from "winston";
import { Connection                 } from "mysql2/promise";
import { JavaStatusResponse, status } from "minecraft-server-util"
import { deepAssign                 } from "util/object";
import { NicknameManager            } from "./nickname";

export interface CreationOptions {
    readonly nicknameManager: NicknameManager
    readonly config:          Config
    readonly logger?:         Logger
}

export interface Fetch {
    version: {
        name:         string
        protocol:     number
    }

    players: {
        online:       number
        max:          number
        sample: {
            nickname: string
            login:    string | null
        }[]
    }

    motd: {
        raw:          string
        clean:        string
        html:         string
    }

    address:          string | null
    favicon:          string | null
}

export type ReadonlyFetch = DeepReadonly<Fetch>

export interface StatusFetcher {
    cloneFetch(connection: Connection, force?: boolean): Promise<Fetch>
    fetch(connection: Connection, force?: boolean): Promise<ReadonlyFetch> 
    cloneLastFetch(): Fetch | null

    get willRefetch(): boolean
    get lastFetch(): ReadonlyFetch | null
    get lastFetchDate(): Date | null
}

export class DefaultStatusFetcher implements StatusFetcher {
    private  _lastFetch:      Fetch | null = null
    private  _lastFetchDate:  Date  | null = null

    readonly nicknameManager: NicknameManager
    readonly config:          Config
    readonly logger?:         Logger

    constructor(options: CreationOptions) {
        this.nicknameManager = options.nicknameManager
        this.config          = options.config
        this.logger          = options.logger
    }

    async cloneFetch(connection: Connection, force: boolean = false): Promise<Fetch> {
        await this.fetch(connection, force)
        return this.cloneLastFetch()!
    }

    async fetch(connection: Connection, force: boolean = false): Promise<ReadonlyFetch> {
        this.logger?.debug(`Fetching minecraft server status from ${this.config.mcAddress}...`)

        if (!force && !this.willRefetch) {
            this.logger?.debug("Fetched cached")
            return this.cloneLastFetch()!
        }

        const rawFetch = await status(this.config.mcHost, this.config.mcPort)
        const fetch    = await this.rawFetchToFetch(connection, rawFetch)

        this.updateLast(fetch)

        this.logger?.debug("Fetched new")

        return fetch
    }

    private async rawFetchToFetch(connection: Connection, raw: JavaStatusResponse): Promise<Fetch> {
        const sample = await this.mapSamples(connection, raw.players.sample)

        return {
            version: {
                name:     raw.version.name,
                protocol: raw.version.protocol
            },

            players: {
                online:   raw.players.online,
                max:      raw.players.max,
                sample
            },

            motd:   {
                raw:      raw.motd.raw,
                clean:    raw.motd.clean,
                html:     raw.motd.html,
            },

            address:      this.config.mcPublicAddress,
            favicon:      raw.favicon
        }
    }

    private async mapSamples(
        connection: Connection,
        sample:     { name: string }[] | null
    ): Promise<{ nickname: string, login: string | null }[]> {
        if (sample == null)
            return []

        const promises = sample.map(async ({name: nickname}) => {
            const info  = await this.nicknameManager.getNicknameOwnerInfo(connection, nickname)
            const login = info?.login ?? null

            return { nickname, login }
        })

        return await Promise.all(promises)
    }

    private updateLast(fetch: Fetch) {
        this._lastFetch     = fetch
        this._lastFetchDate = new Date()
    }

    get willRefetch(): boolean {
        if (this.lastFetch     == null
         || this.lastFetchDate == null)
            return true;

        const now  = new Date()
        const diff = now.valueOf() - this.lastFetchDate.valueOf()

        return diff >= this.config.mcStatusLifetime
    }

    get lastFetch(): ReadonlyFetch | null {
        return this._lastFetch
    }

    cloneLastFetch(): Fetch | null {
        return this._lastFetch != null ? deepAssign({}, this._lastFetch)
                                       : null
    }

    get lastFetchDate(): Date | null {
        return this._lastFetchDate
    }
}