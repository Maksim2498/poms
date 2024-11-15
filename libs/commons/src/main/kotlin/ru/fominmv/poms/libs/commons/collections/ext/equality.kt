package ru.fominmv.poms.libs.commons.collections.ext

fun Collection<*>.equalsIgnoringOrder(other: Any?): Boolean {
    if (other === this)
        return true

    if (other !is Collection<*>)
        return false

    @Suppress("TYPE_MISMATCH_WARNING_FOR_INCORRECT_CAPTURE_APPROXIMATION")
    return containsAll(other) && other.containsAll(this)
}
