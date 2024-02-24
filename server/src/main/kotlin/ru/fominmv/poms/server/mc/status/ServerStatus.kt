package ru.fominmv.poms.server.mc.status

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.databind.annotation.JsonSerialize

import net.kyori.adventure.text.Component
import net.kyori.adventure.text.TextComponent

import ru.fominmv.poms.server.mc.status.io.ServerStatusJSONDeserializer
import ru.fominmv.poms.server.mc.status.io.ServerStatusJSONSerializer

import java.awt.image.BufferedImage

import kotlin.time.Duration

@JsonSerialize(using = ServerStatusJSONSerializer::class)
@JsonDeserialize(using = ServerStatusJSONDeserializer::class)
data class ServerStatus (
    val version:     Version        = Version(),
    val players:     Players        = Players(),
    val description: TextComponent  = Component.empty(),
    val favicon:     BufferedImage? = null,
    val ping:        Duration       = Duration.ZERO,
)
