package ru.fominmv.poms.server.mc.protocol.nbt.io.stream

import ru.fominmv.poms.server.mc.protocol.nbt.tag.*

import java.io.DataInputStream
import java.io.InputStream

class TagInputStream(stream: InputStream) : InputStream() {
    private val stream = DataInputStream(stream)

    fun readTag(): Tag =
         when (val tagId = stream.readByte()) {
            END_TAG_ID        -> readEndTag()
            BYTE_TAG_ID       -> readByteTag()
            SHORT_TAG_ID      -> readShortTag()
            INT_TAG_ID        -> readIntTag()
            LONG_TAG_ID       -> readLongTag()
            FLOAT_TAG_ID      -> readFloatTag()
            DOUBLE_TAG_ID     -> readDoubleTag()
            BYTE_ARRAY_TAG_ID -> readByteArrayTag()
            STRING_TAG_ID     -> readStringTag()
            LIST_TAG_ID       -> readListTag()
            COMPOUND_TAG_ID   -> readCompoundTag()
            INT_ARRAY_TAG_ID  -> readIntArrayTag()
            LONG_ARRAY_TAG_ID -> readLongArrayTag()
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
            END_TAG_ID        -> this::readEndTag
            BYTE_TAG_ID       -> { { readByteTag("")      } }
            SHORT_TAG_ID      -> { { readShortTag("")     } }
            INT_TAG_ID        -> { { readIntTag("")       } }
            LONG_TAG_ID       -> { { readLongTag("")      } }
            FLOAT_TAG_ID      -> { { readFloatTag("")     } }
            DOUBLE_TAG_ID     -> { { readDoubleTag("")    } }
            BYTE_ARRAY_TAG_ID -> { { readByteArrayTag("") } }
            STRING_TAG_ID     -> { { readStringTag("")    } }
            LIST_TAG_ID       -> { { readListTag("")      } }
            COMPOUND_TAG_ID   -> { { readCompoundTag("")  } }
            INT_ARRAY_TAG_ID  -> { { readIntArrayTag("")  } }
            LONG_ARRAY_TAG_ID -> { { readLongArrayTag("") } }
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
        throw TagFormatException("Unknown tag id: $tagId")

    override fun available(): Int =
        stream.available()

    override fun close() =
        stream.close()

    override fun mark(readlimit: Int) =
        stream.mark(readlimit)

    override fun markSupported(): Boolean =
        stream.markSupported()

    override fun read(): Int =
        stream.read()

    override fun read(b: ByteArray): Int =
        stream.read(b)

    override fun read(b: ByteArray, off: Int, len: Int): Int =
        stream.read(b, off, len)

    override fun reset() =
        stream.reset()

    override fun skip(n: Long): Long =
        stream.skip(n)
}