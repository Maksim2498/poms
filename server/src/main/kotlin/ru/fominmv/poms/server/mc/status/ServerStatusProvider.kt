package ru.fominmv.poms.server.mc.status

interface ServerStatusProvider {
    val serverStatus: ServerStatus
}