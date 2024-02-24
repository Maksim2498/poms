package ru.fominmv.poms.server.mc.status.io

import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.databind.SerializerProvider
import com.fasterxml.jackson.databind.ser.std.StdSerializer

import net.kyori.adventure.text.TextComponent
import net.kyori.adventure.text.serializer.json.JSONComponentSerializer

import org.springframework.util.MimeType

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.util.io.DataURL

import java.awt.image.BufferedImage
import java.io.ByteArrayOutputStream

import javax.imageio.ImageIO

import kotlin.time.Duration
import kotlin.time.DurationUnit

class ServerStatusJSONSerializer : StdSerializer<ServerStatus>(ServerStatus::class.java) {
    override fun serialize(
        value:     ServerStatus,
        generator: JsonGenerator,
        provider:  SerializerProvider,
    ) = with (generator) {
        writeStartObject()
        writeObjectField("version", value.version)
        writeObjectField("players", value.players)
        writeFavicon(value.favicon, this)
        writeDescription(value.description, this)
        writePing(value.ping, this)
        writeEndObject()
    }

    private fun writeFavicon(favicon: BufferedImage?, generator: JsonGenerator) {
        if (favicon == null)
            return

        val stream = ByteArrayOutputStream()

        ImageIO.write(favicon, "png", stream)

        val url = DataURL(stream.toByteArray(), MimeType("image", "png"))

        generator.writeStringField("favicon", url.encode())
    }

    private fun writeDescription(description: TextComponent, generator: JsonGenerator) =
        with (generator) {
            writeFieldName("description")
            writeRawValue(JSONComponentSerializer.json().serialize(description))
        }

    private fun writePing(ping: Duration, generator: JsonGenerator) =
        generator.writeNumberField("ping", ping.toLong(DurationUnit.MILLISECONDS))
}