package ru.fominmv.poms.server.util

import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*

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
}