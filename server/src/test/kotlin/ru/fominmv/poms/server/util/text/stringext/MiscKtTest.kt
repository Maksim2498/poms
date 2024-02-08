package ru.fominmv.poms.server.util.text.stringext

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import ru.fominmv.poms.server.util.printSep

class MiscKtTest {
    @Test
    fun declaration() {
        val tests = listOf(
            Pair("",                    "\"\""                             ),
            Pair("Hello, World!",       "\"Hello, World!\""                ),
            Pair("abc\t\b\n\r\'\"\\\$", "\"abc\\t\\b\\n\\r\\'\\\"\\\\\\$\""),
        )

        printSep()

        for ((string, declaration) in tests) {
            println("Testing ${string.declaration()}.declaration() == ${declaration.declaration()}")
            assertEquals(string.declaration(), declaration)
        }

        printSep()
    }

    @Test
    fun escapeSpecial() {
        val tests = listOf(
            Pair("",                    ""                             ),
            Pair("Hello, World!",       "Hello, World!"                ),
            Pair("abc\t\b\n\r\'\"\\\$", "abc\\t\\b\\n\\r\\'\\\"\\\\\\$"),
        )

        printSep()

        for ((string, escaped) in tests) {
            println("Testing ${string.declaration()}.escapeSpecial() == ${escaped.declaration()}")
            assertEquals(string.escapeSpecial(), escaped)
        }

        printSep()
    }
}