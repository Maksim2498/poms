package ru.fominmv.poms.libs.mc.commands.args.parsing

import ru.fominmv.poms.libs.mc.commands.args.Arg

fun interface ArgParser {
    fun parse(string: String): Arg<*>
}
