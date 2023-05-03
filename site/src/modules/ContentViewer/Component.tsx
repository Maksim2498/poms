import styles                                                                              from "./styles.module.css"

import { useContext                                                                      } from "react"
import { AuthInfoContext, UserContext                                                    } from "App"
import { ContentSelector                                                                 } from "./ContentSelector"
import { ContentWindow                                                                   } from "./ContentWindow"
import { Content,
         ContentStackContext,
         CONSOLE_CONTENT, HOME_CONTENT,
         makeProfileContent, makeServerContent, makeUsersContent, popContent, setContent } from "./ContentStackContext"

export default function ContentViewer() {
    const contentStackRef           = useContext(ContentStackContext)
    const { current: contentStack } = contentStackRef
    const { current: contextUser  } = useContext(UserContext)
    const { current: authInfo     } = useContext(AuthInfoContext)
    const contentSelectionList      = makeContentSelectionList()
    const topContent                = contentStack[contentStack.length - 1] as Content | undefined
    const showBack                  = contentStack.length > 1
    const editable                  = topContent?.editable ?? false

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

        if (authInfo.allowAnonymAccess)
            addCommonContent()

        if (contextUser != null) {
            contentList.push(makeProfileContent(contentStackRef, contextUser, contextUser))

            if (!authInfo.allowAnonymAccess)
                addCommonContent()

            if (contextUser.isAdmin)
                contentList.push(CONSOLE_CONTENT)
        }

        return contentList

        function addCommonContent() {
            contentList.push(
                makeServerContent(contentStackRef, contextUser),
                makeUsersContent(contentStackRef, contextUser)
            )
        }
    }

    function onSelect(newContent: Content) {
        setContent(contentStackRef, newContent)
    }

    function onBack() {
        popContent(contentStackRef)
    }
}