package ru.fominmv.poms.libs.mc.protocol

class PacketFormatException(
    message: String = "Bad packet",
    cause: Throwable? = null,
) : RuntimeException(message, cause)
