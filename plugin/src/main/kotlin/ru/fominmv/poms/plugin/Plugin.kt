package ru.fominmv.poms.plugin

import org.bukkit.plugin.java.JavaPlugin

import ru.fominmv.poms.libs.mc.commands.DispatchingCommandProcessor

class Plugin : JavaPlugin() {
    override fun onEnable() {
        registerCommands()
    }

    override fun onDisable() {

    }

    private fun registerCommands() {
        registerInviteCommand()
        registerUserCommand()
    }

    private fun registerInviteCommand() {
        DispatchingCommandProcessor.ParsingBuilder()
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
            .register(this, "invite")
    }

    private fun registerUserCommand() {
        DispatchingCommandProcessor.ParsingBuilder()
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
            .register(this, "user")
    }
}
