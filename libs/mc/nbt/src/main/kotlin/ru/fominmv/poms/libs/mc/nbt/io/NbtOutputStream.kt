package ru.fominmv.poms.libs.mc.nbt.io

import ru.fominmv.poms.libs.commons.io.OutputStreamWrapper
import ru.fominmv.poms.libs.mc.nbt.tags.*

import java.io.DataOutputStream

open class NbtOutputStream<T : DataOutputStream>(stream: T) :
    OutputStreamWrapper<T>(stream),

    NbtOutput
{
    override fun writeNbt(nbt: Nbt) =
        when (nbt) {
            is EndNbt -> writeNbt(nbt)

            is ByteNbt -> writeNbt(nbt)
            is ShortNbt -> writeNbt(nbt)
            is IntNbt -> writeNbt(nbt)
            is LongNbt -> writeNbt(nbt)

            is FloatNbt -> writeNbt(nbt)
            is DoubleNbt -> writeNbt(nbt)

            is ByteArrayNbt -> writeNbt(nbt)
            is IntArrayNbt -> writeNbt(nbt)
            is LongArrayNbt -> writeNbt(nbt)

            is StringNbt -> writeNbt(nbt)

            is CompoundNbt -> writeNbt(nbt)
            is ListNbt<*> -> writeNbt(nbt)
        }

    // End

    private fun writeNbt(nbt: EndNbt) =
        writeNbtPayload(nbt)

    @Suppress("UNUSED_PARAMETER")
    private fun writeNbtPayload(nbt: EndNbt) =
        stream.writeByte(END_NBT_ID)

    // Byte

    private fun writeNbt(nbt: ByteNbt) {
        writeNbtHeader(BYTE_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: ByteNbt) =
        stream.writeByte(nbt.value.toInt())

    // Short

    private fun writeNbt(nbt: ShortNbt) {
        writeNbtHeader(SHORT_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: ShortNbt) =
        stream.writeShort(nbt.value.toInt())

    // Int

    private fun writeNbt(nbt: IntNbt) {
        writeNbtHeader(INT_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: IntNbt) =
        stream.writeInt(nbt.value)

    // Long

    private fun writeNbt(nbt: LongNbt) {
        writeNbtHeader(LONG_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: LongNbt) =
        stream.writeLong(nbt.value)

    // Float

    private fun writeNbt(nbt: FloatNbt) {
        writeNbtHeader(FLOAT_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: FloatNbt) =
        stream.writeFloat(nbt.value)

    // Double

    private fun writeNbt(nbt: DoubleNbt) {
        writeNbtHeader(DOUBLE_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: DoubleNbt) =
        stream.writeDouble(nbt.value)

    // Byte array

    private fun writeNbt(nbt: ByteArrayNbt) {
        writeNbtHeader(BYTE_ARRAY_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: ByteArrayNbt) {
        stream.writeInt(nbt.values.size)
        nbt.values.forEach { stream.writeByte(it.toInt()) }
    }

    // Int array

    private fun writeNbt(nbt: IntArrayNbt) {
        writeNbtHeader(INT_ARRAY_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: IntArrayNbt) {
        stream.writeInt(nbt.values.size)
        nbt.values.forEach { stream.writeInt(it) }
    }

    // Long array

    private fun writeNbt(nbt: LongArrayNbt) {
        writeNbtHeader(LONG_ARRAY_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: LongArrayNbt) {
        stream.writeInt(nbt.values.size)
        nbt.values.forEach { stream.writeLong(it) }
    }

    // String

    private fun writeNbt(nbt: StringNbt) {
        writeNbtHeader(STRING_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: StringNbt) =
        stream.writeUTF(nbt.value)

    // Compound

    private fun writeNbt(nbt: CompoundNbt) {
        writeNbtHeader(COMPOUND_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: CompoundNbt) {
        nbt.values.forEach(this::writeNbt)
        writeNbt(EndNbt)
    }

    // List

    private fun writeNbt(nbt: ListNbt<*>) {
        writeNbtHeader(LIST_NBT_ID, nbt.name)
        writeNbtPayload(nbt)
    }

    private fun writeNbtPayload(nbt: ListNbt<*>) {
        val nbtIdAndWriteNbtPayload: Pair<Int, (Nbt) -> Unit> = when (nbt.valuesClass) {
            EndNbt::class.java -> END_NBT_ID to { writeNbtPayload(it as EndNbt) }

            ByteNbt::class.java -> BYTE_NBT_ID to { writeNbtPayload(it as ByteNbt) }
            ShortNbt::class.java -> SHORT_NBT_ID to { writeNbtPayload(it as ShortNbt) }
            IntNbt::class.java -> INT_NBT_ID to { writeNbtPayload(it as IntNbt) }
            LongNbt::class.java -> LONG_NBT_ID to { writeNbtPayload(it as LongNbt) }

            FloatNbt::class.java -> FLOAT_NBT_ID to { writeNbtPayload(it as FloatNbt) }
            DoubleNbt::class.java -> DOUBLE_NBT_ID to { writeNbtPayload(it as DoubleNbt) }

            ByteArrayNbt::class.java -> BYTE_ARRAY_NBT_ID to { writeNbtPayload(it as ByteArrayNbt) }
            IntArrayNbt::class.java -> INT_ARRAY_NBT_ID to { writeNbtPayload(it as IntArrayNbt) }
            LongArrayNbt::class.java -> LONG_ARRAY_NBT_ID to { writeNbtPayload(it as LongArrayNbt) }

            StringNbt::class.java -> STRING_NBT_ID to { writeNbtPayload(it as StringNbt) }

            CompoundNbt::class.java -> COMPOUND_NBT_ID to { writeNbtPayload(it as CompoundNbt) }
            ListNbt::class.java -> LIST_NBT_ID to { writeNbtPayload(it as ListNbt<*>) }

            else -> throw IllegalArgumentException("Not a ${Nbt::class.java.simpleName} subclass")
        }

        val (nbtId, writeNbtPayload) = nbtIdAndWriteNbtPayload

        with (stream) {
            writeByte(nbtId)
            writeInt(nbt.values.size)
            nbt.values.forEach(writeNbtPayload)
        }
    }

    private fun writeNbtHeader(id: Int, name: String) =
        with (stream) {
            writeByte(id)
            writeUTF(name)
        }
}
