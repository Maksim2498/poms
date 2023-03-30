import { AuthController, get } from "logic/api"

export async function isConsoleAvailable(authController: AuthController): Promise<boolean> {
    const [json] = await get(authController, "console-available")
    return Boolean(json.available)
}