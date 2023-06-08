import AnyObject      from "./AnyObject"
import DeepPartialAny from "./DeepPartialAny"

type ModifyDeep<A, B extends DeepPartialAny<A>> = {
    [K in keyof A | keyof B]:
        K extends keyof A
            ? K extends keyof B
                ? A[K] extends AnyObject
                    ? B[K] extends AnyObject
                        ? B[K] extends readonly any[]
                            ? B[K]
                            : ModifyDeep<A[K], B[K]>
                        : B[K]
                    : B[K]
                : A[K]
            : B[K]
}

export default ModifyDeep