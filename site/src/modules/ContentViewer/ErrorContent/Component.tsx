import ErrorText             from "ui/ErrorText/Component";
import styles                from "./styles.module.css"

import { ErrorContentProps } from "./types";

export default function ErrorContent(props: ErrorContentProps) {
    return <div className={styles.content}>
        <ErrorText>{props.children}</ErrorText>
    </div>
}