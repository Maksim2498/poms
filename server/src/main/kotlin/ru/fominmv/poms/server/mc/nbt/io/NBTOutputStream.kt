package ru.fominmv.poms.server.mc.nbt.io

import ru.fominmv.poms.server.mc.nbt.tag.*
import ru.fominmv.poms.server.util.io.OutputStreamWrapper

import java.io.DataOutputStream
import java.io.OutputStream

open class NBTOutputStream(stream: OutputStream)
    : OutputStreamWrapper<DataOutputStream>(DataOutputStream(stream)), NBTOutput {
    override fun writeNBT(nbt: NBT) =
        when (nbt) {
            is EndNBT       -> writeNBT(nbt)
            is ByteNBT      -> writeNBT(nbt)
            is ShortNBT     -> writeNBT(nbt)
            is IntNBT       -> writeNBT(nbt)
            is LongNBT      -> writeNBT(nbt)
            is FloatNBT     -> writeNBT(nbt)
            is DoubleNBT    -> writeNBT(nbt)
            is ByteArrayNBT -> writeNBT(nbt)
            is StringNBT    -> writeNBT(nbt)
            is ListNBT<*>   -> writeNBT(nbt)
            is CompoundNBT  -> writeNBT(nbt)
            is IntArrayNBT  -> writeNBT(nbt)
            is LongArrayNBT -> writeNBT(nbt)
        }

    private fun writeNBT(nbt: EndNBT) =
        writeNBTPayload(nbt)

    @Suppress("UNUSED_PARAMETER")
    private fun writeNBTPayload(nbt: EndNBT) =
        stream.writeByte(0)

    private fun writeNBT(nbt: ByteNBT) {
        writeNBTHeader(1, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: ByteNBT) =
        stream.writeByte(nbt.value.toInt())

    private fun writeNBT(nbt: ShortNBT) {
        writeNBTHeader(2, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: ShortNBT) =
        stream.writeShort(nbt.value.toInt())

    private fun writeNBT(nbt: IntNBT) {
        writeNBTHeader(3, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: IntNBT) =
        stream.writeInt(nbt.value)

    private fun writeNBT(nbt: LongNBT) {
        writeNBTHeader(4, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: LongNBT) =
        stream.writeLong(nbt.value)

    private fun writeNBT(nbt: FloatNBT) {
        writeNBTHeader(5, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: FloatNBT) =
        stream.writeFloat(nbt.value)

    private fun writeNBT(nbt: DoubleNBT) {
        writeNBTHeader(6, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: DoubleNBT) =
        stream.writeDouble(nbt.value)

    private fun writeNBT(nbt: ByteArrayNBT) {
        writeNBTHeader(7, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: ByteArrayNBT) {
        stream.writeInt(nbt.values.size)
        nbt.values.forEach { stream.writeByte(it.toInt()) }
    }

    private fun writeNBT(nbt: StringNBT) {
        writeNBTHeader(8, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: StringNBT) =
        stream.writeUTF(nbt.value)

    private fun writeNBT(nbt: ListNBT<*>) {
        writeNBTHeader(9, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: ListNBT<*>) {
        val nbtIdAndWriteNBTPayload: Pair<Byte, (NBT) -> Unit> = when (nbt.valuesClass) {
            EndNBT::class.java       -> Pair(END_NBT_ID)        { writeNBTPayload(it as EndNBT)       }
            ByteNBT::class.java      -> Pair(BYTE_NBT_ID)       { writeNBTPayload(it as ByteNBT)      }
            ShortNBT::class.java     -> Pair(SHORT_NBT_ID)      { writeNBTPayload(it as ShortNBT)     }
            IntNBT::class.java       -> Pair(INT_NBT_ID)        { writeNBTPayload(it as IntNBT)       }
            LongNBT::class.java      -> Pair(LONG_NBT_ID)       { writeNBTPayload(it as LongNBT)      }
            FloatNBT::class.java     -> Pair(FLOAT_NBT_ID)      { writeNBTPayload(it as FloatNBT)     }
            DoubleNBT::class.java    -> Pair(DOUBLE_NBT_ID)     { writeNBTPayload(it as DoubleNBT)    }
            ByteArrayNBT::class.java -> Pair(BYTE_ARRAY_NBT_ID) { writeNBTPayload(it as ByteArrayNBT) }
            StringNBT::class.java    -> Pair(STRING_NBT_ID)     { writeNBTPayload(it as StringNBT)    }
            ListNBT::class.java      -> Pair(LIST_NBT_ID)       { writeNBTPayload(it as ListNBT<*>)   }
            CompoundNBT::class.java  -> Pair(COMPOUND_NBT_ID)   { writeNBTPayload(it as CompoundNBT)  }
            IntArrayNBT::class.java  -> Pair(INT_ARRAY_NBT_ID)  { writeNBTPayload(it as IntArrayNBT)  }
            LongArrayNBT::class.java -> Pair(LONG_ARRAY_NBT_ID) { writeNBTPayload(it as LongArrayNBT) }
            else                     -> throw IllegalArgumentException("Not a NBT class")
        }

        val (nbtId, writeNBTPayload) = nbtIdAndWriteNBTPayload

        with (stream) {
            writeByte(nbtId.toInt())
            writeInt(nbt.values.size)
            nbt.values.forEach(writeNBTPayload)
        }
    }

    private fun writeNBT(nbt: CompoundNBT) {
        writeNBTHeader(10, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: CompoundNBT) {
        nbt.values.forEach(this::writeNBT)
        writeNBT(EndNBT)
    }

    private fun writeNBT(nbt: IntArrayNBT) {
        writeNBTHeader(11, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: IntArrayNBT) {
        stream.writeInt(nbt.values.size)
        nbt.values.forEach { stream.writeInt(it) }
    }

    private fun writeNBT(nbt: LongArrayNBT) {
        writeNBTHeader(LONG_ARRAY_NBT_ID, nbt.name)
        writeNBTPayload(nbt)
    }

    private fun writeNBTPayload(nbt: LongArrayNBT) {
        stream.writeInt(nbt.values.size)
        nbt.values.forEach { stream.writeLong(it) }
    }

    private fun writeNBTHeader(id: Byte, name: String) =
        with (stream) {
            writeByte(id.toInt())
            writeUTF(name)
        }
}