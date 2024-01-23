package ru.fominmv.poms.server.mc.nbt.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import ru.fominmv.poms.server.util.io.readResourceAsByteArray

import java.io.ByteArrayOutputStream

class TagOutputStreamTest {
    companion object {
        var helloWorldBytes: ByteArray =
            readResourceAsByteArray(
                "/mc/protocol/nbt/io/hello_world.nbt",
                TagOutputStreamTest::class.java,
            )
    }

    @Test
    fun writeTag() {
        val byteArrayStream = ByteArrayOutputStream(helloWorldBytes.size)
        val tagStream       = ru.fominmv.poms.server.mc.nbt.io.TagOutputStream(byteArrayStream)

        tagStream.writeTag(HELLO_WORLD_TAG)

        val wroteBytes = byteArrayStream.toByteArray()

        assertArrayEquals(helloWorldBytes, wroteBytes)
    }
}