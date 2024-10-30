package ru.fominmv.poms.libs.commons.iterable.ext

fun <T> Iterable<T>.anyForEach(predicate: (element: T) -> Boolean): Boolean {
    var matched = false

    for (element in this)
        if (predicate(element))
            matched = true

    return matched
}
