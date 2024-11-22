package ru.fominmv.poms.libs.mc.nbt.io

import ru.fominmv.poms.libs.commons.io.InputStreamWrapper
import ru.fominmv.poms.libs.mc.nbt.tags.*

import java.io.DataInputStream

open class NbtInputStream<T : DataInputStream>(stream: T) :
    InputStreamWrapper<T>(stream),

    NbtInput
{
    override fun readNbt(): Nbt =
        when (val nbtId = stream.readByte().toInt()) {
            END_NBT_ID -> readEndNbt()

            BYTE_NBT_ID -> readByteNbt()
            SHORT_NBT_ID -> readShortNbt()
            INT_NBT_ID -> readIntNbt()
            LONG_NBT_ID -> readLongNbt()

            FLOAT_NBT_ID -> readFloatNbt()
            DOUBLE_NBT_ID -> readDoubleNbt()

            BYTE_ARRAY_NBT_ID -> readByteArrayNbt()
            INT_ARRAY_NBT_ID -> readIntArrayNbt()
            LONG_ARRAY_NBT_ID -> readLongArrayNbt()
            STRING_NBT_ID -> readStringNbt()

            COMPOUND_NBT_ID -> readCompoundNbt()
            LIST_NBT_ID -> readListNbt()

            else -> unknownNbtId(nbtId)
        }

    private fun readEndNbt(): EndNbt =
        EndNbt

    private fun readByteNbt(name: String = stream.readUTF()): ByteNbt =
        ByteNbt(name, stream.readByte())

    private fun readShortNbt(name: String = stream.readUTF()): ShortNbt =
        ShortNbt(name, stream.readShort())

    private fun readIntNbt(name: String = stream.readUTF()): IntNbt =
        IntNbt(name, stream.readInt())

    private fun readLongNbt(name: String = stream.readUTF()): LongNbt =
        LongNbt(name, stream.readLong())

    private fun readFloatNbt(name: String = stream.readUTF()): FloatNbt =
        FloatNbt(name, stream.readFloat())

    private fun readDoubleNbt(name: String = stream.readUTF()): DoubleNbt =
        DoubleNbt(name, stream.readDouble())

    private fun readByteArrayNbt(name: String = stream.readUTF()): ByteArrayNbt {
        val length = stream.readInt()
        val values = List(length) { stream.readByte() }

        return ByteArrayNbt(name, values)
    }

    private fun readIntArrayNbt(name: String = stream.readUTF()): IntArrayNbt {
        val length = stream.readInt()
        val values = List(length) { stream.readInt() }

        return IntArrayNbt(name, values)
    }

    private fun readLongArrayNbt(name: String = stream.readUTF()): LongArrayNbt {
        val length = stream.readInt()
        val values = List(length) { stream.readLong() }

        return LongArrayNbt(name, values)
    }

    private fun readStringNbt(name: String = stream.readUTF()): StringNbt =
        StringNbt(name, stream.readUTF())

    private fun readCompoundNbt(name: String = stream.readUTF()): CompoundNbt =
        CompoundNbt(name, buildList {
            while (true) {
                val nbt = readNbt()

                if (nbt is EndNbt)
                    break

                add(nbt)
            }
        })

    private fun readListNbt(name: String = stream.readUTF()): ListNbt<*> {
        val readNamelessNbt: () -> Nbt = when (val nbtId = stream.readByte().toInt()) {
            END_NBT_ID -> ::readEndNbt

            BYTE_NBT_ID -> ({ readByteNbt("") })
            SHORT_NBT_ID -> ({ readShortNbt("") })
            INT_NBT_ID -> ({ readIntNbt("") })

            LONG_NBT_ID -> ({ readLongNbt("") })

            FLOAT_NBT_ID -> ({ readFloatNbt("") })
            DOUBLE_NBT_ID -> ({ readDoubleNbt("") })

            BYTE_ARRAY_NBT_ID -> ({ readByteArrayNbt("") })
            INT_ARRAY_NBT_ID -> ({ readIntArrayNbt("") })
            LONG_ARRAY_NBT_ID -> ({ readLongArrayNbt("") })

            STRING_NBT_ID -> ({ readStringNbt("") })

            COMPOUND_NBT_ID -> ({ readCompoundNbt("") })
            LIST_NBT_ID -> ({ readListNbt("") })

            else -> unknownNbtId(nbtId)
        }

        val length = stream.readInt()
        val values = List(length) { readNamelessNbt() }

        return ListNbt(name, values)
    }

    private fun unknownNbtId(nbtId: Int): Nothing =
        throw NbtFormatException("Unknown Nbt ID: $nbtId")
}
