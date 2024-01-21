package ru.fominmv.poms.server.mc.protocol.nbt.tag

import ru.fominmv.poms.server.util.declaration

sealed class ContainerTag<out T> : Tag {
    abstract val values: List<T>

    override fun toString(): String {
        val tagName    = javaClass.simpleName
        val name       = this.name.declaration()
        val size       = values.size
        val sizePlural = if (size == 1) "entry" else "entries"
        val header     = "$tagName($name): $size $sizePlural"
        val body       = if (size > 0)
            """
            |
            |{
            |${values.joinToString(separator = "\n").prependIndent("    ")}
            |}
            """.trimMargin()
        else
            ""

        return header + body
    }
}