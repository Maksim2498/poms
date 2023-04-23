import AuthControllerContext                                             from "App/AuthControllerContext"
import UserContext                                                       from "App/UserContext"
import ContentStackContext                                               from "./Context"
import ContentSelector                                                   from "./ContentSelector/Component"
import ContentWindow                                                     from "./ContentWindow/Component"
import styles                                                            from "./styles.module.css"

import { useContext                                                    } from "react"
import { CONSOLE_CONTENT, HOME_CONTENT                                 } from "./constants"
import { Content                                                       } from "./types"
import { createProfileContent, createServerContent, createUsersContent } from "./util"

export default function ContentViewer() {
    const [user                         ] = useContext(UserContext)
    const [authInfo                     ] = useContext(AuthControllerContext)
    const contentStackContext             = useContext(ContentStackContext)
    const contentSelectionList            = makeContentSelectionList()
    const [contentStack, setContentStack] = contentStackContext
    const topContent                      = contentStack[contentStack.length - 1]
    const showBack                        = contentStack.length > 1
    const { editable                    } = topContent

    return <div className={styles.viewer}>
        <ContentSelector contentList={contentSelectionList} onSelect={onSelect}/>
        <div className={styles.window}>
            <ContentWindow content  = {topContent}
                           showBack = {showBack}
                           onBack   = {onBack}
                           showEdit = {editable} />
        </div>
    </div>

    function makeContentSelectionList() {
        const contentList = [HOME_CONTENT]

        addCommonContent()
        addUserContent()

        return contentList

        function addCommonContent() {
            if (authInfo.allowAnonymAccess)
                contentList.push(
                    createServerContent(contentStackContext, user),
                    createUsersContent(contentStackContext, user)
                )
        }

        function addUserContent() {
            if (user == null)
                return

            contentList.push(createProfileContent(contentStackContext, user, user))

            if (!authInfo.allowAnonymAccess)
                addCommonContent()

            if (user.isAdmin)
                contentList.push(CONSOLE_CONTENT)
        }
    }

    function onSelect(newContent: Content) {
        setContentStack([newContent])
    }

    function onBack() {
        setContentStack(contentStack.slice(0, contentStack.length - 1))
    }
}