package ru.fominmv.poms.server.mc.status

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.databind.annotation.JsonSerialize

import net.kyori.adventure.text.Component
import net.kyori.adventure.text.TextComponent

import ru.fominmv.poms.server.mc.status.io.JSONServerStatusDeserializer
import ru.fominmv.poms.server.mc.status.io.JSONServerStatusSerializer

import java.awt.image.BufferedImage

import kotlin.time.Duration

@JsonSerialize(using = JSONServerStatusSerializer::class)
@JsonDeserialize(using = JSONServerStatusDeserializer::class)
data class ServerStatus (
    val version:     Version        = Version(),
    val players:     List<Player>   = emptyList(),
    val maxPlayers:  UInt           = 0u,
    val description: TextComponent  = Component.empty(),
    val favicon:     BufferedImage? = null,
    val ping:        Duration       = Duration.ZERO,
)
