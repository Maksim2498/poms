package ru.fominmv.poms.plugin

import org.bukkit.configuration.serialization.ConfigurationSerializable
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
                    val item = event.item ?: return

                    event.player.sendMessage(serialize(item))
                }
            },

            this,
        )
    }

    private fun serialize(s: Any?, indentLevel: Int = 0): String {
        if (s !is ConfigurationSerializable)
            return s.toString()

        val INDENT_STRING = "    "

        val fields = s.serialize()

        val indent = INDENT_STRING.repeat(indentLevel)
        val nextIndentLevel = indentLevel + 1
        val nextIndent = INDENT_STRING.repeat(nextIndentLevel)

        val stringFields = fields
            .map { (key, value) ->
                "$key: ${value.javaClass.name} ${serialize(value, nextIndentLevel)}"
            }
            .joinToString("\n") { nextIndent + it }

        return "{\n$stringFields\n$indent}"
    }
}
