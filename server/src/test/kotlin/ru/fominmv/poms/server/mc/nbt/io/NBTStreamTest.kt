package ru.fominmv.poms.server.mc.nbt.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream

class NBTStreamTest {
    @Test
    fun `should read the same NBT that writes`() {
        val byteArrayOutputStream = ByteArrayOutputStream()
        val nbtOutputStream       = NBTOutputStream(byteArrayOutputStream)

        nbtOutputStream.writeNBT(BIG_TEST_NBT)

        val byteArrayInputStream = ByteArrayInputStream(byteArrayOutputStream.toByteArray())
        val nbtInputStream       = NBTInputStream(byteArrayInputStream)

        assertEquals(BIG_TEST_NBT, nbtInputStream.readNBT())
    }
}