package ru.fominmv.poms.libs.commons.text.strings.ext

import ru.fominmv.poms.libs.commons.io.printlnSep

import kotlin.test.Test
import kotlin.test.assertEquals

class UtfTest {
    @Test
    fun utf8Length() {
        val tests = listOf(
            Pair("Hello, World!", 13),
            Pair("こんにちは、世界!", 25),
            Pair("Привет, Мир!", 21),
            Pair("😂😎🥸🤓", 16),
        )

        printlnSep()

        for ((string, utf8Length) in tests) {
            print("Testing ${string.declaration()}.ut8Length == $utf8Length")
            assertEquals(utf8Length, string.utf8Length)
            println(" ✅")
        }

        printlnSep()
    }
}
