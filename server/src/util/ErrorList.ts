export default class ErrorList extends Error {
    readonly errors: Error[]

    constructor(errors: Error[]) {
        super()
        this.errors = [...errors]
    }
}