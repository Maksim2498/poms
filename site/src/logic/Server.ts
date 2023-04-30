import z                       from "zod"

import { AuthController, get } from "./api"

export type CreationOptions = z.TypeOf<typeof Server.JSON_SCHEMA>

export default class Server {
    static readonly JSON_SCHEMA = z.object({
        version: z.object({
            name:     z.string(),
            protocol: z.number()
        }),

        players: z.object({
            online:   z.number(),
            max:      z.number(),
            sample:   z.object({
                nickname: z.string(),
                login:    z.string().nullish()
            }).array().nullish()
        }),

        motd: z.object({
            raw:      z.string(),
            clean:    z.string(),
            html:     z.string()
        }),

        address: z.string().nullish(),
        favicon: z.string().nullish()
    })

    static async fetch(authController: AuthController): Promise<Server> {
        const [json] = await get(authController, "server")
        return this.fromJson(json)
    }

    static fromJson(json: any): Server {
        const parsed = this.JSON_SCHEMA.parse(json)
        return new Server(parsed)
    }

    readonly version:  {
        readonly name:     string
        readonly protocol: number
    }

    readonly players:  {
        readonly online:  number
        readonly max:     number
        readonly sample:  {
            readonly nickname: string
            readonly login?:   string
        }[]
    }

    readonly motd:     {
        readonly raw:     string
        readonly clean:   string
        readonly html:    string
    }

    readonly address?: string
    readonly favicon?: string

    constructor(options: CreationOptions) {
        this.version  = {
            name:     options.version.name,
            protocol: options.version.protocol
        }

        this.players  = {
            online: options.players.online,
            max:    options.players.max,
            sample: (options.players.sample ?? []).map(({ nickname, login }) => { return { nickname, login: login ?? undefined }})
        }

        this.motd    = {
            raw:    options.motd.raw,
            clean:  options.motd.clean,
            html:   options.motd.html
        }

        this.address = options.address ?? undefined
        this.favicon = options.favicon ?? undefined
    }
}