package ru.fominmv.poms.server.mc.status

data class Version(
    val name:     String = "<unknown>",
    val protocol: Int    = -1,
)