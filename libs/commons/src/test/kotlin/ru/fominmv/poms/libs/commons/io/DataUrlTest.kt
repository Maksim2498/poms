package ru.fominmv.poms.libs.commons.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import ru.fominmv.poms.libs.commons.text.strings.ext.declaration

import java.nio.charset.StandardCharsets

class DataUrlTest {
    private val tests = listOf(
        Pair(
            "data:,A%20brief%20note",
            DataUrl("A brief note".toByteArray(StandardCharsets.US_ASCII)),
        ),

        Pair(
            "data:text/plain;charset=iso-8859-1,%3F%3F%3F",

            DataUrl(
                "Έχώ".toByteArray(StandardCharsets.ISO_8859_1),
                MimeType("text", "plain", StandardCharsets.ISO_8859_1),
            ),
        ),

        Pair(
            "data:",
            DataUrl(),
        ),

        Pair(
            "data:,",
            DataUrl(),
        ),

        Pair(
            "data:text/plain,",
            DataUrl(),
        ),

        Pair(
            "data:",
            DataUrl(),
        ),

        Pair(
            "data:test",
            DataUrl(),
        ),

        Pair(
            "data:,;test",
            DataUrl(";test".toByteArray(MimeType.DEFAULT_CHARSET)),
        ),

        Pair(
            "data:;,test",
            DataUrl("test".toByteArray(MimeType.DEFAULT_CHARSET)),
        ),

        Pair(
            "data:text/plain,test",
            DataUrl("test".toByteArray(MimeType.DEFAULT_CHARSET)),
        ),

        Pair(
            "data:text/plain;charset=US-ASCII,test",
            DataUrl("test".toByteArray(MimeType.DEFAULT_CHARSET)),
        ),

        Pair(
            "data:;charset=UTF-8,Hello",

            DataUrl(
                "Hello".encodeToByteArray(),
                MimeType("text", "plain", StandardCharsets.UTF_8),
            ),
        ),

        Pair(
            "data:,a,b",
            DataUrl("a,b".toByteArray(MimeType.DEFAULT_CHARSET)),
        ),

        Pair(
            "data:;base64",
            DataUrl(mimeType = MimeType.TEXT_PLAIN.withBase64(true)),
        ),

        Pair(
            "data:;base64,",
            DataUrl(mimeType = MimeType.TEXT_PLAIN.withBase64(true)),
        ),

        Pair(
            "data:;base64,hello",

            DataUrl(mimeType = MimeType.TEXT_PLAIN.withBase64(true)),
        ),

        Pair(
            "data:text/html;base64,VGhpcyBpcyBhIHRlc3QK",

            DataUrl(
                "This is a test\n".toByteArray(StandardCharsets.US_ASCII),

                MimeType(
                    type = "text",
                    subtype = "html",
                    charset = StandardCharsets.US_ASCII,
                    base64 = true,
                )
            ),
        ),

        Pair(
            "data:text/plain;charset=thing;base64;test",

            DataUrl(mimeType = MimeType(
                type = "text",
                subtype = "plain",
                charset = StandardCharsets.US_ASCII,
                base64 = true,
            )),
        ),
    )

    @Test
    fun decode() {
        printlnSep()

        for ((encodedUrl, expectedUrl) in tests) {
            print("Testing ${encodedUrl.declaration()} == $expectedUrl")

            val actualUrl = DataUrl.decode(encodedUrl)

            assertEquals(expectedUrl, actualUrl)

            println(" ✅")
        }

        printlnSep()
    }

    @Test
    fun `should decode the same that encodes`() {
        printlnSep()

        for ((_, url) in tests) {
            print("Testing encoding/decoding of $url")

            val encoded = url.encode()
            val decoded = DataUrl.decode(encoded)

            assertEquals(url.toString(), decoded.toString())

            println(" ✅")
        }

        printlnSep()
    }
}
