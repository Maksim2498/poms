package ru.fominmv.poms.libs.mc.commands.args

class IntArg(
    val min: Int = Int.MIN_VALUE,
    val max: Int = Int.MAX_VALUE,
) : Arg<Int> {
    init {
        require(min <= max) { "min > max" }
    }

    override fun tryProcess(arg: String): Int? =
        arg.toIntOrNull()?.let {
            if (it in min..max)
                it
            else
                null
        }
}
