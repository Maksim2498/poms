package ru.fominmv.poms.libs.mc.commands

import ru.fominmv.poms.libs.mc.commands.args.parsing.ArgListParser
import ru.fominmv.poms.libs.mc.commands.args.parsing.DefaultArgListParser
import ru.fominmv.poms.libs.mc.commands.args.ArgList

open class MutableDispatchingCommandProcessor(
    override var argLists: MutableList<ArgList> = mutableListOf(),
) :
    DispatchingCommandProcessor(argLists),
    CommandProcessor
{
    open class ParsingBuilder(parser: ArgListParser = DefaultArgListParser()) :
        DispatchingCommandProcessor.ParsingBuilder(parser)
    {
        override fun build(): MutableDispatchingCommandProcessor =
            MutableDispatchingCommandProcessor(argList)
    }
}
