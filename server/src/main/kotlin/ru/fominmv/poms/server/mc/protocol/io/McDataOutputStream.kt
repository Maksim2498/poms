package ru.fominmv.poms.server.mc.protocol.io

import ru.fominmv.poms.server.mc.protocol.nbt.io.TagOutputStream

import java.io.OutputStream

class McDataOutputStream(stream: OutputStream)
    : TagOutputStream(stream), McDataOutput {
    override fun writeBoolean(value: Boolean) =
        stream.writeBoolean(value)

    override fun writeByte(value: Int) =
        stream.writeByte(value)

    override fun writeShort(value: Int) =
        stream.writeShort(value)

    override fun writeChar(value: Int) =
        stream.writeChar(value)

    override fun writeInt(value: Int) =
        stream.writeInt(value)

    override fun writeLong(value: Long) =
        stream.writeLong(value)

    override fun writeFloat(value: Float) =
        stream.writeFloat(value)

    override fun writeDouble(value: Double) =
        stream.writeDouble(value)

    override fun writeBytes(value: String) =
        stream.writeBytes(value)

    override fun writeChars(value: String) =
        stream.writeChars(value)

    override fun writeUTF(value: String) =
        stream.writeUTF(value)
}