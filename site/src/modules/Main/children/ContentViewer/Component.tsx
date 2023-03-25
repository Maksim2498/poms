import ContentSelector                               from "./children/ContentSelector/Component"
import ContentWindow                                 from "./children/ContentWindow/Component"
import Console                                       from "./children/Console/Component"
import Profile                                       from "./children/Profile/Component"
import Server                                        from "./children/Server/Component"
import Users                                         from "./children/Users/Component"
import Home                                          from "./children/Home/Component"

import { useContext, useEffect, useState           } from "react"
import { AllowAnonymAccessContext, AuthInfoContext } from "pages/App/Component"
import { Content                                   } from "./children/ContentSelector/Component"

import "./style.css"

export interface Props {
    onContentChange?: OnContentChange
    content?:         Content
}

export type OnContentChange = (newContent: Content, oldContent: Content) => void

export default function ContentViewer(props: Props) {
    const isAnonymAccessAllowed = useContext(AllowAnonymAccessContext)
    const user                  = useContext(AuthInfoContext)?.user
    const { onContentChange }   = props
    const contentList           = makeContentList()
    const [content, setContent] = useState(props.content ?? contentList[0])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => setContent(props.content ?? contentList[0]), [props.content])

    return <div className="ContentViewer">
        <ContentSelector contentList={contentList} onSelect={onSelect}/>
        <ContentWindow content={content} />
    </div>

    function makeContentList() {
        const contentList = [
            { name: "Home", component: Home },
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