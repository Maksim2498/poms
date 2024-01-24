package ru.fominmv.poms.server.util

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class StringExtKtTest {
    @Test
    fun declaration() {
        assertEquals("\"\"",                              "".declaration()                   )
        assertEquals("\"Hello, World!\"",                 "Hello, World!".declaration()      )
        assertEquals("\"abc\\t\\b\\n\\r\\'\\\"\\\\\\$\"", "abc\t\b\n\r\'\"\\\$".declaration())
    }

    @Test
    fun escapeSpecial() {
        assertEquals("",                              "".escapeSpecial()                   )
        assertEquals("Hello, World!",                 "Hello, World!".escapeSpecial()      )
        assertEquals("abc\\t\\b\\n\\r\\'\\\"\\\\\\$", "abc\t\b\n\r\'\"\\\$".escapeSpecial())
    }

    @Test
    fun utf8Length() {
        val tests = listOf(
            Pair("Hello, World!", 13),
            Pair("こんにちは、世界!", 25),
            Pair("Привет, Мир!", 21),
            Pair("😂😎🥸🤓", 16),
        )

        tests.forEach { (string, utf8Length) ->
            assertEquals(string.utf8Length, utf8Length)
        }
    }
}