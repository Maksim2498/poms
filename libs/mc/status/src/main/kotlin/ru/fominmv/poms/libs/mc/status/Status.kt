package ru.fominmv.poms.libs.mc.status

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import com.fasterxml.jackson.databind.annotation.JsonSerialize

import net.kyori.adventure.text.Component
import net.kyori.adventure.text.TextComponent

import ru.fominmv.poms.libs.mc.status.io.json.StatusJsonDeserializer
import ru.fominmv.poms.libs.mc.status.io.json.StatusJsonSerializer

import java.awt.image.BufferedImage

import kotlin.time.Duration

@JsonSerialize(using = StatusJsonSerializer::class)
@JsonDeserialize(using = StatusJsonDeserializer::class)
data class Status(
    val version: Version = Version(),
    val players: PlayerList = PlayerList(),
    val description: TextComponent = Component.empty(),
    val favicon: BufferedImage? = null,
    val ping: Duration = Duration.ZERO,
)
