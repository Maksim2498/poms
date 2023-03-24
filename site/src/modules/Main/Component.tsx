import ContentSelector                               from "components/ContentSelector/Component"
import ContentWindow                                 from "components/ContentWindow/Component"
import Welcome                                       from "components/Welcome/Component"
import Server                                        from "components/Server/Component"
import Users                                         from "components/Users/Component"
import Profile                                       from "components/Profile/Component"
import Console                                       from "components/Console/Component"

import { useContext, useEffect, useState           } from "react"
import { AllowAnonymAccessContext, AuthInfoContext } from "pages/App/Component"
import { Content                                   } from "components/ContentSelector/Component"

import "./style.css"

export interface Props {
    onContentChange?: OnContentChange
    content?:         Content
}

export type OnContentChange = (newContent: Content, oldContent: Content) => void

export default function Main(props: Props) {
    const isAnonymAccessAllowed = useContext(AllowAnonymAccessContext)
    const user                  = useContext(AuthInfoContext)?.user
    const { onContentChange }   = props
    const contentList           = makeContentList()
    const initContent           = props.content ?? contentList[0]
    const [content, setContent] = useState(initContent)

    useEffect(() => props.content && setContent(props.content), [props.content])

    return <main className="Main">
        <ContentSelector contentList={contentList} onSelect={onSelect}/>
        <ContentWindow content={content} />
    </main>

    function makeContentList() {
        const contentList = [
            { name: "Home", component: Welcome },
        ] as Content[]

        if (isAnonymAccessAllowed)
            addCommonContent()

        if (user != null) {
            contentList.push({
                name:       "Your Profile",
                selectName: "Profile",
                component:  () => Profile({ user })
            })

            if (!isAnonymAccessAllowed)
                addCommonContent()

            if (user.isAdmin)
                contentList.push({
                    name:       "Server Console",
                    selectName: "Console",
                    component:  Console
                })
        }

        return contentList

        function addCommonContent() {
            contentList.push(
                { name: "Server Status", selectName: "Server", component: Server },
                { name: "Users List",    selectName: "Users",  component: Users  },
            )
        }
    }

    function onSelect(newContent: Content) {
        const oldContent = content
        setContent(newContent)
        onContentChange?.(newContent, oldContent)
    }
}