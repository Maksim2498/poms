import styles from "./styles.module.css"

export default function GitHub() {
    return <a className = {styles.Github}
              href      = "https://github.com/Maksim2498/poms"
              target    = "_blank"
              rel       = "noreferrer">
              GitHub
           </a>
}