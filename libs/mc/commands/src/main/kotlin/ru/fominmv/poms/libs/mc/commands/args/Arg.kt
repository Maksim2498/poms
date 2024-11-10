package ru.fominmv.poms.libs.mc.commands.args

interface Arg<T> {
    fun matches(arg: String): Boolean =
        tryProcess(arg) != null

    fun tabComplete(arg: String): List<String> =
        emptyList()

    fun process(arg: String): T =
        tryProcess(arg) ?: throw IllegalArgumentException("Cannot process arg $arg")

    fun tryProcess(arg: String): T?
}
