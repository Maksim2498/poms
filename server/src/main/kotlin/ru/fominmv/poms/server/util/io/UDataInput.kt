package ru.fominmv.poms.server.util.io

import java.io.DataInput

interface UDataInput : DataInput {
    fun readUByte(): UByte =
        readByte().toUByte()

    fun readUShort(): UShort =
        readShort().toUShort()

    fun readUInt(): UInt =
        readInt().toUInt()

    fun readULong(): ULong =
        readLong().toULong()
}