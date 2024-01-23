package ru.fominmv.poms.server.mc.io

import ru.fominmv.poms.server.mc.nbt.io.TagInput
import ru.fominmv.poms.server.util.io.UDataInput
import ru.fominmv.poms.server.util.io.UTF8InputStream

import java.io.InputStream
import java.util.UUID

interface McDataInput : UDataInput, ru.fominmv.poms.server.mc.nbt.io.TagInput {
    fun readVarInt(): Int {
        var value    = 0
        var position = 0

        while (true) {
            val byte = readByte().toInt()

            value = value or ((byte and VAR_INT_SEGMENT_BITS) shl position)

            if ((byte and VAR_INT_CONTINUE_BIT) == 0)
                break

            position += VAR_INT_SEGMENT_BIT_COUNT

            if (position >= Int.SIZE_BITS)
                throw RuntimeException("VarInt is too big")
        }

        return value
    }

    fun readVarLong(): Long {
        var value    = 0L
        var position = 0

        while (true) {
            val byte = readByte().toInt()

            value = value or ((byte and VAR_INT_SEGMENT_BITS).toLong() shl position)

            if ((byte and VAR_INT_CONTINUE_BIT) == 0)
                break

            position += VAR_INT_SEGMENT_BIT_COUNT

            if (position >= Long.SIZE_BITS)
                throw RuntimeException("VarLong is too big")
        }

        return value
    }

    fun readVarString(): String {
        val stream = UTF8InputStream(object : InputStream() { override fun read(): Int = readUByte().toInt() })
        val length = readVarInt()

        return buildString {
            repeat (length) {
                append(stream.readUTF8Char())
            }
        }
    }

    fun readUUID(): UUID =
        UUID(readLong(), readLong())
}