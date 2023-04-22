import LogicError from "./LogicError"

import { User   } from "./user"

export default class UserNotFoundError extends LogicError {
    readonly user: User

    static makeMessage(user: User) {
        return typeof user === "string" ? `User "${user}" not found`
                                        : `User with id ${user} not found`
    }

    constructor(user: User, message: string = UserNotFoundError.makeMessage(user)) {
        super(message)
        this.user = user
    }
}