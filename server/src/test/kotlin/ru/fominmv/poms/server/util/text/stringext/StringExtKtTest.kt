package ru.fominmv.poms.server.util.text.stringext

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class StringExtTest {
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
            assertEquals(utf8Length, string.utf8Length)
        }
    }

    @Test
    fun isIP4Address() {
        val tests = listOf(
            Triple("0.0.0.0",                   PortMode.OPTIONAL, true ),
            Triple("0.0.0.0",                   PortMode.REQUIRED, false),
            Triple("  0.  0. 0  .0  ",          PortMode.OPTIONAL, true ),
            Triple("  10.  0. 255  .8  : 655 ", PortMode.OPTIONAL, true ),
            Triple("0.0.0.0:",                  PortMode.OPTIONAL, false),
            Triple("0.0.0.0:abcdef",            PortMode.OPTIONAL, false),
            Triple("255.255.255.255:65535",     PortMode.OPTIONAL, true ),
            Triple("255.255.255.255:65535",     PortMode.NO,       false),
            Triple("255.255.255.255:65536",     PortMode.OPTIONAL, false),
            Triple("256.255.255.255:65535",     PortMode.OPTIONAL, false),
            Triple("-1.255.255.255",            PortMode.OPTIONAL, false),
            Triple("0.0.0",                     PortMode.OPTIONAL, false),
            Triple("0.0.0:255",                 PortMode.OPTIONAL, false),
            Triple("1.2.5.10:255",              PortMode.OPTIONAL, true ),
            Triple("a.b.c.10:255",              PortMode.OPTIONAL, false),
            Triple("not and address",           PortMode.OPTIONAL, false),
            Triple("hey 10.20.30.40 bye",       PortMode.OPTIONAL, false),
            Triple("",                          PortMode.OPTIONAL, false),
        )

        val sep = "*".repeat(64)

        println(sep)

        for ((string, portMode, isAddress) in tests) {
            println("Testing: ${string.declaration()}.isInet4SocketAddress(${portMode}) == $isAddress")
            assertEquals(isAddress, string.isIP4Address(portMode))
        }

        println(sep)
    }
}