import Server           from "Server"

import EventEmitter     from "events"

import { WebSocket    } from "ws"
import { Request      } from "express"
import { RCON as Rcon } from "minecraft-server-util"

export interface CreationOptions {
    readonly server:  Server
    readonly socket:  WebSocket
    readonly request: Request
}

export interface RconProxyEvents {
    on(eventName: "close", listener: () => void): this
}

export class RconProxy extends    EventEmitter
                       implements RconProxyEvents {
    private readonly socket: WebSocket

    readonly         server: Server
    readonly         ip:     string

    constructor(options: CreationOptions) {
        super()

        const { server, request, socket } = options

        if (!server.config.rconAvailable)
            throw new Error("RCON isn't available")

        const rcon   = new Rcon()
        const { ip } = request

        this.server = server
        this.socket = socket
        this.ip     = ip

        const { logger } = server

        logger?.debug(`Creating RCON proxy for client at ${ip}...`)

        socket.on("close", () => {
            logger?.debug(`RCON proxy connection with a client at ${ip} is closed`)
            rcon.close()
            this.emit("close")
        })

        socket.once("message", async data => {
            const connection = await server.pool.getConnection()

            connection.beginTransaction()

            try {
                const aTokenIdString = data.toString()

                logger?.debug(`Authorizing RCON user with access token ${aTokenIdString}...`)

                const aTokenIdBuffer = Buffer.from(aTokenIdString, "hex")
                const aTokenInfo     = await server.tokenManager.getATokenInfo(connection, aTokenIdBuffer)

                if (aTokenInfo == null) {
                    logger?.debug("Authorization failed")
                    this.close()
                    return
                }

                const { userId } = aTokenInfo
                const userInfo   = await server.userManager.getUserInfo(connection, userId)

                if (userInfo?.isAdmin !== true) {
                    logger?.debug("Authorization failed")
                    this.close()
                    return
                }

                socket.send("ok", async error => {
                    if (error)
                        return

                    logger?.debug("Authorization succeeded")
                    await initRcon.call(this)
                })
            } catch (error) {
                logger?.error(error)
                socket.close()
            } finally {
                connection.commit()
                connection.release()
            }
        })

        async function initRcon(this: RconProxy) {
            logger?.debug(`Initializing RCON connection with ${server.config.rconAddress}...`)
            
            try {
                await connectRcon()
                await loginRcon()
                setupMessageProxy.call(this)
                logger?.debug("RCON is successfully initialized")
            } catch (error) {
                logger?.error(error)
                logger?.debug("RCON initialization failed")
                this.close()
            }

            async function connectRcon() {
                logger?.debug("Connecting to RCON...")

                const { config } = server
                const host       = config.rconHost
                const port       = config.rconPort

                await rcon.connect(host, port)

                logger?.debug("Connected")
            }

            async function loginRcon() {
                logger?.debug("Logging in RCON...")

                const password = server.config.read.rcon?.password

                await rcon.login(password!)

                logger?.debug("Logged in")
            }

            function setupMessageProxy(this: RconProxy) {
                rcon.on("message", ({message}) => socket.send(message))

                socket.on("message", async message => {
                    try {
                        await rcon.execute(message.toString())
                    } catch (error) {
                        logger?.error(error)
                        this.close()
                    }
                })
            }
        }
    }

    close() {
        const { logger } = this.server

        logger?.debug(`Closing RCON proxy for client at ${this.ip}...`)
        this.socket.close() // rcon will be closed via socket "close" event listener
        logger?.debug("Closed")
    }
}