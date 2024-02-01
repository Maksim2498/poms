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

    @Test
    fun isInet4SocketAddress() {
        val tests = listOf(
            Pair("0.0.0.0",                   true ),
            Pair("  0.  0. 0  .0  ",          true ),
            Pair("  10.  0. 255  .8  : 655 ", true ),
            Pair("0.0.0.0:",                  false),
            Pair("0.0.0.0:abcdef",            false),
            Pair("255.255.255.255:65535",     true ),
            Pair("255.255.255.255:65536",     false),
            Pair("256.255.255.255:65535",     false),
            Pair("-1.255.255.255",            false),
            Pair("0.0.0",                     false),
            Pair("0.0.0:255",                 false),
            Pair("1.2.5.10:255",              true ),
            Pair("a.b.c.10:255",              false),
            Pair("not and address",           false),
            Pair("hey 10.20.30.40 bye",       false),
            Pair("",                          false),
        )

        val sep = "*".repeat(64)

        println(sep)

        for ((string, isAddress) in tests) {
            println("Testing: ${string.declaration()}.isInet4SocketAddress == $isAddress")
            assertEquals(isAddress, string.isInet4SocketAddress)
        }

        println(sep)
    }

    @Test
    fun isInet4Address() {
        val tests = listOf(
            Pair("0.0.0.0",                   true ),
            Pair("  0.  0. 0  .0  ",          true ),
            Pair("  10.  0. 255  .8  : 655 ", false),
            Pair("0.0.0.0:",                  false),
            Pair("0.0.0.0:abcdef",            false),
            Pair("255.255.255.255:65535",     false),
            Pair("255.255.255.255:65536",     false),
            Pair("256.255.255.255:65535",     false),
            Pair("-1.255.255.255",            false),
            Pair("0.0.0",                     false),
            Pair("0.0.0:255",                 false),
            Pair("1.2.5.10:255",              false),
            Pair("1.2.5.10",                  true ),
            Pair("a.b.c.10:255",              false),
            Pair("not and address",           false),
            Pair("hey 10.20.30.40 bye",       false),
            Pair("",                          false),
        )

        val sep = "*".repeat(64)

        println(sep)

        for ((string, isAddress) in tests) {
            println("Testing: ${string.declaration()}.isInet4Address == $isAddress")
            assertEquals(isAddress, string.isInet4Address)
        }

        println(sep)
    }
}