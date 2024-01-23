package ru.fominmv.poms.server.mc.io

import ru.fominmv.poms.server.mc.nbt.io.TagInputStream
import ru.fominmv.poms.server.util.io.UTF8InputStream

import java.io.InputStream

class McDataInputStream(stream: InputStream)
    : ru.fominmv.poms.server.mc.nbt.io.TagInputStream(stream), McDataInput {
    override fun readVarString(): String {
        val stream = UTF8InputStream(this)
        val length = readVarInt()

        return buildString {
            repeat (length) {
                append(stream.readUTF8Char())
            }
        }
    }

    override fun readFully(value: ByteArray) =
        stream.readFully(value)

    override fun readFully(value: ByteArray, off: Int, len: Int) =
        stream.readFully(value, off, len)

    override fun skipBytes(n: Int): Int =
        stream.skipBytes(n)

    override fun readBoolean(): Boolean =
        stream.readBoolean()

    override fun readByte(): Byte =
        stream.readByte()

    override fun readUnsignedByte(): Int =
        stream.readUnsignedByte()

    override fun readShort(): Short =
        stream.readShort()

    override fun readUnsignedShort(): Int =
        stream.readUnsignedShort()

    override fun readChar(): Char =
        stream.readChar()

    override fun readInt(): Int =
        stream.readInt()

    override fun readLong(): Long =
        stream.readLong()

    override fun readFloat(): Float =
        stream.readFloat()

    override fun readDouble(): Double =
        stream.readDouble()

    @Suppress("DEPRECATION")
    override fun readLine(): String =
        stream.readLine()

    override fun readUTF(): String =
        stream.readUTF()
}
