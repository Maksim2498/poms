import Config                                                          from "Config"
import LogicError                                                      from "logic/LogicError"
import CacheManager                                                    from "util/buffer/CacheManager"
import User                                                            from "./User"
import UserRole                                                        from "./UserRole"

import { Connection as MysqlConnection, FieldPacket, ResultSetHeader } from "mysql2/promise"
import { Logger                                                      } from "winston"
import { escape                                                      } from "util/string"

export interface UserManagerOptions {
    readonly config:        Config
    readonly logger?:       Logger       | null
    readonly cacheManager?: CacheManager | null
}

export interface BaseUserCreationOptions {
    readonly login:               string
    readonly name?:               string | null
    readonly icon?:               Buffer | null
    readonly password?:           string
    readonly passwordHash?:       Buffer
    readonly role?:               UserRole
    readonly creatorId?:          number | null
    readonly nicknames?:          ReadonlyArray<string>
    readonly dontCheckCreatorId?: boolean
}

export interface PasswordUserCreationOptions extends BaseUserCreationOptions {
    readonly password: string
}

export interface PasswordHashUserCreationOptions extends BaseUserCreationOptions {
    readonly passwordHash: Buffer
}

export type UserCreationOptions = PasswordUserCreationOptions
                                | PasswordHashUserCreationOptions

export default class UserManager {
    private static makeCacheEntryKey(login: string): string {
        return `user-${login.toLowerCase()}`
    }

    readonly config:       Config
    readonly logger:       Logger       | null
    readonly cacheManager: CacheManager | null

    constructor(options: UserManagerOptions) {
        this.config       = options.config
        this.logger       = options.logger       ?? null
        this.cacheManager = options.cacheManager ?? null

        this.logger?.debug("User manager created")
    }

    async create(connection: MysqlConnection, options: UserCreationOptions): Promise<User> {
        // TODO

        const login = User.normLogin(options.login)

        User.checkNormedLogin(login)

        const creatorId = options.creatorId ?? null

        if (creatorId != null)
            User.checkId(creatorId)

        const name = User.normName(options.name ?? null)

        User.checkNormedName(name)

        const icon = options.icon ?? null

        User.checkIcon(this.config, icon)

        const passwordHash = options.passwordHash ?? User.evalPasswordHash(login, options.password!)

        User.checkPasswordHash(passwordHash)

        const role         = options.role         ?? UserRole.USER
        const nicknames    = options.nicknames    ?? []
        
        this.logger?.debug(`Creating user ${escape(login)}...`)

        const cacheEntryName = UserManager.makeCacheEntryKey(login)

        if (this.cacheManager != null) {
            this.logger?.debug("Checking cache for such a user...")

            if (this.cacheManager?.has(cacheEntryName)) {
                this.logger?.debug("Found")
                userAlreadyExists()
            }

            this.logger?.debug("Not found")
        }

        if (creatorId != null && !options.dontCheckCreatorId) {
            this.logger?.debug(`Checking creator id (${creatorId})...`)

            if (await this.existsWithId(connection, creatorId))
                this.logger?.debug("Found")
            else {
                this.logger?.debug("Not found")
                throw new LogicError(`There is no user with id ${creatorId}`)
            }
        }

        try {
            this.logger?.debug("Inserting data into the Users table...")

            const [{ insertId: id }] = await connection.execute(
                "INSERT INTO Users (login, name, icon, cr_id, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    login,
                    name,
                    icon,
                    creatorId,
                    passwordHash,
                    role
                ]
            ) as [ResultSetHeader, FieldPacket[]]

            this.logger?.debug("Inserted")
            this.logger?.debug("Inserting data into the Nicknames table...")

            const values = nicknames.map(nickname => [id, nickname])
                                    .flat()

            const valuesSql = nicknames.map(() => `(?, ?)`)
                                       .join(",")

            await connection.execute(
                `INSERT INTO Nicknames (user_id, nickname) VALUES ${valuesSql}`,
                values
            )

            this.logger?.debug("Inserted")

            return new User({
                config:  this.config,
                created: new Date(),
                id,
                login,
                name,
                icon,
                passwordHash,
                role,
                creatorId,
                nicknames,
            })
        } catch (error) {
            if ((error as any).code === "ER_DUP_ENTRY")
                userAlreadyExists()

            throw error
        }

        function userAlreadyExists(): never {
            throw new LogicError(`User ${escape(login)} already exists`)
        }
    }

    async deleteAll(connection: MysqlConnection) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteByCredentials(connection: MysqlConnection, login: string, password: string) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteByLogin(connection: MysqlConnection, login: string) {
        // TODO
        throw new Error("Not implemented")
    }

    async deleteById(connection: MysqlConnection, id: number) {
        // TODO
        throw new Error("Not implemented")
    }

    async loadAll(connection: MysqlConnection): Promise<User[]> {
        // TODO
        throw new Error("Not implemented")
    }

    async loadByCredentials(connection: MysqlConnection, login: string, password: string): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async loadByLogin(connection: MysqlConnection, login: string): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async loadById(connection: MysqlConnection, id: number): Promise<User> {
        // TODO
        throw new Error("Not implemented")
    }

    async store(connection: MysqlConnection, user: User) {
        // TODO
        throw new Error("Not implemented")
    }

    async existsWithCredentials(connection: MysqlConnection, login: string, password: string): Promise<boolean> {
        // TODO
        throw new Error("Not implemented")
    }

    async existsWithLogin(connection: MysqlConnection, login: string): Promise<boolean> {
        // TODO
        throw new Error("Not implemented")
    }

    async existsWithId(connection: MysqlConnection, id: number): Promise<boolean> {
        // TODO
        throw new Error("Not implemented")
    }

    private async getIdByCredentials(connection: MysqlConnection, login: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }

    private async getIdByLogin(connection: MysqlConnection, login: string): Promise<number> {
        // TODO
        throw new Error("Not implemented")
    }
}