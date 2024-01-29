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

                assertEquals(actualByte, expectedByte)
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
        // TODO
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
            assertEquals(dataInputStream.readLong(), test.mostSignificantBits)
            assertEquals(dataInputStream.readLong(), test.leastSignificantBits)
        }
    }
}