import User               from "./User"

import { AuthController } from "./api"

export interface FetchOptions {
    authController:  AuthController
    login:           string
    nickname:        string
    fetchNicknames?: boolean
}

export interface CreationOptions {
    dontCheckNicknames?: boolean
    nickname:            string
    user?:               User
}

export default class Player {
    static async fetch(options: FetchOptions): Promise<Player> {
        const { nickname } = options
        const user         = await User.fetch(options)

        return new Player({
            nickname,
            user,
            dontCheckNicknames: true
        })
    }

    readonly user?:    User
    readonly nickname: string

    constructor(options: CreationOptions) {
        const { dontCheckNicknames, nickname, user } = options

        const checkNicknames =  user != null
                             && !dontCheckNicknames

        if (checkNicknames && !userHasNickname())
            throw new Error(`User "${user.login}" doesn't have nickname "${nickname}"`)

        this.user     = user
        this.nickname = nickname

        function userHasNickname(): boolean {
            const testNickname =  nickname.trim()
                                          .toLowerCase()

            for (const userNickname of user!.nicknames) {
                const testUserNickname = userNickname.trim()
                                                     .toLowerCase()

                if (testUserNickname === testNickname)
                    return true
            }

            return false
        }
    }
}