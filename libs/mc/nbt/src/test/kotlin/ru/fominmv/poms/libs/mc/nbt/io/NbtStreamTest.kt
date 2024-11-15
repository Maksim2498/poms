package ru.fominmv.poms.libs.mc.nbt.io

import java.io.*

import kotlin.test.assertEquals
import kotlin.test.Test

class NbtStreamTest {
    @Test
    fun `should read the same NBT that writes`() {
        val byteArrayOutputStream = ByteArrayOutputStream()
        val dataOutputStream = DataOutputStream(byteArrayOutputStream)
        val nbtOutputStream = NbtOutputStream(dataOutputStream)

        nbtOutputStream.writeNbt(BIG_TEST_NBT)

        val byteArrayInputStream = ByteArrayInputStream(byteArrayOutputStream.toByteArray())
        val dataInputStream = DataInputStream(byteArrayInputStream)
        val nbtInputStream = NbtInputStream(dataInputStream)

        val nbt = nbtInputStream.readNbt()

        println("Read NBT: $nbt")

        assertEquals(BIG_TEST_NBT, nbt)
    }
}
