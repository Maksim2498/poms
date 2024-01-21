package ru.fominmv.poms.server.mc.protocol.nbt.io

import ru.fominmv.poms.server.mc.protocol.nbt.tag.Tag

interface TagInput {
    fun readTag(): Tag
}