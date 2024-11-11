package ru.fominmv.poms.libs.mc.commands

import org.bukkit.plugin.java.JavaPlugin

interface NamedCommandProcessor : CommandProcessor {
    val name: String

    fun register(plugin: JavaPlugin) =
        register(plugin, name)
}
