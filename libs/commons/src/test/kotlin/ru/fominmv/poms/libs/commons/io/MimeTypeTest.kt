package ru.fominmv.poms.libs.commons.io

import org.junit.jupiter.api.assertThrows

import kotlin.test.Test
import kotlin.test.assertEquals

class MimeTypeTest {
    @Test
    fun testParse() {
        assertThrows<IllegalArgumentException> { MimeType.parse("") }
        assertThrows<IllegalArgumentException> { MimeType.parse("/") }
        assertThrows<IllegalArgumentException> { MimeType.parse("*/") }
        assertThrows<IllegalArgumentException> { MimeType.parse("/*") }
        assertThrows<IllegalArgumentException> { MimeType.parse("*/*;;") }

        assertEquals("*/*", MimeType.parse("*/*").toString())
        assertEquals("*/*", MimeType.parse("*/*;").toString())
        assertEquals("*/*", MimeType.parse("  *   /  * ").toString())
        assertEquals("*/*", MimeType.parse("  *   /  * ; ").toString())
        assertEquals("a/b+c;d", MimeType.parse("a/b+c;d; ").toString())

        assertEquals(
            "text/plain;charset=UTF-8;base64",
            MimeType.parse("text/plain;charset=utf-8;base64").toString(),
        )

        assertEquals(
            "text/plain;charset=UTF-8;base64",
            MimeType.parse("  TeXT  / pLaIN  ; charset  =utf-8; base64  ").toString(),
        )

        assertEquals(
            "*/*;hello=\"Hello, World!\"",
            MimeType.parse("*/*;hello=Hello, World!").toString(),
        )

        assertEquals(
            "*/*;hello=\"Hello;World!\";base64",
            MimeType.parse("*/*;hello=\"Hello;World!\";base64;").toString(),
        )
    }
}
