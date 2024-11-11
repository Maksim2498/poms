package ru.fominmv.poms.libs.mc.commands.args.parsing

import ru.fominmv.poms.libs.commons.strings.builders.ext.toStringAndClear
import ru.fominmv.poms.libs.mc.commands.args.*

class DefaultArgListParser : ArgListParser {
    companion object {
        private fun parseOptionalClosedRange(
            rawRange: String,

            defaultMin: Int = Int.MIN_VALUE,
            defaultMax: Int = Int.MAX_VALUE
        ): ClosedRange<Int> {
            val splittedRawRange = rawRange.split(",").map(String::trim)

            return when (splittedRawRange.size) {
                1 -> {
                    val rawMin = splittedRawRange[0]
                    val min = if (rawMin.isBlank())
                        defaultMin
                    else
                        rawMin.toInt()

                    min..defaultMax
                }

                2 -> {
                    val (min, max) = splittedRawRange.map(String::toInt)

                    min..max
                }

                else -> throw IllegalArgumentException("Bad range $rawRange")
            }
        }

        private fun escape(char: Char): Char =
            when (char) {
                'n' -> '\n'
                'r' -> '\r'
                't' -> '\t'
                'b' -> '\b'
                'f' -> '\u000C'

                else -> char
            }
    }

    val argParsersByName: Map<String, ArgParser> = mapOf(
        "s" to ArgParser { options ->
            val range = parseOptionalClosedRange(options, defaultMin = 0)

            StringArg(
                minLength = range.start,
                maxLength = range.endInclusive,
            )
        },

        "i" to ArgParser { options ->
            val range = parseOptionalClosedRange(options)

            IntArg(
                min = range.start,
                max = range.endInclusive,
            )
        },

        "b" to ArgParser { BooleanArg() },
    )

    // See /libs/mc/commands/docs/fsa/DefaultArgListParser.svg
    // for FSA reference

    override fun parse(string: String): List<Arg<*>> =
        buildList {
            var state = State.WAITING
            val token = StringBuilder()
            var argParser: ArgParser? = null

            for (char in string)
                when (state) {
                    State.WAITING -> {
                        state = when {
                            char.isWhitespace() -> State.WAITING
                            char == '\\' -> State.LITERAL_BACKSLASH
                            char == '{' -> State.VALUE

                            else -> {
                                token.append(char)
                                State.LITERAL
                            }
                        }
                    }

                    State.LITERAL -> {
                        state = when {
                            char.isWhitespace() -> {
                                val literal = token.toStringAndClear()
                                val arg = LiteralArg(literal)

                                add(arg)

                                State.WAITING
                            }

                            char == '{' -> {
                                val literal = token.toStringAndClear()
                                val arg = LiteralArg(literal)

                                add(arg)

                                State.VALUE
                            }

                            char == '\\' -> State.LITERAL_BACKSLASH

                            else -> {
                                token.append(char)
                                State.LITERAL
                            }
                        }
                    }

                    State.LITERAL_BACKSLASH -> {
                        token.append(escape(char))
                        state = State.LITERAL
                    }

                    State.VALUE -> {
                        state = when (char) {
                            '}' -> {
                                val localArgParserName = token.toStringAndClear()
                                val localArgParser = getArgParserByName(localArgParserName)
                                val arg = localArgParser.parse("")

                                add(arg)

                                State.WAITING
                            }

                            ':' -> {
                                val argParserName = token.toStringAndClear()

                                argParser = getArgParserByName(argParserName)

                                State.VALUE_OPTION
                            }

                            '\\' -> State.VALUE_BACKSLASH

                            else -> {
                                token.append(char)
                                State.VALUE
                            }
                        }
                    }

                    State.VALUE_BACKSLASH -> {
                        token.append(escape(char))
                        state = State.VALUE
                    }

                    State.VALUE_OPTION -> {
                        state = when (char) {
                            '}' -> {
                                val options = token.toStringAndClear()
                                val arg = argParser?.parse(options)?.also { argParser = null } ?:
                                    throw IllegalStateException("argParser is null")

                                add(arg)

                                State.WAITING
                            }

                            '\\' -> State.VALUE_OPTION_BACKSLASH

                            else -> {
                                token.append(char)
                                State.VALUE_OPTION
                            }
                        }
                    }

                    State.VALUE_OPTION_BACKSLASH -> {
                        token.append(escape(char))
                        state = State.VALUE_OPTION
                    }
                }

            when (state) {
                State.VALUE,
                State.VALUE_BACKSLASH,
                State.VALUE_OPTION,
                State.VALUE_OPTION_BACKSLASH ->
                    throw IllegalArgumentException("Missing '}'")

                State.LITERAL -> {
                    val literal = token.toStringAndClear()
                    val arg = LiteralArg(literal)

                    add(arg)
                }

                State.LITERAL_BACKSLASH -> {
                    token.append('\\')

                    val literal = token.toStringAndClear()
                    val arg = LiteralArg(literal)

                    add(arg)
                }

                State.WAITING -> {}
            }
        }

    private fun getArgParserByName(name: String): ArgParser =
        argParsersByName[name] ?: throw IllegalArgumentException("No ArgParser with name $name")

    private enum class State {
        WAITING,

        LITERAL,
        LITERAL_BACKSLASH,

        VALUE,
        VALUE_BACKSLASH,

        VALUE_OPTION,
        VALUE_OPTION_BACKSLASH,
    }
}
