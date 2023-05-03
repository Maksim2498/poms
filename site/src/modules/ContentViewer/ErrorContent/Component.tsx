import styles                from "./styles.module.css"

import { ErrorText         } from "ui/ErrorText"
import { ErrorContentProps } from "./types"

export default function ErrorContent(props: ErrorContentProps) {
    return <div className={styles.content}>
        <ErrorText>{props.children}</ErrorText>
    </div>
}