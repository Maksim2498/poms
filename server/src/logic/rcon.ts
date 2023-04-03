import Server           from "Server"

import EventEmitter     from "events"

import { WebSocket    } from "ws"
import { RCON as Rcon } from "minecraft-server-util"

export interface CreationOptions {
    readonly server: Server
    readonly socket: WebSocket
}

export interface RconProxyEvents {
    on(eventName: "close", listener: () => void): this
}

export class RconProxy extends    EventEmitter
                       implements RconProxyEvents {
    private readonly socket: WebSocket
    private readonly rcon:   Rcon

    readonly         server: Server

    constructor(options: CreationOptions) {
        super()

        const { server, socket } = options

        if (!server.config.rconAvailable)
            throw new Error("RCON isn't available")

        const rcon = new Rcon()

        this.server = server
        this.socket = socket
        this.rcon   = rcon

        const { logger } = server

        logger?.debug("Creating RCON proxy...")

        socket.on("close", () => {
            logger?.debug("RCON proxy lost connection with a client")
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

                socket.send("true", async error => {
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
            logger?.debug("Initializing RCON connection...")
            
            try {
                await connectRcon()
                await loginRcon()
                setupMessageProxy.call(this)
            } catch (error) {
                logger?.error(error)
                logger?.debug("RCON initialization failed")
                this.close()
            }

            logger?.debug("RCON is successfully initialized")

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

        logger?.debug("Closing RCON proxy...")
        this.socket.close() // rcon will be closed via socket "close" event listener
        logger?.debug("Closed")
    }
}