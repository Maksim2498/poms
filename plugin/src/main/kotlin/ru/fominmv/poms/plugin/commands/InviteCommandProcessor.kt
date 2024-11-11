package ru.fominmv.poms.plugin.commands

import org.bukkit.command.Command
import org.bukkit.command.CommandSender

import ru.fominmv.poms.libs.mc.commands.DispatchingCommandProcessor
import ru.fominmv.poms.libs.mc.commands.NamedCommandProcessor

class InviteCommandProcessor : NamedCommandProcessor {
    companion object {
        const val NAME = "invite"
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
            it.sender.sendMessage("Deleting all invites...")
            true
        }

        .add("delete {s}") {
            it.sender.sendMessage("Deleted invite ${it.processedArgs[1]}")
            true
        }

        .add("list") {
            it.sender.sendMessage("No invites")
            true
        }

        .add("{s}") {
            it.sender.sendMessage("Created invite for ${it.processedArgs[0]}")
            true
        }

        .build()
}
