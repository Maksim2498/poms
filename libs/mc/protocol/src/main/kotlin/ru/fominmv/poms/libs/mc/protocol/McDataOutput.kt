package ru.fominmv.poms.libs.mc.protocol

import ru.fominmv.poms.libs.mc.nbt.io.NbtOutput

import java.io.*
import java.util.*

interface McDataOutput : NbtOutput, DataOutput {
    fun <T> writePacket(id: Int, createPacket: McDataOutput.() -> T): T {
        val byteArrayStream = ByteArrayOutputStream()
        val dataStream = DataOutputStream(byteArrayStream)
        val mcDataStream = McDataOutputStream(dataStream)
        val result = mcDataStream.createPacket()
        val data = byteArrayStream.toByteArray()

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
        val bytes = value.encodeToByteArray()

        writeVarInt(bytes.size)
        write(bytes)
    }

    fun writeUuid(value: UUID) {
        writeLong(value.mostSignificantBits)
        writeLong(value.leastSignificantBits)
    }
}
