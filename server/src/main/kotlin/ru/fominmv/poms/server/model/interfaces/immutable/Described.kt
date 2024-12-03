package ru.fominmv.poms.server.model.interfaces.immutable

interface Described<T : String?> : Named<T> {
    val description: T
}
