import User                      from "logic/User"
import Player                    from "logic/Player"
import ContentSelector           from "./ContentSelector/Component"
import ContentWindow             from "./ContentWindow/Component"
import Console                   from "./Console/Component"
import Profile                   from "./Profile/Component"
import Server                    from "./ServerViewer/Component"
import Users                     from "./Users/Component"
import HOME_CONTENT              from "./HomeContent"
import styles                    from "./styles.module.css"

import { useContext            } from "react"
import { AuthControllerContext } from "App/AuthControllerContext"
import { UserContext           } from "App/UserContext"
import { ContentStackContext   } from "./Context"
import { Content               } from "./types"

export default function ContentViewer() {
    const [user                                          ] = useContext(UserContext)
    const [authInfo                                      ] = useContext(AuthControllerContext)
    const contentSelectionList                             = makeContentSelectionList()
    const [contentStack, setContentStack, contentStackRef] = useContext(ContentStackContext)
    const topContent                                       = contentStack[contentStack.length - 1]
    const showBack                                         = contentStack.length > 1
    const { editable }                                     = topContent
    const onEdit                                           = () => window.alert("Not implemented")

    return <div className={styles.viewer}>
        <ContentSelector contentList={contentSelectionList} onSelect={onSelect}/>
        <div className={styles.window}>
            <ContentWindow content  = {topContent}
                           showBack = {showBack}
                           onBack   = {onBack}
                           showEdit = {editable}
                           onEdit   = {onEdit} />
        </div>
    </div>

    function makeContentSelectionList() {
        const contentList = makeBasicContent()

        if (authInfo.allowAnonymAccess)
            addCommonContent()

        addUserContent()

        return contentList

        function makeBasicContent(): Content[] {
            return [HOME_CONTENT]
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