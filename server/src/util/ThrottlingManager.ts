import { Logger } from "winston"

export default class ThrottlingManager {
    private table: Map<string, Promise<void>> = new Map()

    readonly delay:   number
    readonly logger?: Logger

    constructor(delay: number, logger?: Logger) {
        this.delay  = delay
        this.logger = logger

        logger?.debug(`Created throttling manager with ${delay} milliseconds deley`)
    }

    async throttle(id: string) {
        this.logger?.debug(`Throttling ${id}...`)

        let promise = this.table.get(id)

        if (promise == null) {
            promise = new Promise(resolve => setTimeout(resolve, this.delay))
            this.table.set(id, promise)
        }

        await promise
    
        this.logger?.debug(`${id} throttling is done`)

        this.table.delete(id)
    }
}