package ru.fominmv.poms.libs.mc.commands.args

data class LiteralSetArg(val literals: Set<String> = emptySet()) : AbstractStringSetArg() {
    override val strings: Set<String>
        get() = literals
}
