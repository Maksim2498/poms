package ru.fominmv.poms.libs.mc.nbt.io

import org.junit.jupiter.api.Assertions.assertArrayEquals

import ru.fominmv.poms.libs.commons.io.readResourceAsByteArray

import java.io.ByteArrayOutputStream
import java.io.DataOutputStream

import kotlin.test.Test

class NbtOutputStreamTest {
    companion object {
        var helloWorldBytes: ByteArray =
            readResourceAsByteArray(
                "/hello_world.nbt",
                NbtOutputStreamTest::class.java,
            )
    }

    @Test
    fun writeNbt() {
        val byteArrayStream = ByteArrayOutputStream(helloWorldBytes.size)
        val dataStream = DataOutputStream(byteArrayStream)
        val nbtStream = NbtOutputStream(dataStream)

        nbtStream.writeNbt(HELLO_WORLD_NBT)

        val writtenBytes = byteArrayStream.toByteArray()

        assertArrayEquals(helloWorldBytes, writtenBytes)
    }
}
