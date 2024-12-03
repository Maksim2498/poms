package ru.fominmv.poms.server.model.interfaces.immutable

interface Named<T : String?> {
    val name: T
}
