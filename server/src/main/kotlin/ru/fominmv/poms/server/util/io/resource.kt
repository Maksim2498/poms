package ru.fominmv.poms.server.util.io

fun readResourceAsByteArray(path: String, clazz: Class<*> = Any::class.java): ByteArray {
    val stream = clazz.getResourceAsStream(path)
              ?: throw IllegalArgumentException("Resource $path not found")

    return stream.readAllBytes()
}