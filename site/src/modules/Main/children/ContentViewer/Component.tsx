import ReadonlyRefObject                      from "types/ReadonlyRefObject"
import User                                   from "logic/User"
import Player                                 from "logic/Player"
import ContentSelector                        from "./children/ContentSelector/Component"
import ContentWindow                          from "./children/ContentWindow/Component"
import Console                                from "./children/Console/Component"
import Profile                                from "./children/Profile/Component"
import Server                                 from "./children/ServerViewer/Component"
import Users                                  from "./children/Users/Component"
import Home                                   from "./children/Home/Component"
import styles                                 from "./styles.module.css"

import { useContext, createContext          } from "react"
import { UserContext, AuthControllerContext } from "pages/App/Component"
import { Content                            } from "./content"

export const ContentStackContext = createContext([[], defaultSetContentStack, { current: [] }] as ContentStackContextType)

function defaultSetContentStack() {
    throw new Error("Missing ContentStackContext.Provider")
}

export type ContentStackContextType = [Content[], SetContentStack, ContentStackRef]
export type SetContentStack         = (newContentStack: Content[]) => void
export type ContentStackRef         = ReadonlyRefObject<Content[]>

export const HOME_CONTENT = { name: "Home", component: Home } as Content

export default function ContentViewer() {
    const [user                                          ] = useContext(UserContext)
    const [authInfo                                      ] = useContext(AuthControllerContext)
    const contentSelectionList                             = makeContentSelectionList()
    const [contentStack, setContentStack, contentStackRef] = useContext(ContentStackContext)
    const topContent                                       = contentStack[contentStack.length - 1]
    const showBack                                         = contentStack.length > 1

    return <div className={styles.viewer}>
        <ContentSelector contentList={contentSelectionList} onSelect={onSelect}/>
        <div className={styles.window}>
            <ContentWindow content={topContent} showBack={showBack} onBack={onBack} showEdit={topContent.editable} />
        </div>
    </div>

    function makeContentSelectionList() {
        const contentList = makeBasicContent()

        if (authInfo.allowAnonymAccess)
            addCommonContent()

        addUserContent()

        return contentList

        function makeBasicContent(): Content[] {
            return [
                { name: "Home", component: Home }
            ]
        }

        function addCommonContent() {
            contentList.push(
                createServerContent(),
                createUsersContent()
            )

            function createServerContent(): Content {
                const name       = "Server Status"
                const selectName = "Server"
                const component  = () => Server({ onPlayerClick })

                return { name, selectName, component }

                function onPlayerClick(player: Player) {
                    const { user } = player

                    if (user)
                        pushUserContent(user.login)
                }
            }

            function createUsersContent(): Content {
                const name       = "Users List"
                const selectName = "Users"
                const component  = () => Users({ onUserClick })
                const editable   = user?.isAdmin

                return { name, selectName, component, editable }

                function onUserClick(user: User) {
                    pushUserContent(user.login)
                }
            }
        }

        function addUserContent() {
            if (user == null)
                return

            contentList.push(createProfileContent())

            if (!authInfo.allowAnonymAccess)
                addCommonContent()

            if (user.isAdmin)
                contentList.push({
                    name:       "Server Console",
                    selectName: "Console",
                    component:  Console
                })

            function createProfileContent(): Content {
                const name       = "Your Profile"
                const selectName = "Profile"
                const component  = () => Profile({ login: user!.login, onTagClick: onUserTagClick })
                const editable   = true

                return { name, selectName, component, editable }
            }
        }

        function pushUserContent(login: string) {
            const component       = () => Profile({ login: login, onTagClick: onUserTagClick })
            const name            = `${login}'s Profile`
            const editable        = login === user?.login || (user?.isAdmin ?? false)
            const newContent      = { name, component, editable }
            const oldContentStack = contentStackRef.current ?? []
            const newContentStack = [...oldContentStack, newContent]

            setContentStack(newContentStack)
        }

        function onUserTagClick(newLogin: string, oldLogin: string) {
            if (!User.areLoginsEqual(newLogin, oldLogin))
                pushUserContent(newLogin)
        }
    }

    function onSelect(newContent: Content) {
        setContentStack([newContent])
    }

    function onBack() {
        setContentStack(contentStack.slice(0, contentStack.length - 1))
    }
}