package ru.fominmv.poms.libs.mc.commands.args

data class StringArg(
    val minLength: Int = 0,
    val maxLength: Int = Int.MAX_VALUE,

    val regex: Regex? = null,
) : Arg<String> {
    init {
        require(minLength >= 0) { "minLength < 0" }
        require(maxLength >= minLength) { "maxLength < minLength" }
    }

    override fun matches(arg: String): Boolean =
        arg.length in minLength..maxLength &&
        regex?.matches(arg) ?: true

    override fun tryProcess(arg: String): String? =
        if (matches(arg))
            arg
        else
            null
}
