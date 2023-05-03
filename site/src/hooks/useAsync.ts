import { useEffect, useState, useRef } from "react"

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

export type UseAsyncDestructor = () => void

export default function useAsync<T>(
    asyncFunc:  UseAsyncArg<T>,
    deps:       React.DependencyList = [],
    destructor: UseAsyncDestructor   = () => {}
): UseAsyncResult<T> {
    const [result,  setResult ] = useState(null as T      | null)
    const [loading, setLoading] = useState(true                 )
    const [error,   setError  ] = useState(null as string | null)

    const destructedRef         = useRef(false)

    useEffect(() => {
        setResult(null)
        setLoading(true)
        setError(null)

        asyncFunc()
            .then(result => {
                destructedRef.current = false
                setResult(result)
            })
            .catch(error => {
                if (!destructedRef.current)
                    setError(error instanceof Error ? error.message : String(error))
            })
            .finally(()  => {
                if (!destructedRef.current)
                    setLoading(false)
            })

        return () => {
            destructor();
            destructedRef.current = true
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return [result, loading, error] as UseAsyncResult<T>
}