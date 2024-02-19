package ru.fominmv.poms.server.mc.status

data class Version(
    val name:     String = DEFAULT_NAME,
    val protocol: Int    = DEFAULT_PROTOCOL,
) {
    companion object {
        const val DEFAULT_NAME     = "<unknown>"
        const val DEFAULT_PROTOCOL = -1
    }
}