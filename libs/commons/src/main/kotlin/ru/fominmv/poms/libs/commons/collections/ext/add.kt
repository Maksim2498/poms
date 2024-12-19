package ru.fominmv.poms.libs.commons.collections.ext

fun <T> MutableCollection<T>.addAllOnlyIfNeeded(elements: Iterable<T>): Boolean {
    val elementsCollection = if (elements is Collection<T>)
        elements
    else
        elements.toList()

    return elementsCollection.isNotEmpty() && addAll(elementsCollection)
}
