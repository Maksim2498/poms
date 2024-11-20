package ru.fominmv.poms.plugin

import org.bukkit.event.player.PlayerInteractEvent
import org.bukkit.event.EventHandler
import org.bukkit.event.Listener
import org.bukkit.plugin.java.JavaPlugin

import ru.fominmv.poms.plugin.commands.*

class Plugin : JavaPlugin() {
    override fun onEnable() {
        registerCommands()
        registerDebugEventHandler()
    }

    override fun onDisable() {

    }

    private fun registerCommands() {
        InviteCommandProcessor().register(this)
        UserCommandProcessor().register(this)
    }

    private fun registerDebugEventHandler() {
        server.pluginManager.registerEvents(
            object : Listener {
                @EventHandler
                fun onClick(event: PlayerInteractEvent) {
                    // Left for future debug
                }
            },

            this,
        )
    }
}
