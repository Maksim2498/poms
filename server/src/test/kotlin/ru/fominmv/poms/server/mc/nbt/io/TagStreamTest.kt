package ru.fominmv.poms.server.mc.nbt.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

class TagStreamTest {
    @Test
    fun `should read the same tag that writes`() {
        val byteArrayOutputStream = ByteArrayOutputStream()
        val tagOutputStream       = ru.fominmv.poms.server.mc.nbt.io.TagOutputStream(byteArrayOutputStream)

        tagOutputStream.writeTag(BIG_TEST_TAG)

        val byteArrayInputStream = ByteArrayInputStream(byteArrayOutputStream.toByteArray())
        val tagInputStream       = ru.fominmv.poms.server.mc.nbt.io.TagInputStream(byteArrayInputStream)

        assertEquals(BIG_TEST_TAG, tagInputStream.readTag())
    }
}