import { useState } from "react"

export default function useForceRerender(): () => void {
    const [, setValue] = useState(0)
    return () => setValue(value => value + 1)
}