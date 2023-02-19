const CONFIG_FILE_PATH    = "poms-config.json"
const DEFAULT_CONFIG_JSON = {}

const cp = require("child_process")
const fs = require("fs")
const rl = require("readline")

const rli = rl.createInterface({
    input:  process.stdin,
    output: process.stdout
})

main()
    .catch(error => console.error(error.message ?? error))
    .finally(() => rli.close())

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
    saveConfig(config.json)

    console.log("Installation process is done")
}

function setupWorkingDirectory() {
    console.log(`Setting working directory to ${__dirname}...`)
    process.chdir(__dirname)
    console.log("Set")
}

function installPackages() {
    console.log("Installing packages for server...")
    cp.execSync("npm i", { cwd: "server" })
    console.log("Done")

    console.log("Installing packages from site...")
    cp.execSync("npm i", { cwd: "site" })
    console.log("Done")
}

async function getOrCreateConfig() {
    try {
        console.log(`Looking for ${CONFIG_FILE_PATH} configuration file...`)

        const buffer = fs.readFileSync("poms-config.json")

        console.log("Found and read. Parsing...")

        const text = buffer.toString()
        
        try {
            const json = JSON.parse(text)

            console.log("Done")

            return { json, isNew: false }
        } catch {
            console.error("Configuration file is invalid JSON file")
            
            const createNew = await promptBool("Would you like to recreate it?")

            if (!createNew)
                return null
            
            console.log("Creating new one...")
            fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG_JSON))
            console.log("Done")

            return { json: DEFAULT_CONFIG_JSON, isNew: true }
        }

    } catch (error) {
        switch (error.code) {
            case "ENOENT":
                console.log(`Configuration file not found. Creating empty one...`)
                fs.appendFileSync(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIG_JSON))
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
            const change = await promptBool(`Configuration file already has login set ("${login}"). Would you like to change it?`)

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

async function saveConfig(json) {
    console.log("Saving config...")
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(json, null, 4))
    console.log("Done")
}

async function promptPasswordString(prompt) {
    const text        = await promptPassword(prompt)
    const escapedText = text.replaceAll(`"`, `\\"`)
                            .replaceAll("\n", "\\n")
    
    return escapedText
}

async function promptPassword(prompt) {
    const BACKSPACE    = "\u007F"
    const stdout       = process.stdout
    const eventHandler = c => {
        if (c !== BACKSPACE) {
            rl.moveCursor(stdout, -1, 0, () => stdout.write("*"))
            return
        }

        const length = rli.line.length
        
        rl.moveCursor(stdout, -length, 0)
        rl.clearLine(stdout, 1)
        stdout.write("*".repeat(length))
    }

    rli.input.on("keypress", eventHandler);

    const password = await readLine(prompt)

    rli.removeListener("keypress", eventHandler)

    return password
}

async function promptString(prompt) {
    const text        = await readLine(prompt)
    const escapedText = text.replaceAll(`"`, `\\"`)
                            .replaceAll("\n", "\\n")
    
    return escapedText
}

async function promptBool(prompt) {
    while (true) {
        const input = (await readLine(`${prompt} (y/n) `)).trim().toLowerCase()

        switch (input) {
            case "y":
                return true

            case "n":
                return false

            default:
                console.error("Invalid input!")
        }
    }
}

async function readLine(prompt) {
    return await new Promise(resolve => rli.question(prompt, resolve))
}