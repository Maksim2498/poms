import z                       from "zod"
import useFetchJson            from "hooks/useFetchJson"

import { useEffect, useState } from "react"

const SCHEMA = z.object({
    allowed: z.boolean()
})

export type UseFetchAccessResult = [
    null,    // Allowed
    true     // Loading
] | [
    boolean, // Allowed
    false    // Loading
]

export default function useFetchAccess(): UseFetchAccessResult {
    const [json,    loading,    error] = useFetchJson("/api/anonym-access-allowed", { cache: "no-store" })
    const [allowed, setAllowed       ] = useState(null as boolean | null)

    useEffect(() => {
        if (loading)
            return

        if (error) {
            setAllowed(false)
            console.error(error)
            return
        }

        try {
            const { allowed } = SCHEMA.parse(json)
            setAllowed(allowed)
        } catch (error) {
            setAllowed(false)
            console.error(error)
        }
    }, [error, json, loading])

    return [allowed, loading] as UseFetchAccessResult
}