import useStateRef                      from "react-usestateref"
import ContentSelector                  from "./children/ContentSelector/Component"
import ContentWindow                    from "./children/ContentWindow/Component"
import Console                          from "./children/Console/Component"
import Profile                          from "./children/Profile/Component"
import Server                           from "./children/Server/Component"
import Users                            from "./children/Users/Component"
import Home                             from "./children/Home/Component"

import { useContext                   } from "react"
import { UserContext, AuthInfoContext } from "pages/App/Component"
import { Content                      } from "./children/ContentSelector/Component"

import "./style.css"

export default function ContentViewer() {
    const [user                                          ] = useContext(UserContext)
    const [authInfo                                      ] = useContext(AuthInfoContext)
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
                { name: "Server Status", selectName: "Server", component: Server },
                { name: "Users List",    selectName: "Users",  component: Users  }
            )
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
                const component  = () => Profile({ user: user!, onUserTagClick })

                return { name, selectName, component }

                function onUserTagClick(login: string) {
                    if (login.toLocaleLowerCase() === user!.login.toLocaleLowerCase())
                        return

                    const component  = () => Profile({ login })
                    const name       = `${login}'s Profile`
                    const newContent = { name, component }

                    setContentStack([...contentStackRef.current, newContent])
                }
            }
        }
    }

    function onSelect(newContent: Content) {
        setContentStack([newContent])
    }

    function onBack() {
        setContentStack(contentStack.slice(0, contentStack.length - 1))
    }
}