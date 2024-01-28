package ru.fominmv.poms.server.util.io

import org.springframework.util.MimeType

import java.net.URLDecoder
import java.nio.charset.Charset
import java.nio.charset.StandardCharsets

import java.util.Base64
import java.util.Objects

class DataURL(
    val data:     ByteArray = byteArrayOf(),
    val mimeType: MimeType  = MimeType(
        "text",
        "plain",
        StandardCharsets.US_ASCII,
    ),
) {
    companion object {
        private const val PREFIX         = "data:"
        private const val CHARSET_PREFIX = "charset="
        private       val WS_REGEX       = Regex("\\s+")

        fun decode(url: String): DataURL {
            try {
                val parts         = url.split(",", limit = 2)
                val header        = parts[0]
                val body          = parts.getOrNull(1)
                val decodedHeader = decodeHeader(header)
                val decodedBody   = if (body == null)
                    byteArrayOf()
                else if (decodedHeader.useBase64)
                    decodeBase64Body(body)
                else
                    decodeURLBody(body)

                return DataURL(
                    data     = decodedBody,
                    mimeType = decodedHeader.mimeType,
                )
            } catch (exception: Exception) {
                throw IllegalArgumentException("Bad data URL", exception)
            }
        }

        private fun decodeHeader(header: String): Header {
            val normedHeader = header.replace(WS_REGEX, "").lowercase()

            if (!normedHeader.startsWith(PREFIX))
                throw IllegalArgumentException()

            val unprefixedHeader = normedHeader.substring(PREFIX.length)
            val parameters       = unprefixedHeader.split(";")
                                                   .filter(String::isNotBlank)

            var charset   = StandardCharsets.US_ASCII
            var type      = "text"
            var subtype   = "plain"
            var useBase64 = false

            for (parameter in parameters) {
                if (parameter.startsWith(CHARSET_PREFIX)) {
                    val charsetName = parameter.substring(CHARSET_PREFIX.length)
                    charset = Charset.forName(charsetName, charset)
                    continue
                }

                if (parameter == "base64") {
                    useBase64 = true
                    continue
                }

                val typeParts = parameter.split("/")

                if (typeParts.size > 2)
                    throw IllegalArgumentException("Bad MIME-type")

                type    = typeParts[0]
                subtype = typeParts.getOrElse(1) { "*" }
            }

            return Header(
                MimeType(type, subtype, charset),
                useBase64,
            )
        }

        private class Header(
            val mimeType:  MimeType,
            val useBase64: Boolean,
        )

        private fun decodeBase64Body(body: String): ByteArray =
            try {
                Base64.getUrlDecoder().decode(body)
            } catch (_: Exception) {
                byteArrayOf()
            }

        private fun decodeURLBody(body: String): ByteArray =
            try {
                URLDecoder.decode(body, StandardCharsets.US_ASCII)
                          .toByteArray(StandardCharsets.US_ASCII)
            } catch (_: Exception) {
                byteArrayOf()
            }
    }

    fun encode(): String {
        val parts = buildList {
            if (!mimeType.type.equals("text", ignoreCase = true) ||
                !mimeType.subtype.equals("plain", ignoreCase = true))
                addLast("${mimeType.type}/${mimeType.subtype}")

            if (mimeType.charset != StandardCharsets.US_ASCII)
                addLast("charset=${mimeType.charset}")

            if (data.isNotEmpty()) {
                val encoder     = Base64.getUrlEncoder()
                val encodedData = encoder.encodeToString(data)

                addLast("base64,$encodedData")
            }
        }

        return "data:${parts.joinToString(";")}"
    }

    fun copy(data: ByteArray = this.data, mimeType: MimeType = this.mimeType): DataURL =
        DataURL(data, mimeType)

    operator fun component1(): ByteArray =
        data

    operator fun component2(): MimeType =
        mimeType

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as DataURL

        return mimeType == other.mimeType
            && data.contentEquals(other.data)
    }

    override fun hashCode(): Int =
        Objects.hash(data, mimeType)

    override fun toString(): String =
        encode()
}