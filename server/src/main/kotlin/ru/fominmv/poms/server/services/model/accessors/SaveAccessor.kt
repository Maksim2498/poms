package ru.fominmv.poms.server.services.model.accessors

interface SaveAccessor<T : Any> {
    fun <S : T> save(value: S): S
}
