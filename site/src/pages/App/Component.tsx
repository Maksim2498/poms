import Header from "modules/Header/Component"
import Main   from "modules/Main/Component"
import Footer from "modules/Footer/Component"

import "./style.css"

export default function App() {
    return <div className="App">
        <Header show="not-signed-in" />
        <Main />
        <Footer />
    </div>
}