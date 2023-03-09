import AsyncConnection from "util/mysql/AsyncConnection";
import Config          from "Config";

import { status               } from "minecraft-server-util"
import { deepAssign           } from "util/object";
import { DeepReadonly         } from "util/type";
import { getNicknameOwnerInfo } from "./nickname";

export interface Fetch {
    version: {
        name:         string
        protocol:     number
    }

    players: {
        online:       number
        max:          number
        sample: {
            id:       string
            nickname: string
            login:    string | null
        }[]
    }

    motd: {
        raw:          string
        clean:        string
        html:         string
    }

    favicon:          string | null
}

export type ReadonlyFetch = DeepReadonly<Fetch>

export default class StatusFetcher {
    private  _lastFetch:      Fetch | null = null
    private  _lastFetchDate:  Date  | null = null

    readonly mysqlConnection: AsyncConnection
    readonly config:          Config

    constructor(mysqlConnection: AsyncConnection, config: Config) {
        this.mysqlConnection = mysqlConnection
        this.config          = config
    }

    async cloneFetch(force: boolean = false): Promise<Fetch> {
        await this.fetch(force)
        return await this.cloneFetch()
    }

    async fetch(force: boolean = false): Promise<ReadonlyFetch> {
        if (!force && !this.willRefetch)
            return this.cloneLastFetch()!

        const rawFetch = await status(this.config.mcHost, this.config.mcPort)
        const sample   = await mapSamples.call(this)
        const fetch    = {
            version: {
                name:     rawFetch.version.name,
                protocol: rawFetch.version.protocol
            },

            players: {
                online:   rawFetch.players.online,
                max:      rawFetch.players.max,
                sample
            },

            motd:   {
                raw:      rawFetch.motd.raw,
                clean:    rawFetch.motd.clean,
                html:     rawFetch.motd.html,
            },

            favicon:      rawFetch.favicon
        }
        console.log("fetch:", JSON.stringify(fetch, null, 4))

        this._lastFetch     = fetch
        this._lastFetchDate = new Date()

        return fetch

        async function mapSamples(this: StatusFetcher): Promise<{ id: string, nickname: string, login: string | null }[]> {
            const sample = rawFetch.players.sample

            if (sample == null)
                return []

            const promises = sample.map(async ({name: nickname, id}) => {
                const info  = await getNicknameOwnerInfo(this.mysqlConnection, nickname)
                const login = info?.login ?? null

                return { id, nickname, login }
            })

            return await Promise.all(promises)
        }
    }

    get willRefetch(): boolean {
        if (this.lastFetch     == null
         || this.lastFetchDate == null)
            return true;

        const now  = new Date()
        const diff = Math.floor((now.valueOf() - this.lastFetchDate.valueOf()) / 1000)

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