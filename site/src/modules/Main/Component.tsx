import ContentSelector from "components/ContentSelector/Component"
import ContentWindow   from "components/ContentWindow/Component"
import Welcome         from "components/Welcome/Component"
import Server          from "components/Server/Component"
import Users           from "components/Users/Component"

import { useState    } from "react"
import { Content     } from "components/ContentSelector/Component"

import "./style.css"

export interface Props {
    content?: Content
}

export default function Main(props: Props) {
    const contentList = [
        { name: "Home",                                component: Welcome },
        { name: "Server Status", selectName: "Server", component: Server  },
        { name: "Users List",    selectName: "User",   component: Users   },
    ] satisfies Content[]

    const [content, setContent] = useState(props.content ?? contentList[0])

    return <main className="Main">
        <ContentSelector contentList={contentList} onSelect={c => setContent(c)}/>
        <ContentWindow content={content} />
    </main>
}