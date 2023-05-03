import User               from "./User"

import { AuthInfoRef } from "./api"

export interface FetchOptions {
    authInfoRef:       AuthInfoRef
    login:             string
    nickname:          string
    deferIconLoading?: boolean
    fetchNicknames?:   boolean
    fetchIcon?:        boolean
    signal?:           AbortSignal
}

export interface CreationOptions {
    acceptInvalid?: boolean
    nickname:       string
    user?:          User
}

export default class Player {
    static async fetch(options: FetchOptions): Promise<Player> {
        const { nickname } = options
        const user         = await User.fetch(options)

        return new Player({
            nickname,
            user,
            acceptInvalid: true
        })
    }

    static sort(players: Player[]): Player[] {
        return players.sort(this.collate)
    }

    static collate(lhs: Player, rhs: Player): -1 | 0 | 1 {
        if (lhs.user?.isAdmin && !rhs.user?.isAdmin)
            return 1

        if (!lhs.user?.isAdmin && rhs.user?.isAdmin)
            return -1

        if (lhs.nickname > rhs.nickname)
            return 1

        if (lhs.nickname < rhs.nickname)
            return -1
            
        return 0
    }

    readonly user?:    User
    readonly nickname: string

    constructor(options: CreationOptions) {
        const {
            acceptInvalid,
            user,
        } = options

        const validate = !acceptInvalid
        const nickname = User.normNickname(options.nickname)

        if (validate) {
            User.checkNormedNickname(nickname)

            if (user?.nicknames && !user.nicknames.includes(nickname))
                throw new Error(`User "${user.login}" doesn't have nickname "${nickname}"`)
        }

        this.user     = user
        this.nickname = nickname
    }

    withUser(user: User | undefined): Player {
        return new Player({
            ...this,
            user,
            acceptInvalid: true,
        })
    }

    withNickname(nickname: string): Player {
        return new Player({
            ...this,
            nickname,
            acceptInvalid: true,
        })
    }

    collate(player: Player): -1 | 0 | 1 {
        return Player.collate(this, player)
    }
}