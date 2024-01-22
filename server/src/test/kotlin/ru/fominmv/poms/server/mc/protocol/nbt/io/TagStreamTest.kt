package ru.fominmv.poms.server.mc.protocol.nbt.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

class TagStreamTest {
    @Test
    fun `should read the same tag that writes`() {
        val byteArrayOutputStream = ByteArrayOutputStream()
        val tagOutputStream       = TagOutputStream(byteArrayOutputStream)

        tagOutputStream.writeTag(BIG_TEST_TAG)

        val byteArrayInputStream = ByteArrayInputStream(byteArrayOutputStream.toByteArray())
        val tagInputStream       = TagInputStream(byteArrayInputStream)

        assertEquals(BIG_TEST_TAG, tagInputStream.readTag())
    }
}