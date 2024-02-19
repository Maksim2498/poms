package ru.fominmv.poms.server.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider
import ru.fominmv.poms.server.mc.status.io.NetServerStatusProvider

@Service
class ServerStatusService : ServerStatusProvider {
    @Value("\${poms.mc.server.address}")
    private lateinit var address: String

    private val provider by lazy { NetServerStatusProvider(address) }

    override val serverStatus: ServerStatus
        get() = provider.serverStatus
}