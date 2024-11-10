package ru.fominmv.poms.libs.mc.commands

import org.bukkit.command.CommandExecutor
import org.bukkit.command.TabCompleter
import org.bukkit.plugin.java.JavaPlugin

interface CommandProcessor : CommandExecutor, TabCompleter {
    fun register(plugin: JavaPlugin, commandName: String) {
        val command = plugin.getCommand(commandName) ?:
            throw IllegalArgumentException("No command with name $commandName")

        command.setExecutor(this)
        command.setTabCompleter(this)
    }
}
