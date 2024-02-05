package ru.fominmv.poms.server.util.io

import org.springframework.util.MimeType

import java.net.URLDecoder
import java.nio.charset.Charset
import java.nio.charset.StandardCharsets

import java.util.Base64
import java.util.Objects

class DataURL(
    val data:     ByteArray = byteArrayOf(),
    val mimeType: MimeType  = DEFAULT_MIME_TYPE,
) {
    constructor(
        data:        ByteArray = byteArrayOf(),
        mimeType:    String    = DEFAULT_MIME_TYPE.type,
        mimeSubtype: String    = DEFAULT_MIME_TYPE.subtype,
        charset:     Charset   = StandardCharsets.US_ASCII,
    ): this(data, MimeType(mimeType, mimeSubtype, charset)) {
    }

    companion object {
        val DEFAULT_MIME_TYPE = MimeType(
            "text",
            "plain",
            StandardCharsets.US_ASCII,
        )

        private const val PREFIX                   = "data:"
        private const val BASE64_SUFFIX            = ";base64"
        private const val CHARSET_PARAMETER_PREFIX = "charset="
        private       val WS_REGEX                 = Regex("\\s+")

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
                throw IllegalArgumentException("Missing \"data:\" prefix")

            val unprefixedHeader = normedHeader.substring(PREFIX.length)
            val useBase64        = unprefixedHeader.endsWith(BASE64_SUFFIX)
            val mimeType         = decodeMimeType(
                if (useBase64)
                    unprefixedHeader.substring(0, unprefixedHeader.length - BASE64_SUFFIX.length)
                else
                    unprefixedHeader
            )

            return Header(mimeType, useBase64)
        }

        private fun decodeMimeType(mimeType: String): MimeType {
            val parameters      = mimeType.split(";")
            val typeAndSubtype  = parameters[0].split("/")
            val (type, subtype) = if (typeAndSubtype.size != 2)
                Pair(DEFAULT_MIME_TYPE.type, DEFAULT_MIME_TYPE.subtype)
            else
                Pair(typeAndSubtype[0], typeAndSubtype[1])
            var charset         = DEFAULT_MIME_TYPE.charset!!

            for (i in 1..<parameters.size) {
                val parameter = parameters[i]

                if (!parameter.startsWith(CHARSET_PARAMETER_PREFIX))
                    continue

                val charsetName = parameter.substring(CHARSET_PARAMETER_PREFIX.length)

                try {
                    charset = Charset.forName(charsetName)
                } catch (_: Exception) {}
            }

            return MimeType(type, subtype, charset)
        }

        private class Header(
            val mimeType:  MimeType,
            val useBase64: Boolean,
        )

        private fun decodeBase64Body(body: String): ByteArray =
            try {
                Base64.getDecoder().decode(body)
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
        var result = "data:"

        if (!mimeType.type.equals("text", ignoreCase = true) ||
            !mimeType.subtype.equals("plain", ignoreCase = true))
            result += "${mimeType.type}/${mimeType.subtype}"

        if (mimeType.charset != StandardCharsets.US_ASCII)
            result += ";charset=${mimeType.charset}"

        if (data.isNotEmpty()) {
            val encoder     = Base64.getEncoder()
            val encodedData = encoder.encodeToString(data)

            result += ";base64,$encodedData"
        }

        return result
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