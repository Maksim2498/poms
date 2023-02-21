import Header from "components/Header"
import Main   from "components/Main"

import { useState           } from "react"
import { Show as ShowMain   } from "components/Main"
import { Show as ShowHeader } from "components/Header"

export default function App() {
    const [name,       setName      ] = useState("Anonymous")
    const [showMain,   setShowMain  ] = useState("greeting" as ShowMain  )
    const [showHeader, setShowHeader] = useState("sign-in"  as ShowHeader)

    return <div className="App">
        {header()}
        {main()  }
    </div>

    function header() {
        switch (showHeader) {
            case "none":
                return <Header show="none" />

            case "sign-out":
                return <Header show="sign-out" name={name} onSignOut={() => {
                    setShowMain("greeting")
                    setShowHeader("sign-in")
                }} />

            case "sign-in":
                return <Header show="sign-in" onSignIn={() => {
                    setShowMain("sign-in")
                    setShowHeader("none")
                }} />
        }
    }

    function main() {
        switch (showMain) {
            case "greeting":
                return <Main show="greeting" />

            case "sign-in":
                return <Main show="sign-in"

                             onCancel={() => {
                                 setShowMain("greeting")
                                 setShowHeader("sign-in")
                             }}
                             
                             onSignIn={(login) => {
                                 setShowMain("user-panel")
                                 setShowHeader("sign-out")
                                 setName(login)
                             }}/>

            case "user-panel":
                return <Main show="user-panel" />
        }
    }
}