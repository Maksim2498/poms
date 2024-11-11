package ru.fominmv.poms.plugin.commands

import org.bukkit.command.Command
import org.bukkit.command.CommandSender

import ru.fominmv.poms.libs.mc.commands.DispatchingCommandProcessor
import ru.fominmv.poms.libs.mc.commands.NamedCommandProcessor

class UserCommandProcessor : NamedCommandProcessor {
    companion object {
        const val NAME = "user"
    }

    override val name: String
        get() = NAME

    override fun onCommand(
        sender: CommandSender,
        command: Command,
        label: String,
        args: Array<out String>,
    ): Boolean =
        processor.onCommand(sender, command, label, args)

    override fun onTabComplete(
        sender: CommandSender,
        command: Command,
        label: String,
        args: Array<out String>,
    ): MutableList<String>? =
        processor.onTabComplete(sender, command, label, args)

    private val processor = DispatchingCommandProcessor.ParsingBuilder()
        .add("delete all") {
            it.sender.sendMessage("Deleting all users...")
            true
        }

        .add("delete {s}") {
            it.sender.sendMessage("Deleted user ${it.processedArgs[1]}")
            true
        }

        .add("list") {
            it.sender.sendMessage("No users")
            true
        }

        .build()
}
