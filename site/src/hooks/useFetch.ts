import { useEffect, useState  } from "react"

export type UseFetchResult = [
    null,      // Fetch result
    true,      // Is loading
    null       // Error
] | [
    null,      // Fetch result
    false,     // Is loading
    string     // Error
] | [
    Response, // Fetch result
    false,    // Is loading
    null      // Error
]

export default function useFetch(url: string, options?: RequestInit): UseFetchResult {
    const [response, setResponse] = useState(null as Response | null)
    const [loading,  setLoading ] = useState(true)
    const [error,    setError   ] = useState(null as string   | null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(url, options)

                if (response.ok) {
                    setResponse(response)
                    return
                }

                setError(response.statusText)
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message)
                    return
                }

                setError(String(error))
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return [response, loading, error] as UseFetchResult
}