export default async function sleep(milliseconds: number) {
    await new Promise<void>(resolve => setTimeout(resolve, milliseconds))
}