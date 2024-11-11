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
    inner class ParsingFiller(val parser: ArgListParser = DefaultArgListParser()) {
        fun add(string: String, action: ArgList.Action): ParsingFiller {
            this@MutableDispatchingCommandProcessor.argLists.add(parser.parse(string, action))
            return this
        }
    }

    open class ParsingBuilder(parser: ArgListParser = DefaultArgListParser()) :
        DispatchingCommandProcessor.ParsingBuilder(parser)
    {
        override fun build(): MutableDispatchingCommandProcessor =
            MutableDispatchingCommandProcessor(argList)
    }
}
