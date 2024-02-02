package ru.fominmv.poms.server.mc.nbt.tag

import ru.fominmv.poms.server.util.text.stringext.declaration

sealed class ContainerNBT<out T> : NBT {
    abstract val values: Collection<T>

    override fun toString(): String {
        val nbtName    = javaClass.simpleName
        val name       = this.name.declaration()
        val size       = values.size
        val sizePlural = if (size == 1) "entry" else "entries"
        val header     = "$nbtName($name): $size $sizePlural"
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