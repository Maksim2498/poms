import useStateRef          from "react-usestateref";

import { MutableRefObject } from "react";

export default function useLiveRef<T>(initValue: T): MutableRefObject<T> {
    const [, setValue, valueRef] = useStateRef(initValue)

    return {
        get current(): T {
            return valueRef.current
        },

        set current(newValue: T) {
            setValue(newValue)
        }
    }
}