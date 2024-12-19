package ru.fominmv.poms.libs.commons.text.strings.objs

@MustBeDocumented
@Target(AnnotationTarget.FIELD)
annotation class Secret(val censor: String = DEFAULT_CENSOR) {
    companion object {
        // Constants

        const val DEFAULT_CENSOR = "[PROTECTED]"

        // Formatting

        fun format(secret: Any?, censor: String = DEFAULT_CENSOR): String =
            Formatter(secret, censor = censor).toString()

        // Exposition control

        @Volatile
        var isGloballyExposed = false

        private val exposedStack = ThreadLocal.withInitial { mutableListOf<Boolean>() }

        val isLocallyExposed: Boolean
            get() = exposedStack.get().lastOrNull() ?: isGloballyExposed

        fun expose(exposedBlock: () -> Unit) =
            setExposed(true, exposedBlock)

        fun hide(hiddenBlock: () -> Unit) =
            setExposed(false, hiddenBlock)

        fun setExposed(exposed: Boolean, block: () -> Unit) {
            exposedStack.get().addLast(exposed)
            block()
            exposedStack.get().removeLast()
        }
    }

    // Formatter

    class Formatter<T>(
        val secret: T,
        val expose: () -> Boolean = { isLocallyExposed },
        val censor: String = DEFAULT_CENSOR,
    ) {
        constructor(secret: T, expose: Boolean, censor: String = DEFAULT_CENSOR) : this(secret, { expose }, censor)

        override fun toString(): String =
            if (expose())
                secret.toString()
            else
                censor
    }
}

fun Secret?.formatNullable(secret: Any?): String =
    this?.format(secret) ?: secret.toString()

fun Secret.format(secret: Any?): String =
    Secret.format(secret, censor)
