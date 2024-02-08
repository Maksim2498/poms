package ru.fominmv.poms.server.util.text.stringext

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import ru.fominmv.poms.server.util.printSep

class UTFKtTest {
    @Test
    fun utf8Length() {
        val tests = listOf(
            Pair("Hello, World!", 13),
            Pair("こんにちは、世界!", 25),
            Pair("Привет, Мир!", 21),
            Pair("😂😎🥸🤓", 16),
        )

        printSep()

        for ((string, utf8Length) in tests) {
            println("Testing ${string.declaration()}.ut8Length == $utf8Length")
            assertEquals(utf8Length, string.utf8Length)
        }

        printSep()
    }
}