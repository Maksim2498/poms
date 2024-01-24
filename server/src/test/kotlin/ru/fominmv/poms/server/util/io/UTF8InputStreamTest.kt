package ru.fominmv.poms.server.util.io

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

import java.io.ByteArrayInputStream

class UTF8InputStreamTest {
    private val testString = "ABC АБВ カキク 😀😃😄"

    @Test
    fun readFullUTF8Char() {
        val bytes  = testString.encodeToByteArray()
        val stream = UTF8InputStream(ByteArrayInputStream(bytes))

        with (stream) {
            assertEquals("A", readFullUTF8Char())
            assertEquals("B", readFullUTF8Char())
            assertEquals("C", readFullUTF8Char())
            assertEquals(" ", readFullUTF8Char())
            assertEquals("А", readFullUTF8Char())
            assertEquals("Б", readFullUTF8Char())
            assertEquals("В", readFullUTF8Char())
            assertEquals(" ", readFullUTF8Char())
            assertEquals("カ", readFullUTF8Char())
            assertEquals("キ", readFullUTF8Char())
            assertEquals("ク", readFullUTF8Char())
            assertEquals(" ", readFullUTF8Char())
            assertEquals("😀", readFullUTF8Char())
            assertEquals("😃", readFullUTF8Char())
            assertEquals("😄", readFullUTF8Char())
        }
    }

    @Test
    fun readUTF8Char() {
        val bytes  = testString.encodeToByteArray()
        val stream = UTF8InputStream(ByteArrayInputStream(bytes))

        with (stream) {
            assertEquals('A', readUTF8Char())
            assertEquals('B', readUTF8Char())
            assertEquals('C', readUTF8Char())
            assertEquals(' ', readUTF8Char())
            assertEquals('А', readUTF8Char())
            assertEquals('Б', readUTF8Char())
            assertEquals('В', readUTF8Char())
            assertEquals(' ', readUTF8Char())
            assertEquals('カ', readUTF8Char())
            assertEquals('キ', readUTF8Char())
            assertEquals('ク', readUTF8Char())
            assertEquals(' ', readUTF8Char())
            assertEquals("😀", "${readUTF8Char()}${readUTF8Char()}")
            assertEquals("😃", "${readUTF8Char()}${readUTF8Char()}")
            assertEquals("😄", "${readUTF8Char()}${readUTF8Char()}")
        }
    }
}