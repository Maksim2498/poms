package ru.fominmv.poms.server.util.text.stringext

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

class UTFKtTest {
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
}