import { Logger } from "winston"
import { Config } from "./config"

export interface RunServerOptions {
    config:  Config
    logger?: Logger
}

export async function runServer(options: RunServerOptions) {

}