package ru.fominmv.poms.libs.mc.nbt.io

import ru.fominmv.poms.libs.mc.nbt.tags.Nbt

interface NbtInput {
    fun readNbt(): Nbt
}
