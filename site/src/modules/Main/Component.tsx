import AuthFrom             from "./children/AuthForm/Component"
import ContentViewer        from "./children/ContentViewer/Component"

import { Props as AProps  } from "./children/AuthForm/Component"
import { Props as CVProps } from "./children/ContentViewer/Component"

import "./style.css"

export type Props = ContentProps
                  | AuthProps

export interface ContentProps extends CVProps {
    show: "content"
}

export interface AuthProps extends AProps {
    show: "auth"
}

export type Show = "content"
                 | "auth"

export default function Main(props: Props) {
    return <main className="Main">
        {body()}
    </main>

    function body() {
        switch (props.show) {
            case "auth":
                return <AuthFrom onAuth={props.onAuth} onCancel={props.onCancel} />

            case "content":
                return <ContentViewer content={props.content} onContentChange={props.onContentChange} />
        }
    }
}