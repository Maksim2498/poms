import ReadonlyDate from "../date/ReadonlyDate"

export const BYTE_LENGTH_OF_BOOLEAN = 1

export function readBoolean(buffer: Buffer, offset: number = 0): boolean {
    return Boolean(buffer.readUInt8(offset))
}

export function writeBoolean(buffer: Buffer, boolean: boolean, offset: number = 0): number {
    return buffer.writeUInt8(Number(boolean), offset)
}

/*
    Buffer structure of tiny string:

    struct TinyString {
        uint8_t byteLength;
        char    bytes[255];
    };
*/

export const BYTE_LENGTH_OF_TINY_STRING = 256

export function readTinyString(buffer: Buffer, offset: number = 0): string {
    const length = buffer.readUInt8(offset++)
    return buffer.toString("utf8", offset, offset + length)
}

export function writeTinyString(buffer: Buffer, string: string, offset: number = 0): number {
    const MAX_LENGTH = 255

    let length = Buffer.byteLength(string)

    if (length > MAX_LENGTH)
        length = MAX_LENGTH

    buffer.writeUInt8(string.length, offset++)
    buffer.write(string, offset, length)

    offset += MAX_LENGTH

    return offset
}

/*
    Buffer structure of date:

    struct Date {
        uint64_t milliseconds;
    };
*/

export const BYTE_LENGTH_OF_DATE = 8

export function readDate(buffer: Buffer, offset: number = 0): Date {
    const bigInt = buffer.readBigUint64LE(offset)
    const number = Number(bigInt)
    const date   = new Date(number)

    return date
}

export function writeDate(buffer: Buffer, date: ReadonlyDate, offset: number = 0): number {
    const number = date.valueOf()
    const bigInt = BigInt(number)

    return buffer.writeBigUInt64LE(bigInt, offset)
}

export function checkBufferSize(buffer: Buffer, requiredSize: number) {
    const invalidReason = validateBufferSize(buffer, requiredSize)

    if (invalidReason != null)
        throw new Error(invalidReason)
}

export function validateBufferSize(buffer: Buffer, requiredSize: number): string | undefined {
    if (buffer.length >= requiredSize)
        return undefined

    return `Buffer is too small. Minimum expected size: ${requiredSize}. Got: ${buffer.length}`
}