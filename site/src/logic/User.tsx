export interface CreationOptions {
    readonly login:      string
    readonly name?:      string
    readonly nicknames?: string[]
    readonly isAdmin?:   boolean
    readonly isOnline?:  boolean
    readonly reg?: {
        readonly time?:  Date
        readonly login?: string | null
    }
}

export default class User {
    readonly login:     string
    readonly name:      string | null
    readonly nicknames: string[]
    readonly isAdmin:   boolean
    readonly isOnline:  boolean
    readonly reg: {
        readonly time:  Date
        readonly login: string | null
    }

    constructor(options: CreationOptions) {
        this.login     = options.login
        this.name      = options.name      ?? null
        this.nicknames = options.nicknames ?? []
        this.isAdmin   = options.isAdmin   ?? false
        this.isOnline  = options.isOnline  ?? false
        this.reg       =  {
            time:  options.reg?.time       ?? new Date(),
            login: options.reg?.login      ?? null
        }
    }
}