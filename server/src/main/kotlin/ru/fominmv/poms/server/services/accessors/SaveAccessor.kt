package ru.fominmv.poms.server.services.accessors

interface SaveAccessor<T> {
    fun <S : T> save(value: S): S
}
