package ru.fominmv.poms.server.mc.nbt.io

import ru.fominmv.poms.server.mc.nbt.tag.Tag

interface TagInput {
    fun readTag(): Tag
}