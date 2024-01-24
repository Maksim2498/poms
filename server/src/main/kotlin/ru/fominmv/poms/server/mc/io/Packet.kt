package ru.fominmv.poms.server.mc.io

class Packet(
    val id:   Int,
    val data: ByteArray,
) {
    val size: Int
        get() = McDataOutput.evalVarIntSize(id) + data.size
}