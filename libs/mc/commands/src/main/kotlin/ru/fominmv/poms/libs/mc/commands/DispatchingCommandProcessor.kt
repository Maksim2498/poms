package ru.fominmv.poms.libs.mc.commands

import org.bukkit.command.*

import ru.fominmv.poms.libs.mc.commands.args.parsing.*
import ru.fominmv.poms.libs.mc.commands.args.*

open class DispatchingCommandProcessor(
    open val argLists: List<ArgList> = mutableListOf(),
) : CommandProcessor {
    // Execution

    override fun onCommand(
        sender: CommandSender,
        command: Command,
        label: String,
        args: Array<out String>,
    ): Boolean =
        argLists.any { it.onCommand(sender, command, label, args) }

    // Tab completion

    override fun onTabComplete(
        sender: CommandSender,
        command: Command,
        label: String,
        args: Array<out String>,
    ): MutableList<String>? {
        val completions = argLists.map { it.onTabComplete(sender, command, label, args) }

        if (completions.all { it == null })
            return null

        return completions
            .filterNotNull()
            .flatten()
            .toMutableList()
    }

    // Builder

    open class ParsingBuilder(val parser: ArgListParser = DefaultArgListParser()) {
        protected val argList: MutableList<ArgList> = mutableListOf()

        open fun add(string: String, action: ArgList.Action): ParsingBuilder {
            argList.add(parser.parse(string, action))
            return this
        }

        open fun build(): DispatchingCommandProcessor =
            DispatchingCommandProcessor(argList)
    }
}
