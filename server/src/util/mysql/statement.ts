import AsyncConnection from "./AsyncConnection"

export async function showTables(connection: AsyncConnection): Promise<string[]> {
    connection.logger?.info("Getting table list...")

    const tables = await connection.query(
        "SHOW TABLES",
        [],
        (results: any[], fields) => results.map(r => r[fields![0].name].toLowerCase()) as string[]
    )

    connection.logger?.info(tables.length ? `Got: ${tables.map(t => `"${t}"`).join(", ")}`
                                          : "There is no tables")

    return tables
}

export async function createDatabase(connection: AsyncConnection, name: string, use?: boolean): Promise<boolean> {
    connection.logger?.info(`Creating database "${name}"...`)

    const created = await connection.query(
        "CREATE DATABASE ??",
        name,
        () => true,
        error => error.code === "ER_DB_CREATE_EXISTS" ? false : undefined
    )

    connection.logger?.info(created ? "Created" : "Already exists")

    if (use)
        await useDatabase(connection, name)

    return created
}

export async function clearTable(connection: AsyncConnection, name: string) {
    connection.logger?.warn(`Clearing table "${name}"...`)
    await connection.query("DELETE FROM ??", name)
    connection.logger?.warn("Cleared")
}

export async function useDatabase(connection: AsyncConnection, name: string) {
    connection.logger?.info(`Selecting database "${name}"...`)
    await connection.query("USE ??", name)
    connection.logger?.info("Selected")
}

export async function dropTable(connection: AsyncConnection, name: string) {
    connection.logger?.warn(`Dropping table "${name}"...`)
    await connection.query("drop table ??", name)
    connection.logger?.warn("Dropped")
}