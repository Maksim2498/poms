export interface UserJson {
    login:      string
    name?:      string
    nicknames?: string[]
    isAdmin?:   boolean
    isOnline?:  boolean
    reg:        {
        time:   string
        login?: string
    }
}

export default class User {
    login:     string
    name?:     string
    nicknames: string[]
    isAdmin:   boolean
    isOnline:  boolean
    reg:       {
        time:   Date
        login?: string
    }

    constructor(json: UserJson) {
        this.login     = json.login
        this.name      = json.name
        this.nicknames = json.nicknames != null ? [...json.nicknames] : []
        this.isAdmin   = json.isAdmin  ?? false
        this.isOnline  = json.isOnline ?? false
        this.reg       = {
            time:  new Date(json.reg.time),
            login: json.reg.login
        }
    }
}