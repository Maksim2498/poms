import useStateRef                            from "react-usestateref"
import User                                   from "logic/User"
import Player                                 from "logic/Player"
import ContentSelector                        from "./children/ContentSelector/Component"
import ContentWindow                          from "./children/ContentWindow/Component"
import Console                                from "./children/Console/Component"
import Profile                                from "./children/Profile/Component"
import Server                                 from "./children/ServerViewer/Component"
import Users                                  from "./children/Users/Component"
import Home                                   from "./children/Home/Component"

import { useContext                         } from "react"
import { UserContext, AuthControllerContext } from "pages/App/Component"
import { Content                            } from "./children/ContentSelector/Component"

import "./style.css"

export default function ContentViewer() {
    const [user                                          ] = useContext(UserContext)
    const [authInfo                                      ] = useContext(AuthControllerContext)
    const contentSelectionList                             = makeContentSelectionList()
    const [contentStack, setContentStack, contentStackRef] = useStateRef([contentSelectionList[0]])
    const topContent                                       = contentStack[contentStack.length - 1]
    const showBack                                         = contentStack.length > 1

    return <div className="ContentViewer">
        <ContentSelector contentList={contentSelectionList} onSelect={onSelect}/>
        <ContentWindow content={topContent} showBack={showBack} onBack={onBack} />
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

                return { name, selectName, component}

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
                const component  = () => Profile({ user: user!, onTagClick })

                return { name, selectName, component }
            }
        }

        function pushUserContent(login: string) {
            const component  = () => Profile({ login: login, onTagClick })
            const name       = `${login}'s Profile`
            const newContent = { name, component }

            setContentStack([...contentStackRef.current, newContent])
        }

        function onTagClick(newLogin: string, oldLogin: string) {
            if (oldLogin.toLocaleLowerCase() === newLogin.toLocaleLowerCase())
                return

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