package ru.fominmv.poms.server.mc.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.util.UUID

import kotlin.random.Random

class McDataOutputStreamTest {
    @Test
    fun writeVarInt() {
        val tests: List<Pair<Int, List<UByte>>> = listOf(
            Pair( 0,             listOf(  0u                       )),
            Pair( 1,             listOf(  1u                       )),
            Pair( 2,             listOf(  2u                       )),
            Pair( 127,           listOf(127u                       )),
            Pair( 128,           listOf(128u,   1u                 )),
            Pair( 255,           listOf(255u,   1u                 )),
            Pair( 25_565,        listOf(221u, 199u,   1u           )),
            Pair( 2_097_151,     listOf(255u, 255u, 127u           )),
            Pair( 2_147_483_647, listOf(255u, 255u, 255u, 255u,  7u)),
            Pair(-1,             listOf(255u, 255u, 255u, 255u, 15u)),
            Pair(-2_147_483_648, listOf(128u, 128u, 128u, 128u,  8u)),
        )

        val byteArrayOutputStream = ByteArrayOutputStream()
        val mcDataOutputStream    = McDataOutputStream(byteArrayOutputStream)

        tests.forEach { mcDataOutputStream.writeVarInt(it.first) }

        val wroteBytes           = byteArrayOutputStream.toByteArray()
        val byteArrayInputStream = ByteArrayInputStream(wroteBytes)
        val dataInputStream      = DataInputStream(byteArrayInputStream)

        tests.forEach { pair ->
            pair.second.forEach { expectedByte ->
                val actualByte = dataInputStream.readByte().toUByte()

                assertEquals(expectedByte, actualByte)
            }
        }
    }

    @Test
    fun writeVarLong() {
        val tests: List<Pair<Long, List<UByte>>> = listOf(
            Pair( 0,                         listOf(  0u                                                    )),
            Pair( 1,                         listOf(  1u                                                    )),
            Pair( 2,                         listOf(  2u                                                    )),
            Pair( 127,                       listOf(127u                                                    )),
            Pair( 128,                       listOf(128u,   1u                                              )),
            Pair( 255,                       listOf(255u,   1u                                              )),
            Pair( 2_147_483_647,             listOf(255u, 255u, 255u, 255u,   7u                            )),
            Pair( 9_223_372_036_854_775_807, listOf(255u, 255u, 255u, 255u, 255u, 255u, 255u, 255u, 127u    )),
            Pair(-1,                         listOf(255u, 255u, 255u, 255u, 255u, 255u, 255u, 255u, 255u, 1u)),
            Pair(-2_147_483_648,             listOf(128u, 128u, 128u, 128u, 248u, 255u, 255u, 255u, 255u, 1u)),
            Pair(-9_223_372_036_854_775_807, listOf(129u, 128u, 128u, 128u, 128u, 128u, 128u, 128u, 128u, 1u)),
        )

        val byteArrayOutputStream = ByteArrayOutputStream()
        val mcDataOutputStream    = McDataOutputStream(byteArrayOutputStream)

        tests.forEach { mcDataOutputStream.writeVarLong(it.first) }

        val wroteBytes           = byteArrayOutputStream.toByteArray()
        val byteArrayInputStream = ByteArrayInputStream(wroteBytes)
        val dataInputStream      = DataInputStream(byteArrayInputStream)

        tests.forEach { pair ->
            pair.second.forEach { expectedByte ->
                val actualByte = dataInputStream.readByte().toUByte()

                assertEquals(actualByte, expectedByte)
            }
        }
    }

    @Test
    fun writeVarString() {
        val tests = listOf(
            "Hello, World!",
            "こんにちは、世界!",
            "Привет, Мир!",
            "😂😎🥸🤓",
            """
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Nam pulvinar facilisis eros non imperdiet. Sed eu ullamcorper
                nulla. Maecenas fermentum, turpis nec euismod malesuada,
                odio sapien gravida nisl, nec luctus est purus id turpis.
                Ut in lorem non orci venenatis lobortis ac id ipsum. Sed at
                mperdiet nunc. Praesent viverra quis leo ac viverra. Ut
                at est enim. Fusce malesuada nulla nec leo finibus bibendum.
                Donec malesuada finibus dolor. Donec sed condimentum nisl,
                vel porta tellus. Duis viverra, nisi et ultricies tincidunt,
                purus sem varius augue, ut iaculis leo libero non lacus.
                Vestibulum ultricies augue eget posuere rutrum. 
            """.trimIndent(),
        )

        val byteArrayOutputStream = ByteArrayOutputStream()
        val mcDataOutputStream    = McDataOutputStream(byteArrayOutputStream)

        tests.forEach(mcDataOutputStream::writeVarString)

        val wroteBytes           = byteArrayOutputStream.toByteArray()
        val byteArrayInputStream = ByteArrayInputStream(wroteBytes)
        val mcDataInputStream    = McDataInputStream(byteArrayInputStream)

        for (test in tests) {
            assertEquals(test.length, mcDataInputStream.readVarInt())

            val expectedBytes = test.toByteArray()
            val actualBytes   = ByteArray(expectedBytes.size)

            mcDataInputStream.readFully(actualBytes)

            assertArrayEquals(expectedBytes, actualBytes)
        }
    }

    @Test
    fun writeUUID() {
        val tests = List(10) { UUID(Random.nextLong(), Random.nextLong()) }

        val byteArrayOutputStream = ByteArrayOutputStream()
        val mcDataOutputStream    = McDataOutputStream(byteArrayOutputStream)

        tests.forEach(mcDataOutputStream::writeUUID)

        val wroteBytes           = byteArrayOutputStream.toByteArray()
        val byteArrayInputStream = ByteArrayInputStream(wroteBytes)
        val dataInputStream      = DataInputStream(byteArrayInputStream)

        for (test in tests) {
            assertEquals(test.mostSignificantBits,  dataInputStream.readLong())
            assertEquals(test.leastSignificantBits, dataInputStream.readLong())
        }
    }
}