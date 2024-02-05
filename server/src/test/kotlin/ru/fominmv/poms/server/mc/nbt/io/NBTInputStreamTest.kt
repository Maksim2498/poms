package ru.fominmv.poms.server.mc.nbt.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import java.util.*
import java.util.zip.GZIPInputStream

class NBTInputStreamTest {
    @Test
    fun readNBT() {
        val stream = NBTInputStream(
            GZIPInputStream(
                Objects.requireNonNull(
                    NBTInputStreamTest::class.java.getResourceAsStream(
                        "/mc/nbt/io/big_test.nbt.gz"
                    )
                )
            )
        )

        val nbt = stream.readNBT()

        stream.close()

        assertEquals(BIG_TEST_NBT, nbt)
    }
}