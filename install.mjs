import readLine            from "readline"

import { execSync        } from "child_process"
import { fileURLToPath   } from "url"
import { dirname         } from "path"
import { promises as fsp } from "fs"

const CONFIG_FILE_PATH    = "poms-config.json"
const DEFAULT_CONFIG_JSON = {}

try {
    await main()
} catch (error) {
    console.error(error.message ?? error)
    process.exitCode = 1
}

async function main() {
    console.log("Starting installation process...")

    setupWorkingDirectory()
    installPackages()

    const config = await getOrCreateConfig()

    if (config == null) {
        console.log("Aborting...")
        return
    }

    await setupConfig(config)
    await saveConfig(config)

    console.log("Installation process is done")
}

function setupWorkingDirectory() {
    const newDir = dirname(fileURLToPath(import.meta.url))

    console.log(`Setting working directory to ${newDir}...`)
    process.chdir(newDir)
    console.log("Set")
}

function installPackages() {
    console.log("Installing packages for server...")
    execSync("npm i", { cwd: "server" })
    console.log("Installed")

    console.log("Installing packages from site...")
    execSync("npm i", { cwd: "site" })
    console.log("Installed")
}

async function getOrCreateConfig() {
    try {
        console.log(`Looking for ${CONFIG_FILE_PATH} configuration file...`)

        const text = await fsp.readFile(CONFIG_FILE_PATH, "utf8")

        console.log("Found and read")
        console.log("Parsing...")
        
        try {
            const json = JSON.parse(text)

            console.log("Parsed")

            return { json, isNew: false }
        } catch {
            console.error("Configuration file is invalid JSON file")
            
            const createNew = await promptBool("Would you like to recreate it?")

            if (!createNew)
                return null
            
            console.log("Creating new one...")

            await fsp.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG_JSON))

            console.log("Done")

            return { json: DEFAULT_CONFIG_JSON, isNew: true }
        }

    } catch (error) {
        switch (error.code) {
            case "ENOENT":
                console.log(`Configuration file not found. Creating empty one...`)

                await fsp.appendFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG_JSON))

                console.log("Done")
                
                return { json: DEFAULT_CONFIG_JSON, isNew: true }
            
            case "EPERM":
                throw new Error(`You have no permission to read configuration file`)

            default:
                throw error
        }
    }
}

async function setupConfig(config) {
    const { json, isNew } = config

    console.log("Starting configuration file setup up...")

    if (isNew) {
        json.mysql = {
            login:    await promptMysqlLogin(),
            password: await promptMysqlPassword(),
        }

        return
    } else {
        let login = json.mysql?.login

        if (login == null)
            login = await promptMysqlLogin()
        else {
            const change = await promptBool(`Configuration file already has login set to "${login}". Would you like to change it?`)

            if (change)
                login = await promptMysqlLogin()
        }

        let password = json.mysql?.password

        if (password == null)
            password = await promptMysqlPassword()
        else {
            const change = await promptBool(`Configuration file already has password set. Would you like to change it?`)

            if (change)
                password = await promptMysqlPassword()
        }

        if (typeof json.mysql !== "object")
            json.mysql = {}

        json.mysql.login    = login
        json.mysql.password = password
    }

    console.log("Configuration file is set up")

    async function promptMysqlLogin() {
        return await promptString("Enter MySQL user login: ")
    }

    async function promptMysqlPassword() {
        return await promptPasswordString("Enter MySQL user password: ")
    }
}

async function saveConfig(config) {
    console.log("Saving config...")

    const text = JSON.stringify(config.json, null, 4)

    await fsp.writeFile(CONFIG_FILE_PATH, text)

    console.log("Saved")
}

async function promptPasswordString(message) {
    return escapeString(await promptPassword(message))
}

function promptPassword(message = "") {
    return new Promise(resolve => {
        const { stdin, stdout } = process

        stdout.write(message)

        stdin.setEncoding("utf8")
        stdin.setRawMode(true)
        stdin.resume()
        stdin.on("data", onData)

        let password = ""

        function onData(chars) {
            for (const char of chars)
                switch (char) {
                    case "\u0004": // Ctrl-D
                    case "\r":
                    case "\n":
                        stop()
                        resolve(password)
                        return

                    case "\u0003": // Ctrl-C
                        stop()
                        process.exit(1)
                        return
                    
                    case "\u007F": // Backspace
                        if (password.length) {
                            password = password.slice(0, -1)
                            stdout.write("\b \b") // Doesn't handle the case with input longer than one line
                        }

                        return

                    default:
                        password += char
                        stdout.write("*")
                }
        }

        function stop() {
            stdin.removeListener("data", onData)
            stdin.setRawMode(false)
            stdin.pause()

            stdout.write("\n")
        }
    })
}

async function promptString(message) {
    return escapeString(await prompt(message))
}

function escapeString(string) {
    return string.replaceAll('"',  '\\"')
                 .replaceAll("\n", "\\n")
}

async function promptBool(message) {
    while (true) {
        const input       = await prompt(`${message} (y/n) `)
        const normedInput = input.trim().toLowerCase()

        switch (normedInput) {
            case "y":
                return true

            case "n":
                return false

            default:
                console.error("Invalid input!")
        }
    }
}

async function prompt(message = "") {
    const readLineInterface = readLine.createInterface({
        input:  process.stdin,
        output: process.stdout,
    })

    const input = await new Promise(resolve => readLineInterface.question(message, resolve))

    readLineInterface.close()

    return input
}