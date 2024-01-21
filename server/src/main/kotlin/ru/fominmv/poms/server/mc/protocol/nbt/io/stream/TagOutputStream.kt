package ru.fominmv.poms.server.mc.protocol.nbt.io.stream

import ru.fominmv.poms.server.mc.protocol.nbt.tag.Tag

import java.io.OutputStream

abstract class TagOutputStream : OutputStream() {
    abstract fun writeTag(tag: Tag)
}