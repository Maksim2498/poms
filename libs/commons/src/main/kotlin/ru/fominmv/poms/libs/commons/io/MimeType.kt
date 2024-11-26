package ru.fominmv.poms.libs.commons.io

import ru.fominmv.poms.libs.commons.text.strings.builders.ext.toStringAndClear
import ru.fominmv.poms.libs.commons.text.strings.ext.*

import java.nio.charset.Charset
import java.nio.charset.StandardCharsets
import java.util.*

class MimeType(
    type: String = DEFAULT_TYPE,
    subtype: String = DEFAULT_SUBTYPE,
    parameters: Map<String, String> = emptyMap(),

    normalize: Boolean = true,
    validate: Boolean = true,
) {
    // Secondary constructors

    constructor(
        type: String,
        subtype: String,

        charset: Charset = DEFAULT_CHARSET,
        base64: Boolean = false,
        extraParameters: Map<String, String> = emptyMap(),

        normalize: Boolean = true,
        validate: Boolean = true,
    ) : this(
        type, subtype,

        extraParameters + listOfNotNull(
            Parameter.CHARSET to charset.toString(),
            if (base64) Parameter.BASE64 to "" else null,
        ),

        normalize, validate,
    )

    // Fields

    var type: String
        private set

    var subtype: String
        private set

    var parameters: Map<String, String>
        private set

    // Normalization and validation

    init {
        if (normalize) {
            this.type = type.trim().lowercase()
            this.subtype = subtype.trim().lowercase()
            this.parameters = buildMap {
                for ((key, value) in parameters)
                    set(key.trim().lowercase(), value)

                val charsetName = get(Parameter.CHARSET)
                val charset = if (charsetName != null)
                    Charset.forName(charsetName, DEFAULT_CHARSET)
                else
                    DEFAULT_CHARSET

                set(Parameter.CHARSET, charset.toString())
            }
        } else {
            this.type = type
            this.subtype = subtype
            this.parameters = parameters
        }

        if (validate) {
            require(this.type.isValidMimeKey) {
                "Invalid type: ${this.type.declaration()}"
            }

            require(this.subtype.isValidMimeKey) {
                "Invalid subtype: ${this.subtype.declaration()}"
            }

            for ((key, value) in this.parameters) {
                require(key.isValidMimeKey) {
                    "Invalid parameter key: ${key.declaration()}"
                }

                require(value.isHttpQuotedStringToken) {
                    "Invalid parameter value: ${value.declaration()}"
                }
            }
        }
    }

    // Shortcut properties

    val essence: String by lazy {
        "${this.type}/${this.subtype}"
    }

    val unsuffixedSubtype: String by lazy {
        this.subtype.substringBefore('+')
    }

    val subtypeSuffixes: List<String> by lazy {
        this.subtype.split('+').drop(1)
    }

    val charset: Charset by lazy {
        val charsetName = parameters[Parameter.CHARSET]

        if (charsetName != null)
            Charset.forName(charsetName, DEFAULT_CHARSET)
        else
            DEFAULT_CHARSET
    }

    // Companion

    companion object {
        // Constants

        // - Types

        object TypeObject {
            const val APPLICATION = "application"
            const val AUDIO = "audio"
            const val IMAGE = "image"
            const val MESSAGE = "message"
            const val MULTIPART = "multipart"
            const val TEXT = "text"
            const val VIDO = "video"
            const val FONT = "font"
            const val EXAMPLE = "example"
            const val MODEL = "model"
            const val HAPTICS = "haptics"

            object Unofficial {
                const val CHEMICAL = "chemical"
                const val INODE = "inode"
                const val X_CONTENT = "x-content"
                const val PACKAGE = "package"
                const val X_OFFICE = "x-office"
            }
        }

        val Type = TypeObject

        // - Parameters

        object ParameterObject {
            const val CHARSET = "charset"
            const val BASE64 = "base64"
        }

        val Parameter = ParameterObject

        // - Components

        const val DEFAULT_TYPE = TypeObject.TEXT
        const val DEFAULT_SUBTYPE = "plain"
        const val DEFAULT_ESSENCE = "$DEFAULT_TYPE/$DEFAULT_SUBTYPE"

        val DEFAULT_CHARSET = StandardCharsets.US_ASCII

        // - MimeTypes

        val TEXT_PLAIN = MimeType()

        // Parsing

        // See /libs/commons/docs/fsa/MimeType.svg
        // for FSA reference

        fun parse(
            mimeType: String,
            allowEmpty: Boolean = false,
            defaultType: String = DEFAULT_TYPE,
            defaultSubtype: String = DEFAULT_SUBTYPE,
        ): MimeType {
            var state = ParsingState.TYPE

            var type = ""
            var subtype = ""
            var lastParameterKey = ""
            val parameters = mutableMapOf<String, String>()

            val token = StringBuilder()

            for (char in mimeType)
                when (state) {
                    ParsingState.TYPE -> when (char) {
                        '/' -> {
                            type = token.toStringAndClear()
                            state = ParsingState.SUBTYPE
                        }

                        ';' -> {
                            require(allowEmpty) { "Missing '/'" }
                            type = token.toStringAndClear()
                            state = ParsingState.PARAMETER_KEY
                        }

                        else -> { token.append(char) }
                    }

                    ParsingState.SUBTYPE -> when (char) {
                        ';' -> {
                            subtype = token.toStringAndClear()
                            state = ParsingState.PARAMETER_KEY
                        }

                        else -> { token.append(char) }
                    }

                    ParsingState.PARAMETER_KEY -> when (char) {
                        '=' -> {
                            lastParameterKey = token.toStringAndClear()
                            state = ParsingState.PARAMETER_VALUE_START
                        }

                        ';' -> { parameters[token.toStringAndClear()] = "" }

                        else -> { token.append(char) }
                    }

                    ParsingState.PARAMETER_VALUE_START -> when (char) {
                        '"' -> {
                            state = ParsingState.PARAMETER_QUOTED_VALUE
                        }

                        ';' -> {
                            parameters[lastParameterKey] = ""
                            state = ParsingState.PARAMETER_KEY
                        }

                        else -> {
                            token.append(char)
                            state = ParsingState.PARAMETER_VALUE
                        }
                    }

                    ParsingState.PARAMETER_VALUE -> when (char) {
                        ';' -> {
                            parameters[lastParameterKey] = token.toStringAndClear()
                            state = ParsingState.PARAMETER_KEY
                        }

                        else -> { token.append(char) }
                    }

                    ParsingState.PARAMETER_QUOTED_VALUE -> when (char) {
                        '\\' -> { state = ParsingState.PARAMETER_QUOTED_VALUE_ESCAPE }

                        '"' -> {
                            parameters[lastParameterKey] = token.toStringAndClear()
                            state = ParsingState.PARAMETER_QUOTED_VALUE_END
                        }

                        else -> { token.append(char) }
                    }

                    ParsingState.PARAMETER_QUOTED_VALUE_ESCAPE -> {
                        token.append(char)
                        state = ParsingState.PARAMETER_QUOTED_VALUE
                    }

                    ParsingState.PARAMETER_QUOTED_VALUE_END -> when (char) {
                        ';' -> { state = ParsingState.PARAMETER_KEY }
                        else -> {}
                    }
                }

            when (state) {
                ParsingState.TYPE -> {
                    if (!allowEmpty)
                        throw IllegalArgumentException("Missing '/'")
                }

                ParsingState.SUBTYPE -> { subtype = token.toStringAndClear() }

                ParsingState.PARAMETER_KEY -> {
                    val key = token.toStringAndClear()

                    if (key.isNotBlank())
                        parameters[key] = ""
                }

                ParsingState.PARAMETER_VALUE_START -> { parameters[lastParameterKey] = "" }
                ParsingState.PARAMETER_VALUE -> { parameters[lastParameterKey] = token.toStringAndClear() }

                ParsingState.PARAMETER_QUOTED_VALUE,
                ParsingState.PARAMETER_QUOTED_VALUE_ESCAPE -> throw IllegalArgumentException("Missing '\"'")

                ParsingState.PARAMETER_QUOTED_VALUE_END -> {}
            }

            if (allowEmpty) {
                if (type.isBlank())
                    type = defaultType

                if (subtype.isBlank())
                    subtype = defaultSubtype
            }

            return MimeType(type, subtype, parameters)
        }

        private enum class ParsingState {
            TYPE,
            SUBTYPE,

            PARAMETER_KEY,
            PARAMETER_VALUE_START,
            PARAMETER_VALUE,
            PARAMETER_QUOTED_VALUE,
            PARAMETER_QUOTED_VALUE_ESCAPE,
            PARAMETER_QUOTED_VALUE_END,
        }
    }

    // Destructuring

    operator fun component1(): String =
        type

    operator fun component2(): String =
        subtype

    operator fun component3(): Map<String, String> =
        parameters

    // Copying

    fun withType(type: String): MimeType =
        copy(type = type)

    fun withSubtype(subtype: String): MimeType =
        copy(subtype = subtype)

    fun withCharset(charset: Charset): MimeType =
        withParametersAdded(Parameter.CHARSET to charset.toString())

    fun withBase64(base64: Boolean): MimeType =
        if (base64)
            withParametersAdded(Parameter.BASE64 to "")
        else
            withParametersRemoved(Parameter.BASE64)

    fun withParameters(parameters: Map<String, String>): MimeType =
        copy(parameters = parameters)

    fun withParametersAdded(vararg newParameters: Pair<String, String>): MimeType =
        copy(parameters = parameters + newParameters)

    fun withParametersRemoved(vararg parametersToRemove: String): MimeType =
        copy(parameters = parameters.filterKeys { it !in parametersToRemove })

    fun copy(
        type: String = this.type,
        subtype: String = this.subtype,
        parameters: Map<String, String> = this.parameters,

        normalize: Boolean = true,
        validate: Boolean = true,
    ): MimeType =
        MimeType(type, subtype, parameters, normalize, validate)

    // Equality check

    override fun equals(other: Any?): Boolean {
        if (this === other)
            return true

        if (javaClass != other?.javaClass)
            return false

        other as MimeType

        return type == other.type &&
               subtype == other.subtype &&
               parameters == other.parameters
    }

    override fun hashCode(): Int =
        Objects.hash(type, subtype, parameters)

    // To string conversion

    override fun toString(): String =
        toString(
            showEmptyParameterValuesAsFlags = true,
            showDefaultCharset = false,
        )

    fun toString(
        showEmptyParameterValuesAsFlags: Boolean,
        showDefaultCharset: Boolean,
    ): String =
        buildString {
            append(essence)

            if (parameters.isEmpty())
                return@buildString

            for ((key, value) in parameters) {
                if (!showDefaultCharset &&
                    key == Parameter.CHARSET &&
                    value == DEFAULT_CHARSET.toString())
                    continue

                append(';')
                append(key)

                if (showEmptyParameterValuesAsFlags && value.isEmpty())
                    continue

                append('=')

                if (value.isHttpToken) {
                    append(value)
                    continue
                }

                val escapedValue = "\"${
                    value
                        .replace("\\", "\\")
                        .replace("\"", "\\\"")
                }\""

                append(escapedValue)
            }
        }

    // Util

    private val String.isValidMimeKey: Boolean
        get() = isNotEmpty() && isHttpToken
}
