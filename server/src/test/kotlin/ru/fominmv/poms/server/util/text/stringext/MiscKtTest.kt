package ru.fominmv.poms.server.util.text.stringext

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class MiscKtTest {
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