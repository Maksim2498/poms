package ru.fominmv.poms.server.mc.nbt.io

import ru.fominmv.poms.server.mc.nbt.tag.NBT

interface NBTOutput {
    fun writeNBT(nbt: NBT)
}