package ru.fominmv.poms.libs.mc.nbt.io

import java.io.DataInputStream
import java.util.zip.GZIPInputStream
import java.util.*

import kotlin.test.assertEquals
import kotlin.test.Test

class NbtInputStreamTest {
    @Test
    fun readNbt() {
        val stream = NbtInputStream(
            DataInputStream(
                GZIPInputStream(
                    Objects.requireNonNull(
                        NbtInputStreamTest::class.java.getResourceAsStream(
                            "/big_test.nbt.gz"
                        )
                    )
                )
            )
        )

        val nbt = stream.readNbt()

        stream.close()

        println("Read NBT: $nbt")

        assertEquals(BIG_TEST_NBT, nbt)
    }
}
