package ru.fominmv.poms.libs.mc.commands.args

import org.bukkit.command.*

import ru.fominmv.poms.libs.mc.commands.CommandProcessor

data class ArgList(
    val args: List<Arg<*>> = emptyList(),
    val action: Action = Action { false },
) : CommandProcessor {
    override fun onCommand(
        sender: CommandSender,
        command: Command,
        label: String,
        rawArgs: Array<out String>,
    ): Boolean {
        if (rawArgs.size != args.size)
            return false

        val processedArgs = buildList {
            for ((rawArg, arg) in rawArgs.zip(args))
                add(arg.tryProcess(rawArg) ?: return false)
        }

        return action.execute(Action.Context(
            sender = sender,

            command = command,
            label = label,

            args = args,
            rawArgs = rawArgs.toList(),
            processedArgs = processedArgs,
        ))
    }

    @Suppress("RedundantNullableReturnType")
    override fun onTabComplete(
        sender: CommandSender,
        command: Command,
        label: String,
        rawArgs: Array<out String>,
    ): MutableList<String>? {
        if (rawArgs.isEmpty() || rawArgs.size > args.size)
            return mutableListOf()

        for ((i, rawArg) in rawArgs.withIndex()) {
            if (i >= rawArgs.size - 1)
                break

            if (!args[i].matches(rawArg))
                return mutableListOf()
        }

        return args[rawArgs.lastIndex].tabComplete(rawArgs.last()).toMutableList()
    }

    fun interface Action {
        fun execute(context: Context): Boolean

        data class Context(
            val sender: CommandSender,

            val command: Command,
            val label: String = command.label,

            val args: List<Arg<*>> = emptyList(),
            val rawArgs: List<String> = emptyList(),
            val processedArgs: List<Any> = emptyList(),
        )
    }
}
