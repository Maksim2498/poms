package ru.fominmv.poms.server.mc.protocol.nbt.io

import ru.fominmv.poms.server.mc.protocol.nbt.tag.*

val HELLO_WORLD_TAG = CompoundTag(
    "hello world",
    listOf(
        StringTag("name", "Bananrama"),
    ),
)