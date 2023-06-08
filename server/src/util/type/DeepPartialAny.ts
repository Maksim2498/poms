import AnyObject from "./AnyObject"

type DeepPartialAny<T> = {
    [P in keyof T]?: T[P] extends AnyObject ? DeepPartialAny<T[P]> : any
}

export default DeepPartialAny