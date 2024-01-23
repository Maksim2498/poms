package ru.fominmv.poms.server.mc.nbt.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import java.util.*
import java.util.zip.GZIPInputStream

class TagInputStreamTest {
    @Test
    fun readTag() {
        val stream = ru.fominmv.poms.server.mc.nbt.io.TagInputStream(
            GZIPInputStream(
                Objects.requireNonNull(
                    TagInputStreamTest::class.java.getResourceAsStream(
                        "/mc/protocol/nbt/io/big_test.nbt.gz"
                    )
                )
            )
        )

        val tag = stream.readTag()

        stream.close()

        assertEquals(tag, BIG_TEST_TAG)
    }
}