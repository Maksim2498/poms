import ContentSelector                      from "./children/ContentSelector/Component"
import ContentWindow                        from "./children/ContentWindow/Component"
import Console                              from "./children/Console/Component"
import Profile                              from "./children/Profile/Component"
import Server                               from "./children/Server/Component"
import Users                                from "./children/Users/Component"
import Home                                 from "./children/Home/Component"

import { useEffect, useState, useContext  } from "react"
import { UserContext, AuthInfoContext     } from "pages/App/Component"
import { Content                          } from "./children/ContentSelector/Component"

import "./style.css"

export interface Props {
    onContentChange?: OnContentChange
    content?:         Content
}

export type OnContentChange = (newContent: Content, oldContent: Content) => void

export default function ContentViewer(props: Props) {
    const [user               ] = useContext(UserContext)
    const [authInfo           ] = useContext(AuthInfoContext)
    const { onContentChange   } = props
    const contentList           = makeContentList()
    const [content, setContent] = useState(props.content ?? contentList[0])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => setContent(props.content ?? contentList[0]), [props.content])

    return <div className="ContentViewer">
        <ContentSelector contentList={contentList} onSelect={onSelect}/>
        <ContentWindow content={content} />
    </div>

    function makeContentList() {
        const contentList = createBasicContent()

        if (authInfo.allowAnonymAccess)
            addCommonContent()

        addUserContent()

        return contentList

        function createBasicContent(): Content[] {
            return [
                { name: "Home", component: Home }
            ]
        }

        function addCommonContent() {
            contentList.push(
                { name: "Server Status", selectName: "Server", component: Server },
                { name: "Users List",    selectName: "Users",  component: Users  },
            )
        }

        function addUserContent() {
            if (user == null)
                return

            contentList.push({
                name:       "Your Profile",
                selectName: "Profile",
                component:  () => Profile({ user })
            })

            if (!authInfo.allowAnonymAccess)
                addCommonContent()

            if (user.isAdmin)
                contentList.push({
                    name:       "Server Console",
                    selectName: "Console",
                    component:  Console
                })
        }
    }

    function onSelect(newContent: Content) {
        const oldContent = content
        setContent(newContent)
        onContentChange?.(newContent, oldContent)
    }
}