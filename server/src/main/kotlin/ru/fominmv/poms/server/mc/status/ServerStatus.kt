package ru.fominmv.poms.server.mc.status

import java.awt.Image

import kotlin.time.Duration

class ServerStatus (
    val version:     Version      = Version(),
    val players:     List<Player> = emptyList(),
    val maxPlayers:  UInt         = 10u,
    val description: String       = "",
    val icon:        Image?       = null,
    val ping:        Duration     = Duration.ZERO,
)