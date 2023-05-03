import User                                                        from "logic/User"
import Player                                                      from "logic/Player"

import { Profile                                                 } from "../Profile"
import { ServerViewer                                            } from "../ServerViewer"
import { Users                                                   } from "../Users"
import { Content, ContentComponentProps, ContentStackContextType } from "./types"

export function makeUsersContent(context: ContentStackContextType, creator?: User): Content {
    const name       = "User List"
    const selectName = "Users"
    const component  = ({ editMode }: ContentComponentProps) => Users({ onUserClick, editMode })
    const editable   = creator?.isAdmin ?? false

    return { name, selectName, component, editable }

    function onUserClick(user: User) {
        pushProfileContent(context, user.login, creator)
    }
}

export function makeServerContent(context: ContentStackContextType, creator?: User): Content {
    const name       = "Server Status"
    const selectName = "Server"
    const component  = () => ServerViewer({ onPlayerClick })

    return { name, selectName, component }

    function onPlayerClick(player: Player) {
        const { user } = player

        if (user)
            pushProfileContent(context, user.login, creator)
    }
}

export function makeProfileContent(context: ContentStackContextType, user: User | string, creator?: User): Content {
    const login      = typeof user !== "string" ? user.login : user
    const local      = User.areLoginsEqual(login, creator?.login)
    const name       = local ? "Your Profile" : `${login}'s Profile`
    const selectName = "Profile"
    const component  = ({ editMode }: ContentComponentProps) => Profile({ editMode, login, onTagClick })
    const editable   = local || (creator?.isAdmin ?? false)

    return { name, selectName, component, editable }

    function onTagClick(newLogin: string, oldLogin: string) {
        if (!User.areLoginsEqual(newLogin, oldLogin))
            pushProfileContent(context, newLogin, creator)
    }
}

function pushProfileContent(context: ContentStackContextType, login: string, creator?: User) {
    pushContent(context, makeProfileContent(context, login, creator))
}

export function popContent(context: ContentStackContextType) {
    context.current = context.current.slice(0, -1)
}

export function pushContent(context: ContentStackContextType, content: Content) {
    context.current = [...context.current, content]
}

export function setContent(context: ContentStackContextType, content: Content) {
    context.current = [content]
}