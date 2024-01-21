package ru.fominmv.poms.server.mc.protocol.nbt.io.stream

import ru.fominmv.poms.server.mc.protocol.nbt.tag.Tag

import java.io.InputStream

abstract class TagInputStream : InputStream() {
    abstract fun readTag(): Tag
}