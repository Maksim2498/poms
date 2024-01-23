package ru.fominmv.poms.server.mc.nbt.io

import ru.fominmv.poms.server.mc.protocol.nbt.tag.Tag

interface TagOutput {
    fun writeTag(tag: Tag)
}