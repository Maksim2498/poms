import LogicError from "./LogicError"

import { User   } from "./user"

export default class UserNotFoundError extends LogicError {
    readonly user: User

    constructor(user: User) {
        super(typeof user === "string" ? `User "${user}" not found`
                                       : `User with id ${user} not found`)

        this.user = user
    }
}