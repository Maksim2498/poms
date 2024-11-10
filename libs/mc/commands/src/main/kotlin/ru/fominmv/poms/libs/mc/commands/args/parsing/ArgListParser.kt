package ru.fominmv.poms.libs.mc.commands.args.parsing

import ru.fominmv.poms.libs.mc.commands.args.Arg
import ru.fominmv.poms.libs.mc.commands.args.ArgList

fun interface ArgListParser {
    fun parse(string: String, action: ArgList.Action): ArgList =
        ArgList(parse(string), action)

    fun parse(string: String): List<Arg<*>>
}
