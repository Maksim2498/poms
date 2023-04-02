import EventEmitter from "events"
import Token        from "logic/Token"

export type State = "connecting"
                  | "connected"
                  | "authorizing"
                  | "authorized"
                  | "disconnecting"
                  | "disconnected"

export default class ConsoleSocket extends EventEmitter {
    static readonly URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/console`

    private socket:     WebSocket
    private authorized: boolean = false
    private _state:     State   = "connecting"

    constructor() {
        super()

        this.socket = new WebSocket(ConsoleSocket.URL)

        this.socket.addEventListener("close", () => {
            if (this._state === "connecting")
                this.emit("connection-lost")

            this._state = "disconnected"

            this.emit("disconnected")
        })

        this.socket.addEventListener("error", () => {
            this._state = "disconnected"
            this.emit("connection-lost")
        })

        this.socket.addEventListener("open", () => {
            this._state = "connected"
            this.emit("connected")
        })
    }

    on(eventName: "connection-lost",      listener: (              ) => void): this
    on(eventName: "connection-failed",    listener: (              ) => void): this
    on(eventName: "disconnecting",        listener: (              ) => void): this
    on(eventName: "disconnected",         listener: (              ) => void): this
    on(eventName: "authorization-failed", listener: (              ) => void): this
    on(eventName: "authorized",           listener: (              ) => void): this
    on(eventName: "authorizing",          listener: (              ) => void): this
    on(eventName: "connected",            listener: (              ) => void): this
    on(eventName: "messagae",             listener: (text: string  ) => void): this
    on(eventName: string | symbol,        listener: (...args: any[]) => void): this {
        return super.on(eventName, listener)
    }

    emit(eventName: "connection-lost"               ): boolean
    emit(eventName: "connection-failed"             ): boolean
    emit(eventName: "disconnecting"                 ): boolean
    emit(eventName: "disconnected"                  ): boolean
    emit(eventName: "authorization-failed"          ): boolean
    emit(eventName: "authorized"                    ): boolean
    emit(eventName: "authorizing"                   ): boolean
    emit(eventName: "connected"                     ): boolean
    emit(eventName: "messagae",         text: string): boolean
    emit(eventName: string | symbol, ...args: any[]):  boolean {
        return super.emit(eventName, ...args)
    }

    get state(): State {
        return this._state
    }

    async disconnect(): Promise<void> {
        this.checkState([
            "connecting",
            "connected",
            "authorizing",
            "authorized"
        ])

        await new Promise(resolve => {
            this.emit("disconnecting")
            this.socket.onclose = resolve
            this.socket.close()
        })
    }

    send(message: string) {
        this.checkState(["authorized"], "send message")
        this.socket.send(message)
    }

    async auth(accessTokenId: string): Promise<boolean> {
        Token.checkId(accessTokenId)

        this.checkState(["connected"], "authorize")
        this._state = "authorizing"

        this.emit("authorizing")

        try {
            await new Promise<void>((resolve, reject) => {
                this.socket.onmessage = event => {
                    const data       = event.data.trim().toLowerCase()
                    const authorized = data === "true"

                    if (authorized) {
                        resolve()
                        return
                    }

                    reject()
                }

                this.socket.send(accessTokenId)
            })

            this.socket.onmessage = event => this.emit("messagae", event.data)
            this._state           = "authorized"

            this.emit("authorized")

            return true
        } catch {
            this._state = "connected"
            this.emit("authorization-failed")
            return false
        }
    }

    private checkState(required: State[], action?: string) {
        if (required.includes(this.state))
            return

        const requiredString = required.map(r => `"${r}"`).join(", ")
        const actionString   = action ?? "perform action"
        const message        = `Cannot ${actionString} while in "${this.state}" state. One of the following states is required: ${requiredString}`

        throw new Error(message)
    }
}