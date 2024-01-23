package ru.fominmv.poms.server.mc.protocol.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.util.UUID

class McDataStreamTest {
    @Test
    fun `should read the same that writes`() {
        val testInts = listOf(
             Int.MIN_VALUE,
            -824_982_498,
            -24_982_498,
            -2_498,
            -256,
            -129,
            -128,
            -127,
            -4,
            -3,
            -2,
            -1,
             0,
             1,
             2,
             3,
             4,
             127,
             128,
             129,
             256,
             2_498,
             24_982_498,
             824_982_498,
             Int.MAX_VALUE,
        )

        val testLongs = listOf(
             Long.MIN_VALUE,
            -2_498_249_824_982_498,
            -249_824_982_498,
            -824_982_498,
            -24_982_498,
            -2_498,
            -256,
            -129,
            -128,
            -127,
            -4,
            -3,
            -2,
            -1,
             0,
             1,
             2,
             3,
             4,
             127,
             128,
             129,
             256,
             2_498,
             24_982_498,
             824_982_498,
             249_824_982_498,
             2_498_249_824_982_498,
             Long.MAX_VALUE,
        )

        val testStrings = listOf(
            "Hello, World!",
            "こんにちは、世界!",
            "Привет, Мир!",
            "😂😎🥸🤓", // Number of chars != number of code points (important to test)
        )

        val testUUIDs = listOf(
            UUID(2_498,      8_948     ),
            UUID(24_982_498, 89_428_942),
        )

        val byteArrayOutputStream = ByteArrayOutputStream()
        val mcOutputStream        = McDataOutputStream(byteArrayOutputStream)

        with (mcOutputStream) {
            testInts.forEach(this::writeVarInt)
            testLongs.forEach(this::writeVarLong)
            testStrings.forEach(this::writeVarString)
            testUUIDs.forEach(this::writeUUID)
        }

        val byteArrayInputStream = ByteArrayInputStream(byteArrayOutputStream.toByteArray())
        val mcInputStream        = McDataInputStream(byteArrayInputStream)

        with (mcInputStream) {
            testInts.forEach    { assertEquals(it, readVarInt())    }
            testLongs.forEach   { assertEquals(it, readVarLong())   }
            testStrings.forEach { assertEquals(it, readVarString()) }
            testUUIDs.forEach   { assertEquals(it, readUUID())      }
        }
    }
}
