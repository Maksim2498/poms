package ru.fominmv.poms.server.mc.nbt.io

import ru.fominmv.poms.server.mc.protocol.nbt.tag.*
import ru.fominmv.poms.server.util.io.InputStreamWrapper

import java.io.DataInputStream
import java.io.InputStream

open class TagInputStream(stream: InputStream)
    : InputStreamWrapper<DataInputStream>(DataInputStream(stream)), ru.fominmv.poms.server.mc.nbt.io.TagInput {
    override fun readTag(): Tag =
         when (val tagId = stream.readByte()) {
            ru.fominmv.poms.server.mc.nbt.io.END_TAG_ID -> readEndTag()
            ru.fominmv.poms.server.mc.nbt.io.BYTE_TAG_ID -> readByteTag()
            ru.fominmv.poms.server.mc.nbt.io.SHORT_TAG_ID -> readShortTag()
            ru.fominmv.poms.server.mc.nbt.io.INT_TAG_ID -> readIntTag()
            ru.fominmv.poms.server.mc.nbt.io.LONG_TAG_ID -> readLongTag()
            ru.fominmv.poms.server.mc.nbt.io.FLOAT_TAG_ID -> readFloatTag()
            ru.fominmv.poms.server.mc.nbt.io.DOUBLE_TAG_ID -> readDoubleTag()
            ru.fominmv.poms.server.mc.nbt.io.BYTE_ARRAY_TAG_ID -> readByteArrayTag()
            ru.fominmv.poms.server.mc.nbt.io.STRING_TAG_ID -> readStringTag()
            ru.fominmv.poms.server.mc.nbt.io.LIST_TAG_ID -> readListTag()
            ru.fominmv.poms.server.mc.nbt.io.COMPOUND_TAG_ID -> readCompoundTag()
            ru.fominmv.poms.server.mc.nbt.io.INT_ARRAY_TAG_ID -> readIntArrayTag()
            ru.fominmv.poms.server.mc.nbt.io.LONG_ARRAY_TAG_ID -> readLongArrayTag()
            else              -> unknownTagId(tagId)
        }

    private fun readEndTag(): EndTag =
        EndTag

    private fun readByteTag(name: String = stream.readUTF()): ByteTag =
        ByteTag(name, stream.readByte())

    private fun readShortTag(name: String = stream.readUTF()): ShortTag =
        ShortTag(name, stream.readShort())

    private fun readIntTag(name: String = stream.readUTF()): IntTag =
        IntTag(name, stream.readInt())

    private fun readLongTag(name: String = stream.readUTF()): LongTag =
        LongTag(name, stream.readLong())

    private fun readFloatTag(name: String = stream.readUTF()): FloatTag =
        FloatTag(name, stream.readFloat())

    private fun readDoubleTag(name: String = stream.readUTF()): DoubleTag =
        DoubleTag(name, stream.readDouble())

    private fun readByteArrayTag(name: String = stream.readUTF()): ByteArrayTag {
        val len    = stream.readInt()
        val values = List(len) { stream.readByte() }

        return ByteArrayTag(name, values)
    }

    private fun readStringTag(name: String = stream.readUTF()): StringTag =
        StringTag(name, stream.readUTF())

    private fun readListTag(name: String = stream.readUTF()): ListTag<*> {
        val readNamelessTag: () -> Tag = when (val tagId = stream.readByte()) {
            ru.fominmv.poms.server.mc.nbt.io.END_TAG_ID -> this::readEndTag
            ru.fominmv.poms.server.mc.nbt.io.BYTE_TAG_ID -> { { readByteTag("")      } }
            ru.fominmv.poms.server.mc.nbt.io.SHORT_TAG_ID -> { { readShortTag("")     } }
            ru.fominmv.poms.server.mc.nbt.io.INT_TAG_ID -> { { readIntTag("")       } }
            ru.fominmv.poms.server.mc.nbt.io.LONG_TAG_ID -> { { readLongTag("")      } }
            ru.fominmv.poms.server.mc.nbt.io.FLOAT_TAG_ID -> { { readFloatTag("")     } }
            ru.fominmv.poms.server.mc.nbt.io.DOUBLE_TAG_ID -> { { readDoubleTag("")    } }
            ru.fominmv.poms.server.mc.nbt.io.BYTE_ARRAY_TAG_ID -> { { readByteArrayTag("") } }
            ru.fominmv.poms.server.mc.nbt.io.STRING_TAG_ID -> { { readStringTag("")    } }
            ru.fominmv.poms.server.mc.nbt.io.LIST_TAG_ID -> { { readListTag("")      } }
            ru.fominmv.poms.server.mc.nbt.io.COMPOUND_TAG_ID -> { { readCompoundTag("")  } }
            ru.fominmv.poms.server.mc.nbt.io.INT_ARRAY_TAG_ID -> { { readIntArrayTag("")  } }
            ru.fominmv.poms.server.mc.nbt.io.LONG_ARRAY_TAG_ID -> { { readLongArrayTag("") } }
            else              -> unknownTagId(tagId)
        }

        val len    = stream.readInt()
        val values = buildList {
            repeat (len) {
                add(readNamelessTag())
            }
        }

        return ListTag(name, values)
    }

    private fun readCompoundTag(name: String = stream.readUTF()): CompoundTag =
        CompoundTag(name, buildList {
            while (true) {
                val tag = readTag()

                if (tag is EndTag)
                    break

                add(tag)
            }
        })

    private fun readIntArrayTag(name: String = stream.readUTF()): IntArrayTag {
        val len    = stream.readInt()
        val values = List(len) { stream.readInt() }

        return IntArrayTag(name, values)
    }

    private fun readLongArrayTag(name: String = stream.readUTF()): LongArrayTag {
        val len    = stream.readInt()
        val values = List(len) { stream.readLong() }

        return LongArrayTag(name, values)
    }

    private fun unknownTagId(tagId: Byte): Nothing =
        throw ru.fominmv.poms.server.mc.nbt.io.TagFormatException("Unknown tag id: $tagId")
}