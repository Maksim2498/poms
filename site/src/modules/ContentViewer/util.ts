import User                                                        from "logic/User"
import Player                                                      from "logic/Player"
import Profile                                                     from "./Profile/Component"
import ServerViewer                                                from "./ServerViewer/Component"
import Users                                                       from "./Users/Component"

import { HOME_CONTENT, CONSOLE_CONTENT                           } from "./constants"
import { Content, ContentComponentProps, ContentStackContextType } from "./types"

// Home:

export function setHomeContent(context: ContentStackContextType) {
    setContent(context, HOME_CONTENT)
}

export function pushHomeContent(context: ContentStackContextType) {
    pushContent(context, HOME_CONTENT)
}

// Users:

export function setUsersContent(context: ContentStackContextType, creator?: User) {
    setContent(context, createUsersContent(context, creator))
}

export function pushUsersContent(context: ContentStackContextType, creator?: User) {
    pushContent(context, createUsersContent(context, creator))
}

export function createUsersContent(context: ContentStackContextType, creator?: User): Content {
    const name       = "Users List"
    const selectName = "Users"
    const component  = ({ editMode }: ContentComponentProps) => Users({ onUserClick, editMode })
    const editable   = creator?.isAdmin ?? false

    return { name, selectName, component, editable }

    function onUserClick(user: User) {
        pushProfileContent(context, user.login, creator)
    }
}

// Server:

export function setServerContent(context: ContentStackContextType, creator?: User) {
    setContent(context, createServerContent(context, creator))
}

export function pushServerContent(context: ContentStackContextType, creator?: User) {
    pushContent(context, createServerContent(context, creator))
}

export function createServerContent(context: ContentStackContextType, creator?: User): Content {
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

// Profile:

export function setProfileContent(context: ContentStackContextType, user: User | string, creator?: User) {
    setContent(context, createProfileContent(context, user, creator))
}

export function pushProfileContent(context: ContentStackContextType, user: User | string, creator?: User) {
    pushContent(context, createProfileContent(context, user, creator))
}

export function createProfileContent(context: ContentStackContextType, user: User | string, creator?: User): Content {
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

// Console:

export function setConsoleContent(context: ContentStackContextType) {
    setContent(context, CONSOLE_CONTENT)
}

export function pushConsoleContent(context: ContentStackContextType) {
    pushContent(context, CONSOLE_CONTENT)
}

// Common:

export function pushContent(context: ContentStackContextType, content: Content) {
    const [, setContentStack, contentStackRef] = context

    const newContentStack = [...contentStackRef.current, content]

    setContentStack(newContentStack)
}

export function setContent(context: ContentStackContextType, content: Content) {
    const [, setContentStack] = context
    setContentStack([content])
}