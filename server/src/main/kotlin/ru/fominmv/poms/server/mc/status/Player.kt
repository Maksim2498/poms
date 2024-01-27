package ru.fominmv.poms.server.mc.status

import java.util.UUID

data class Player(
    val name: String,
    val id:   UUID,
)