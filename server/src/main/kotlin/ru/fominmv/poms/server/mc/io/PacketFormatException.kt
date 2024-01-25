package ru.fominmv.poms.server.mc.io

class PacketFormatException(
    message: String = "Packet is malformed",
) : RuntimeException(message)