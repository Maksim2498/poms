package ru.fominmv.poms.server.mc.nbt.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import ru.fominmv.poms.server.util.io.readResourceAsByteArray

import java.io.ByteArrayOutputStream

class NBTOutputStreamTest {
    companion object {
        var helloWorldBytes: ByteArray =
            readResourceAsByteArray(
                "/mc/nbt/io/hello_world.nbt",
                NBTOutputStreamTest::class.java,
            )
    }

    @Test
    fun writeNBT() {
        val byteArrayStream = ByteArrayOutputStream(helloWorldBytes.size)
        val nbtStream       = NBTOutputStream(byteArrayStream)

        nbtStream.writeNBT(HELLO_WORLD_NBT)

        val wroteBytes = byteArrayStream.toByteArray()

        assertArrayEquals(helloWorldBytes, wroteBytes)
    }
}