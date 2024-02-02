package ru.fominmv.poms.server.mc.nbt.io

import ru.fominmv.poms.server.mc.nbt.tag.*
import ru.fominmv.poms.server.util.io.InputStreamWrapper

import java.io.DataInputStream
import java.io.InputStream

open class NBTInputStream(stream: InputStream)
    : InputStreamWrapper<DataInputStream>(DataInputStream(stream)), NBTInput {
    override fun readNBT(): NBT =
         when (val nbtId = stream.readByte()) {
            END_NBT_ID        -> readEndNBT()
            BYTE_NBT_ID       -> readByteNBT()
            SHORT_NBT_ID      -> readShortNBT()
            INT_NBT_ID        -> readIntNBT()
            LONG_NBT_ID       -> readLongNBT()
            FLOAT_NBT_ID      -> readFloatNBT()
            DOUBLE_NBT_ID     -> readDoubleNBT()
            BYTE_ARRAY_NBT_ID -> readByteArrayNBT()
            STRING_NBT_ID     -> readStringNBT()
            LIST_NBT_ID       -> readListNBT()
            COMPOUND_NBT_ID   -> readCompoundNBT()
            INT_ARRAY_NBT_ID  -> readIntArrayNBT()
            LONG_ARRAY_NBT_ID -> readLongArrayNBT()
            else              -> unknownNBTId(nbtId)
        }

    private fun readEndNBT(): EndNBT =
        EndNBT

    private fun readByteNBT(name: String = stream.readUTF()): ByteNBT =
        ByteNBT(name, stream.readByte())

    private fun readShortNBT(name: String = stream.readUTF()): ShortNBT =
        ShortNBT(name, stream.readShort())

    private fun readIntNBT(name: String = stream.readUTF()): IntNBT =
        IntNBT(name, stream.readInt())

    private fun readLongNBT(name: String = stream.readUTF()): LongNBT =
        LongNBT(name, stream.readLong())

    private fun readFloatNBT(name: String = stream.readUTF()): FloatNBT =
        FloatNBT(name, stream.readFloat())

    private fun readDoubleNBT(name: String = stream.readUTF()): DoubleNBT =
        DoubleNBT(name, stream.readDouble())

    private fun readByteArrayNBT(name: String = stream.readUTF()): ByteArrayNBT {
        val len    = stream.readInt()
        val values = List(len) { stream.readByte() }

        return ByteArrayNBT(name, values)
    }

    private fun readStringNBT(name: String = stream.readUTF()): StringNBT =
        StringNBT(name, stream.readUTF())

    private fun readListNBT(name: String = stream.readUTF()): ListNBT<*> {
        val readNamelessNBT: () -> NBT = when (val nbtId = stream.readByte()) {
            END_NBT_ID        -> this::readEndNBT
            BYTE_NBT_ID       -> { { readByteNBT("")      } }
            SHORT_NBT_ID      -> { { readShortNBT("")     } }
            INT_NBT_ID        -> { { readIntNBT("")       } }
            LONG_NBT_ID       -> { { readLongNBT("")      } }
            FLOAT_NBT_ID      -> { { readFloatNBT("")     } }
            DOUBLE_NBT_ID     -> { { readDoubleNBT("")    } }
            BYTE_ARRAY_NBT_ID -> { { readByteArrayNBT("") } }
            STRING_NBT_ID     -> { { readStringNBT("")    } }
            LIST_NBT_ID       -> { { readListNBT("")      } }
            COMPOUND_NBT_ID   -> { { readCompoundNBT("")  } }
            INT_ARRAY_NBT_ID  -> { { readIntArrayNBT("")  } }
            LONG_ARRAY_NBT_ID -> { { readLongArrayNBT("") } }
            else              -> unknownNBTId(nbtId)
        }

        val len    = stream.readInt()
        val values = buildList {
            repeat (len) {
                add(readNamelessNBT())
            }
        }

        return ListNBT(name, values)
    }

    private fun readCompoundNBT(name: String = stream.readUTF()): CompoundNBT =
        CompoundNBT(name, buildList {
            while (true) {
                val nbt = readNBT()

                if (nbt is EndNBT)
                    break

                add(nbt)
            }
        })

    private fun readIntArrayNBT(name: String = stream.readUTF()): IntArrayNBT {
        val len    = stream.readInt()
        val values = List(len) { stream.readInt() }

        return IntArrayNBT(name, values)
    }

    private fun readLongArrayNBT(name: String = stream.readUTF()): LongArrayNBT {
        val len    = stream.readInt()
        val values = List(len) { stream.readLong() }

        return LongArrayNBT(name, values)
    }

    private fun unknownNBTId(nbtId: Byte): Nothing =
        throw NBTFormatException("Unknown NBT ID: $nbtId")
}