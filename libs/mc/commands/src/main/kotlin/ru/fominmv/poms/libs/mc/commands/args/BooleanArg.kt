package ru.fominmv.poms.libs.mc.commands.args

class BooleanArg(
    val trueStrings: Set<String> = setOf("true"),
    val falseStrings: Set<String> = setOf("false"),

    val trim: Boolean = true,
    val ignoreCase: Boolean = true,
) : Arg<Boolean> {
    override fun tryProcess(arg: String): Boolean? {
        var preparedArg = arg

        if (trim)
            preparedArg = preparedArg.trim()

        if (ignoreCase)
            preparedArg = preparedArg.lowercase()

        fun setContainsPreparedArg(set: Set<String>) =
            if (ignoreCase)
                set.any { it.lowercase() == preparedArg }
            else
                set.contains(preparedArg)

        return when {
            setContainsPreparedArg(trueStrings) -> true
            setContainsPreparedArg(falseStrings) -> false

            else -> null
        }
    }
}
