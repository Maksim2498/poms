package ru.fominmv.poms.server.util.io

import java.io.DataOutput

interface UDataOutput : DataOutput {
    fun writeUByte(value: UInt) =
        writeByte(value.toInt())

    fun writeUShort(value: UInt) =
        writeShort(value.toInt())

    fun writeUInt(value: UInt) =
        writeInt(value.toInt())

    fun writeULong(value: ULong) =
        writeLong(value.toLong())
}