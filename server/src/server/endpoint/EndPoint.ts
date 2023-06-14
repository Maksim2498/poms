import Server                from "server/Server"
import HttpMethod            from "util/HttpMethod"

import { Request, Response } from "express"

export interface EndPointOptions {
    readonly server:              Server
    readonly path:                string
    readonly method?:             HttpMethod
    readonly allowedMimeTypes?:   string[] | null
    readonly evalLastModified?:   EvalEndPointLastModified
    readonly checkAccessAllowed?: CheckEndPointAccessAllowed
    readonly handle?:             HandleEndPoint
}

export type EvalEndPointLastModified   = (this: EndPoint) => Promise<Date>
export type CheckEndPointAccessAllowed = (this: EndPoint, req: Request, res: Response) => Promise<boolean>
export type HandleEndPoint             = (this: EndPoint, req: Request, res: Response) => Promise<void>

export default class EndPoint {
    private readonly _evalLastModified:   EvalEndPointLastModified
    private readonly _checkAccessAllowed: CheckEndPointAccessAllowed
    private readonly _handle:             HandleEndPoint
            readonly server:              Server
            readonly path:                string
            readonly method:              HttpMethod
            readonly allowedMimeTypes:    string[] | null

    constructor(options: EndPointOptions) {
        this.server              = options.server
        this.path                = options.path
        this.method              = options.method             ?? "get"
        this.allowedMimeTypes    = options.allowedMimeTypes   ?? null
        this._evalLastModified   = options.evalLastModified   ?? (async (        ) => new Date()             )
        this._checkAccessAllowed = options.checkAccessAllowed ?? (async (        ) => true                   )
        this._handle             = options.handle             ?? (async (req, res) => { res.sendStatus(501) })
    }

    evalLastModified(): Promise<Date> {
        return this._evalLastModified()
    }

    checkAccessAllowed(req: Request, res: Response): Promise<boolean> {
        return this._checkAccessAllowed(req, res)
    }

    handle(req: Request, res: Response): Promise<void> {
        return this._handle(req, res)
    }
}