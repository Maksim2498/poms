package ru.fominmv.poms.server.model.interfaces.immutable

interface WithCredentials {
    val login: String
    val password: String
}
