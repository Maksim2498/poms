package ru.fominmv.poms.libs.mc.protocol

import ru.fominmv.poms.libs.mc.nbt.io.NbtInput

import java.io.DataInput
import java.util.*

interface McDataInput : NbtInput, DataInput {
    fun <T> readPacket(read: McDataInput.(id: Int) -> T): T {
        val packet = readPacket()
        val stream = packet.toStream()

        return stream.read(packet.id)
    }

    fun readPacket(): Packet {
        val size = readVarInt()
        val id = readVarInt()
        val dataSize = size - id.size
        val data = ByteArray(dataSize)

        readFully(data)

        return Packet(id, data)
    }

    fun readVarInt(): Int {
        var value = 0
        var position = 0

        while (true) {
            val byte = readByte().toInt()

            value = value or ((byte and VAR_INT_SEGMENT_BITS) shl position)

            if ((byte and VAR_INT_CONTINUE_BIT) == 0)
                break

            position += VAR_INT_SEGMENT_BIT_COUNT

            if (position >= Int.SIZE_BITS)
                throw PacketFormatException("Too long int")
        }

        return value
    }

    fun readVarLong(): Long {
        var value = 0L
        var position = 0

        while (true) {
            val byte = readByte().toInt()

            value = value or ((byte and VAR_INT_SEGMENT_BITS).toLong() shl position)

            if ((byte and VAR_INT_CONTINUE_BIT) == 0)
                break

            position += VAR_INT_SEGMENT_BIT_COUNT

            if (position >= Long.SIZE_BITS)
                throw RuntimeException("Too long long")
        }

        return value
    }

    fun readVarString(): String {
        val size = readVarInt()
        val bytes = ByteArray(size)

        readFully(bytes)

        return String(bytes)
    }

    fun readUuid(): UUID =
        UUID(readLong(), readLong())
}
