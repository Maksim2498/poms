package ru.fominmv.poms.server.util.io

import java.io.OutputStream

open class OutputStreamWrapper<T : OutputStream>(protected val stream: T) : OutputStream() {
    override fun close() =
        stream.close()

    override fun flush() =
        stream.flush()

    override fun write(b: Int) =
        stream.write(b)

    override fun write(b: ByteArray) =
        stream.write(b)

    override fun write(b: ByteArray, off: Int, len: Int) =
        stream.write(b, off, len)
}