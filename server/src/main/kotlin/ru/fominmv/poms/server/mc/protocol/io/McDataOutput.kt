package ru.fominmv.poms.server.mc.protocol.io

import ru.fominmv.poms.server.mc.protocol.nbt.io.TagOutput
import ru.fominmv.poms.server.util.io.UDataOutput

import java.util.UUID

interface McDataOutput : UDataOutput, TagOutput {
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
        writeVarInt(value.length)
        write(value.encodeToByteArray())
    }

    fun writeUUID(value: UUID) {
        writeLong(value.mostSignificantBits)
        writeLong(value.leastSignificantBits)
    }
}