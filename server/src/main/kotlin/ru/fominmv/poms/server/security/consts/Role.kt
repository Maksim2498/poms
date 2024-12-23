package ru.fominmv.poms.server.security.consts

object Role {
    const val PREFIX = "ROLE_"

    const val ANONYMOUS = "ANONYMOUS"
    const val PREFIXED_ANONYMOUS = PREFIX + ANONYMOUS

    const val USER = "USER"
    const val PREFIXED_USER = PREFIX + USER

    const val SERVER = "SERVER"
    const val PREFIXED_SERVER = PREFIX + SERVER
}
