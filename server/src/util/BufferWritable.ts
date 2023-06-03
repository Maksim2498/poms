export default interface BufferWritable {
    readonly byteLength: number

    toBuffer(): Buffer
    writeToBuffer(buffer: Buffer, offset?: number): number
}