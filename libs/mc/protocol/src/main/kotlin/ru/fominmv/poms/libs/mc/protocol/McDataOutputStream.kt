package ru.fominmv.poms.libs.mc.protocol

import ru.fominmv.poms.libs.mc.nbt.io.NbtOutputStream

import java.io.DataOutput
import java.io.DataOutputStream

class McDataOutputStream<T : DataOutputStream>(stream: T) :
    NbtOutputStream<T>(stream),

    DataOutput by stream,
    McDataOutput
{
    override fun write(b: ByteArray) =
        stream.write(b)

    override fun write(b: ByteArray, off: Int, len: Int) =
        stream.write(b, off, len)

    override fun write(b: Int) =
        stream.write(b)
}
