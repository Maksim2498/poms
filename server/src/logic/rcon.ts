import Server             from "Server"

import EventEmitter       from "events"

import { WebSocket      } from "ws"
import { Request        } from "express"
import { RCON as Rcon   } from "minecraft-server-util"
import { AssertionError } from "assert"

export interface CreationOptions {
    readonly server:  Server
    readonly socket:  WebSocket
    readonly request: Request
}

export interface RconProxyEvents {
    on(eventName: "authorized", listener: (login: string, id: number) => void): this
    on(eventName: "close",      listener: (                         ) => void): this
}

export class RconProxy extends    EventEmitter
                       implements RconProxyEvents {
    private readonly socket:  WebSocket
    private          _id?:    number
    private          _login?: string

    readonly         server:  Server
    readonly         ip:      string

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

        logger?.debug(`Creating RCON proxy for ${this.address}...`)

        socket.on("close", () => {
            logger?.debug(`RCON proxy connection with ${this.address} is closed`)
            rcon.close()
            this.emit("close")
        })

        socket.once("message", async data => {
            const failed = () => {
                logger?.debug(`RCON authorization of ${this.address} failed`)
                this.close()
            }

            const connection = await server.pool.getConnection()

            connection.beginTransaction()

            try {
                const aTokenIdString = data.toString()

                logger?.debug(`Starting RCON authorization for ${this.address} with access token ${aTokenIdString}...`)

                const aTokenIdBuffer = Buffer.from(aTokenIdString, "hex")
                const aTokenInfo     = await server.tokenManager.getATokenInfo(connection, aTokenIdBuffer)

                if (aTokenInfo == null) {
                    failed()
                    return
                }

                const { userId } = aTokenInfo
                const userInfo   = await server.userManager.getUserInfo(connection, userId)

                if (userInfo?.isAdmin !== true) {
                    failed()
                    return
                }

                socket.send("ok", async error => {
                    if (error) {
                        failed()
                        return
                    }

                    const { login, id } = userInfo

                    this._login = login
                    this._id    = id

                    logger?.debug(`RCON authorization of ${this.address} succeeded`)

                    this.emit("authorized", login, id)

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
            logger?.debug(`Initializing RCON connection with ${server.config.rconAddress} for ${this.address}...`)
            
            try {
                await connectRcon.call(this)
                await loginRcon.call(this)
                setupMessageProxy.call(this)
                logger?.debug(`RCON is successfully initialized for ${this.address}`)
            } catch (error) {
                logger?.error(error)
                logger?.debug(`RCON initialization is failed for ${this.address}`)
                this.close()
            }

            async function connectRcon(this: RconProxy) {
                logger?.debug(`Connecting ${this.address} to RCON...`)

                const { config } = server
                const host       = config.rconHost
                const port       = config.rconPort

                await rcon.connect(host, port)

                logger?.debug(`${this.address} is connected to RCON`)
            }

            async function loginRcon(this: RconProxy) {
                logger?.debug(`Logging ${this.address} in RCON...`)

                const password = server.config.read.rcon?.password

                await rcon.login(password!)

                logger?.debug(`${this.address} is logged in RCON`)
            }

            function setupMessageProxy(this: RconProxy) {
                rcon.on("message", ({message}) => {
                    logger?.debug(`${this.address} got response from rcon: ${message}`)
                    socket.send(message)
                })

                socket.on("message", async message => {
                    logger?.info(`${this.address} issued server command /${message}`)

                    try {
                        const command = message.toString()

                        if (command.length !== 0)
                            // extra whitespace added because of
                            // invalid length assertion in minecraft-server-util package
                            await rcon.execute(command + " ") 
                    } catch (error) {
                        if (error instanceof AssertionError) {
                            logger?.debug(`Assertion error: ${error.message}`)
                            return
                        }

                        logger?.error(error)
                        this.close()
                    }
                })
            }
        }
    }

    get id(): number | undefined {
        return this._id
    }

    get login(): string | undefined {
        return this._login
    }

    get address(): string {
        return this.authorized ? `${this._login}[${this._id}]@${this.ip}`
                               : `@${this.ip}`
    }

    get authorized(): boolean {
        return this._id != null
    }

    close() {
        const { logger } = this.server

        logger?.debug(`Closing RCON proxy connection for ${this.address}...`)
        this.socket.close() // rcon will be closed via socket "close" event listener
    }
}