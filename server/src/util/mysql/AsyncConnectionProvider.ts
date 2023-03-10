import AsyncConnection from "./AsyncConnection";

export default interface AsyncConnectionProvider {
    readonly mysqlConnection: AsyncConnection
}