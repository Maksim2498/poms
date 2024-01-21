package ru.fominmv.poms.server.mc.protocol.nbt.io.stream

import ru.fominmv.poms.server.mc.protocol.nbt.tag.*
import ru.fominmv.poms.server.util.io.stream.OutputStreamWrapper

import java.io.DataOutputStream
import java.io.OutputStream

class TagOutputStream(stream: OutputStream)
    : OutputStreamWrapper<DataOutputStream>(DataOutputStream(stream)) {
    fun writeTag(tag: Tag) =
        when (tag) {
            is EndTag       -> writeTag(tag)
            is ByteTag      -> writeTag(tag)
            is ShortTag     -> writeTag(tag)
            is IntTag       -> writeTag(tag)
            is LongTag      -> writeTag(tag)
            is FloatTag     -> writeTag(tag)
            is DoubleTag    -> writeTag(tag)
            is ByteArrayTag -> writeTag(tag)
            is StringTag    -> writeTag(tag)
            is ListTag<*>   -> writeTag(tag)
            is CompoundTag  -> writeTag(tag)
            is IntArrayTag  -> writeTag(tag)
            is LongArrayTag -> writeTag(tag)
        }

    private fun writeTag(tag: EndTag) =
        writeTagPayload(tag)

    @Suppress("UNUSED_PARAMETER")
    private fun writeTagPayload(tag: EndTag) =
        stream.writeByte(0)

    private fun writeTag(tag: ByteTag) {
        writeTagHeader(1, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: ByteTag) =
        stream.writeByte(tag.value.toInt())

    private fun writeTag(tag: ShortTag) {
        writeTagHeader(2, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: ShortTag) =
        stream.writeShort(tag.value.toInt())

    private fun writeTag(tag: IntTag) {
        writeTagHeader(3, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: IntTag) =
        stream.writeInt(tag.value)

    private fun writeTag(tag: LongTag) {
        writeTagHeader(4, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: LongTag) =
        stream.writeLong(tag.value)

    private fun writeTag(tag: FloatTag) {
        writeTagHeader(5, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: FloatTag) =
        stream.writeFloat(tag.value)

    private fun writeTag(tag: DoubleTag) {
        writeTagHeader(6, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: DoubleTag) =
        stream.writeDouble(tag.value)

    private fun writeTag(tag: ByteArrayTag) {
        writeTagHeader(7, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: ByteArrayTag) {
        stream.writeInt(tag.values.size)
        tag.values.forEach { stream.writeByte(it.toInt()) }
    }

    private fun writeTag(tag: StringTag) {
        writeTagHeader(8, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: StringTag) =
        stream.writeUTF(tag.value)

    private fun writeTag(tag: ListTag<*>) {
        writeTagHeader(9, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: ListTag<*>) {
        val tagIdAndWriteTagPayload: Pair<Byte, (Tag) -> Unit> = when (tag.valuesClass) {
            EndTag::class.java       -> Pair(END_TAG_ID)        { writeTagPayload(it as EndTag)       }
            ByteTag::class.java      -> Pair(BYTE_TAG_ID)       { writeTagPayload(it as ByteTag)      }
            ShortTag::class.java     -> Pair(SHORT_TAG_ID)      { writeTagPayload(it as ShortTag)     }
            IntTag::class.java       -> Pair(INT_TAG_ID)        { writeTagPayload(it as IntTag)       }
            LongTag::class.java      -> Pair(LONG_TAG_ID)       { writeTagPayload(it as LongTag)      }
            FloatTag::class.java     -> Pair(FLOAT_TAG_ID)      { writeTagPayload(it as FloatTag)     }
            DoubleTag::class.java    -> Pair(DOUBLE_TAG_ID)     { writeTagPayload(it as DoubleTag)    }
            ByteArrayTag::class.java -> Pair(BYTE_ARRAY_TAG_ID) { writeTagPayload(it as ByteArrayTag) }
            StringTag::class.java    -> Pair(STRING_TAG_ID)     { writeTagPayload(it as StringTag)    }
            ListTag::class.java      -> Pair(LIST_TAG_ID)       { writeTagPayload(it as ListTag<*>)   }
            CompoundTag::class.java  -> Pair(COMPOUND_TAG_ID)   { writeTagPayload(it as CompoundTag)  }
            IntArrayTag::class.java  -> Pair(INT_ARRAY_TAG_ID)  { writeTagPayload(it as IntArrayTag)  }
            LongArrayTag::class.java -> Pair(LONG_ARRAY_TAG_ID) { writeTagPayload(it as LongArrayTag) }
            else                     -> throw IllegalArgumentException("Not a tag class")
        }

        val (tagId, writeTagPayload) = tagIdAndWriteTagPayload

        with (stream) {
            writeByte(tagId.toInt())
            writeInt(tag.values.size)
            tag.values.forEach(writeTagPayload)
        }
    }

    private fun writeTag(tag: CompoundTag) {
        writeTagHeader(10, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: CompoundTag) {
        tag.values.forEach(this::writeTag)
        writeTag(EndTag)
    }

    private fun writeTag(tag: IntArrayTag) {
        writeTagHeader(11, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: IntArrayTag) {
        stream.writeInt(tag.values.size)
        tag.values.forEach { stream.writeInt(it) }
    }

    private fun writeTag(tag: LongArrayTag) {
        writeTagHeader(LONG_ARRAY_TAG_ID, tag.name)
        writeTagPayload(tag)
    }

    private fun writeTagPayload(tag: LongArrayTag) {
        stream.writeInt(tag.values.size)
        tag.values.forEach { stream.writeLong(it) }
    }

    private fun writeTagHeader(id: Byte, name: String) =
        with (stream) {
            writeByte(id.toInt())
            writeUTF(name)
        }
}