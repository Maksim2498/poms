package ru.fominmv.poms.server.mc.io

import java.io.ByteArrayInputStream

class Packet(
    val id:   Int,
    val data: ByteArray,
) {
    val size: Int
        get() = McDataOutput.evalVarIntSize(id) + data.size

    fun toDataStream(): McDataInputStream =
        McDataInputStream(ByteArrayInputStream(data))
}