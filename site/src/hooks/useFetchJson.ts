import useFetch                 from "./useFetch";

import { useEffect, useState  } from "react";

export type UseFetchJsonResult = [
    null,  // JSON
    true,  // Is loading
    null   // Error
] | [
    null,  // JSON
    false, // Is loading
    string // Error
] | [
    any,   // JSON
    false, // Is loading
    null   // Error
]

export default function useFetchJson(url: string, options?: RequestInit): UseFetchJsonResult {
    const [response, loading, error] = useFetch(url, options)

    const [json,        setJson       ] = useState(null as any)
    const [jsonLoading, setJsonLoading] = useState(true)
    const [jsonError,   setJsonError  ] = useState(null as string       | null)

    useEffect(() => {
        if (loading)
            return

        if (error) {
            setJsonLoading(false)
            setJsonError(error)
            return
        }

        const parseResponse = async () => {
            try {
                const json = await response!.json()
                setJson(json)
            } catch (error) {
                if (error instanceof Error) {
                    setJsonError(error.message)
                    return
                }
                setJsonError(String(error))
            } finally {
                setJsonLoading(false)
            }
        }

        parseResponse()
    }, [error, loading, response])

    return [json, jsonLoading, jsonError] as UseFetchJsonResult
}