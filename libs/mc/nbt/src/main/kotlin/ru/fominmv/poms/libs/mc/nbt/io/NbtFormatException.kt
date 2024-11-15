package ru.fominmv.poms.libs.mc.nbt.io

class NbtFormatException(
    message: String = "Bad NBT format",
    cause: Throwable? = null,
) : RuntimeException(message, cause)
