package ru.fominmv.poms.libs.mc.commands.args

import ru.fominmv.poms.libs.commons.strings.ext.startsWithAndNotEquals

data class LiteralArg(val literal: String) : Arg<String> {
    override fun matches(arg: String): Boolean =
        arg == literal

    override fun tabComplete(arg: String): List<String> =
        if (literal.startsWithAndNotEquals(arg))
            listOf(literal)
        else
            emptyList()

    override fun tryProcess(arg: String): String? =
        if (matches(arg))
            arg
        else
            null
}
