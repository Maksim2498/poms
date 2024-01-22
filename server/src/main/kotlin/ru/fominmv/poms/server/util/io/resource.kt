package ru.fominmv.poms.server.util.io

import java.util.zip.GZIPInputStream

fun readResourceAsByteArray(
    path:       String,
    clazz:      Class<*> = Any::class.java,
    decompress: Boolean  = false,
): ByteArray {
    var stream = clazz.getResourceAsStream(path)
              ?: throw IllegalArgumentException("Resource $path not found")

    if (decompress)
        stream = GZIPInputStream(stream)

    val array = stream.readAllBytes()

    stream.close()

    return array
}