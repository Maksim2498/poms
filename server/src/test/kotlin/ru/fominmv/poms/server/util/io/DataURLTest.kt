package ru.fominmv.poms.server.util.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import org.springframework.util.MimeType

import ru.fominmv.poms.server.util.printSep
import ru.fominmv.poms.server.util.text.stringext.declaration

import java.nio.charset.StandardCharsets

class DataURLTest {
    private val tests = listOf(
        Pair(
            "data:,A%20brief%20note",
            DataURL("A brief note".toByteArray(StandardCharsets.US_ASCII))
        ),
        Pair(
            "data:text/plain;charset=iso-8859-1,%3F%3F%3F",
            DataURL(
                "Έχώ".toByteArray(StandardCharsets.ISO_8859_1),
                MimeType("text", "plain", StandardCharsets.ISO_8859_1),
            ),
        ),
        Pair(
            "data:",
            DataURL(),
        ),
        Pair(
            "data:,",
            DataURL(),
        ),
        Pair(
            "data:text/plain,",
            DataURL(),
        ),
        Pair(
            "data:;base64,",
            DataURL(),
        ),
        Pair(
            "data:test",
            DataURL(),
        ),
        Pair(
            "data:,;test",
            DataURL(";test".toByteArray(StandardCharsets.US_ASCII)),
        ),
        Pair(
            "data:;,test",
            DataURL("test".toByteArray(StandardCharsets.US_ASCII)),
        ),
        Pair(
            "data:text/plain,test",
            DataURL("test".toByteArray(StandardCharsets.US_ASCII)),
        ),
        Pair(
            "data:text/plain;charset=US-ASCII,test",
            DataURL("test".toByteArray(StandardCharsets.US_ASCII)),
        ),
        Pair(
            "data:;charset=UTF-8,Hello",
            DataURL(
                "Hello".encodeToByteArray(),
                MimeType("text", "plain", StandardCharsets.UTF_8),
            ),
        ),
        Pair(
            "data:,a,b",
            DataURL("a,b".toByteArray(StandardCharsets.US_ASCII)),
        ),
        Pair(
            "data:;base64",
            DataURL(),
        ),
        Pair(
            "data:;base64,",
            DataURL(),
        ),
        Pair(
            "data:;base64,hello",
            DataURL(),
        ),
        Pair(
            "data:text/html;base64,VGhpcyBpcyBhIHRlc3QK",
            DataURL(
                "This is a test\n".toByteArray(StandardCharsets.US_ASCII),
                MimeType("text", "html", StandardCharsets.US_ASCII),
            ),
        ),
        Pair(
            "data:text/plain;charset=thing;base64;test",
            DataURL(mimeType = MimeType("text", "plain", StandardCharsets.US_ASCII)),
        ),
    )

    @Test
    fun decode() {
        printSep()

        for ((encodedURL, expectedURL) in tests) {
            println("Testing ${encodedURL.declaration()} == $expectedURL")

            val actualURL = DataURL.decode(encodedURL)

            assertEquals(expectedURL, actualURL)
        }

        printSep()
    }

    @Test
    fun `should decode the same that encodes`() {
        printSep()

        for ((_, url) in tests) {
            println("Testing encoding/decoding of $url")
            assertEquals(url, DataURL.decode(url.encode()))
        }

        printSep()
    }
}