import { Server as HTTPServer } from "http"
import { Application          } from "express"
import { Logger               } from "winston"
import { Config               } from "./config"

import express from "express"

export interface ServerOptions {
    config:  Config
    logger?: Logger
}

export class Server {
    private readonly expressApp:  Application
    private          httpServer?: HTTPServer

    private runPromise?:        Promise<void>
    private resolveRunPromise?: () => void
    private rejectRunPromise?:  (value: any) => void

    readonly config:  Config
    readonly logger?: Logger

    constructor(options: ServerOptions) {
        const { config, logger } = options

        this.expressApp = express()
        this.config     = config
        this.logger     = logger
    }

    async start() {
        if (this.runPromise)
            return

        this.runPromise = new Promise<void>((resolve, reject) => {
            this.resolveRunPromise = resolve
            this.rejectRunPromise  = reject
        })

        this.logger?.info(`Starting listening at ${this.config.apiAddress}...`)

        const socketPath = this.config.api?.socketPath
        const listening  = () => this.logger?.info("Listening...")

        this.httpServer = socketPath != null ? this.expressApp.listen(socketPath, listening)
                                             : this.expressApp.listen(this.config.apiPort, this.config.apiHost, listening)

        await this.runPromise
    }

    async stop() {
        if (!this.runPromise)
            return

        this.logger?.info("Stopping...")

        this.httpServer?.close(error => {
            if (error)
                this.logger?.error(error)

            this.logger?.info("Stopped")
            this.resolveRunPromise!()
        })

        await this.runPromise
    }
}