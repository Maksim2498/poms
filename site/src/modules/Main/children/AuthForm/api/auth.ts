import AuthInfo from "logic/AuthInfo";

export default async function auth(login: string, password: string): Promise<AuthInfo> {
    return new Promise((resolve, reject) => setTimeout(() => reject(new Error("Invalid login or password")), 1000))
    
}