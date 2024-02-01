package ru.fominmv.poms.server.mc.io

import ru.fominmv.poms.server.mc.nbt.io.TagOutput
import ru.fominmv.poms.server.util.io.UDataOutput
import ru.fominmv.poms.server.util.text.stringext.utf8Length

import java.io.ByteArrayOutputStream
import java.util.UUID

interface McDataOutput : UDataOutput, TagOutput {
    companion object {
        fun evalVarIntSize(value: Int): Int {
            if (value < 0)
                return 5

            // Number of bytes required to encode an int
            // increases by one for every 7 used bits

            if (value < 0b1__000_0000)
                return 1

            if (value < 0b1__000_0000__000_0000)
                return 2

            if (value < 0b1__000_0000__000_0000__000_0000)
                return 3

            if (value < 0b1__000_0000__000_0000__000_0000__000_0000)
                return 4

            return 5
        }

        fun evalVarLongSize(value: Long): Int {
            if (value < 0)
                return 10

            // Number of bytes required to encode a long
            // increases by one for every 7 used bits

            if (value < 0b1__000_0000)
                return 1

            if (value < 0b1__000_0000__000_0000)
                return 2

            if (value < 0b1__000_0000__000_0000__000_0000)
                return 3

            if (value < 0b1__000_0000__000_0000__000_0000__000_0000)
                return 4

            if (value < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000)
                return 5

            if (value < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000)
                return 6

            if (value < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000)
                return 7

            if (value < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000)
                return 8

            if (value.toULong() < 0b1__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000__000_0000u)
                return 9

            return 10
        }

        fun evalVarStringSize(value: String): Int =
            evalVarIntSize(value.length) + value.utf8Length
    }

    fun <T> writePacket(id: Int, createPacket: McDataOutput.() -> T): T {
        val byteArrayStream = ByteArrayOutputStream()
        val mcDataStream    = McDataOutputStream(byteArrayStream)
        val result          = mcDataStream.createPacket()
        val data            = byteArrayStream.toByteArray()

        writePacket(id, data)

        return result
    }

    fun writePacket(id: Int, data: ByteArray = byteArrayOf()) =
        writePacket(Packet(id, data))

    fun writePacket(packet: Packet) =
        with (packet) {
            writeVarInt(size)
            writeVarInt(id)
            write(data)
        }

    fun writeVarUInt(value: UInt) =
        writeVarInt(value.toInt())

    fun writeVarInt(value: Int) {
        var curValue = value

        while (true) {
            if ((curValue and VAR_INT_SEGMENT_BITS.inv()) == 0) {
                writeByte(curValue)
                return
            }

            writeByte((curValue and VAR_INT_SEGMENT_BITS) or VAR_INT_CONTINUE_BIT)

            curValue = curValue ushr VAR_INT_SEGMENT_BIT_COUNT
        }
    }

    fun writeVarULong(value: ULong) =
        writeVarLong(value.toLong())

    fun writeVarLong(value: Long) {
        var curValue = value

        while (true) {
            if ((curValue and VAR_INT_SEGMENT_BITS.toLong().inv()) == 0L) {
                writeByte(curValue.toInt())
                return
            }

            writeByte((curValue.toInt() and VAR_INT_SEGMENT_BITS) or VAR_INT_CONTINUE_BIT)

            curValue = curValue ushr VAR_INT_SEGMENT_BIT_COUNT
        }
    }

    fun writeVarString(value: String) {
        writeVarInt(value.length)
        write(value.encodeToByteArray())
    }

    fun writeUUID(value: UUID) {
        writeLong(value.mostSignificantBits)
        writeLong(value.leastSignificantBits)
    }
}