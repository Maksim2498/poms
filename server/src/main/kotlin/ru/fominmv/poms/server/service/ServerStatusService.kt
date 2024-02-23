package ru.fominmv.poms.server.service

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.mc.status.ServerStatusProvider
import ru.fominmv.poms.server.mc.status.io.NetServerStatusProvider

import kotlin.time.Duration
import kotlin.time.TimeMark
import kotlin.time.TimeSource

@Service
class ServerStatusService : ServerStatusProvider {
    @Value("\${poms.mc.server.address}")
    private lateinit var address: String

    @Value("\${poms.mc.server.status.cache-for}")
    private var cacheFor: Duration? = null

    private val statusProvider by lazy { NetServerStatusProvider(address) }

    private var status:  ServerStatus? = null
    private var lastGet: TimeMark?     = null

    override val serverStatus: ServerStatus
        get() {
            if (useCached)
                return status!!

            status  = statusProvider.serverStatus
            lastGet = TimeSource.Monotonic.markNow()

            return status!!
        }

    private val useCached: Boolean
        get() = status != null
             && (lastGet?.elapsedNow() ?: Duration.ZERO) < cacheFor!!
}