package ru.fominmv.poms.libs.mc.commands.args

import ru.fominmv.poms.libs.commons.strings.ext.startsWithAndNotEquals

abstract class AbstractStringSetArg : Arg<String> {
    override fun matches(arg: String): Boolean =
        arg in strings

    override fun tabComplete(arg: String): List<String> =
        buildList {
            for (string in strings)
                if (string.startsWithAndNotEquals(arg))
                    add(string)
        }

    override fun tryProcess(arg: String): String? =
        if (matches(arg))
            arg
        else
            null

    protected abstract val strings: Set<String>
}
