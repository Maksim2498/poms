package ru.fominmv.poms.libs.mc.protocol

import java.io.DataInputStream

class Packet(
    val id: Int,
    val data: ByteArray,
) {
    val size: Int
        get() = id.size + data.size

    fun toStream(): McDataInputStream<*> =
        McDataInputStream(DataInputStream(data.inputStream()))
}
