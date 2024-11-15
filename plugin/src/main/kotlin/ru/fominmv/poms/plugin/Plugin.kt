package ru.fominmv.poms.plugin

import org.bukkit.plugin.java.JavaPlugin

import ru.fominmv.poms.plugin.commands.*

class Plugin : JavaPlugin() {
    override fun onEnable() {
        registerCommands()
    }

    override fun onDisable() {

    }

    private fun registerCommands() {
        InviteCommandProcessor().register(this)
        UserCommandProcessor().register(this)
    }
}
