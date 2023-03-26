import { useEffect, useState } from "react"

export type UseAsyncArg<T> = () => Promise<T>

export type UseAsyncResult<T> = [
    // Loading

    null,   // Result
    true,   // Loading
    null,   // Error
] | [
    // Error

    null,   // Result
    false,  // Loading
    string  // Error
] | [
    // Result

    T,      // Result
    false,  // Loading
    null    // Error
]

export default function useAsync<T>(asyncFunc: UseAsyncArg<T>, deps?: React.DependencyList): UseAsyncResult<T> {
    const [result,  setResult ] = useState(null as T      | null)
    const [loading, setLoading] = useState(true)
    const [error,   setError  ] = useState(null as string | null)

    useEffect(() => {
        setLoading(true)

        asyncFunc()
            .then(result => setResult(result))
            .catch(error => setError(error instanceof Error ? error.message : String(error)))
            .finally(()  => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps ?? [])

    return [result, loading, error] as UseAsyncResult<T>
}