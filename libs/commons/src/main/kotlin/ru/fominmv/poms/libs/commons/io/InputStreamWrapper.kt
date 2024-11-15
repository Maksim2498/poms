package ru.fominmv.poms.libs.commons.io

import java.io.InputStream

open class InputStreamWrapper<T : InputStream>(protected val stream: T) : InputStream() {
    override fun available(): Int =
        stream.available()

    override fun close() =
        stream.close()

    override fun mark(readlimit: Int) =
        stream.mark(readlimit)

    override fun markSupported(): Boolean =
        stream.markSupported()

    override fun read(): Int =
        stream.read()

    override fun read(b: ByteArray): Int =
        stream.read(b)

    override fun read(b: ByteArray, off: Int, len: Int): Int =
        stream.read(b, off, len)

    override fun reset() =
        stream.reset()

    override fun skip(n: Long): Long =
        stream.skip(n)
}
