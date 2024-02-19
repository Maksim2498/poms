package ru.fominmv.poms.server.mc.status.io

import org.xbill.DNS.Name
import org.xbill.DNS.SRVRecord
import org.xbill.DNS.Type
import org.xbill.DNS.lookup.LookupSession

import ru.fominmv.poms.server.util.text.stringext.toInetSocketAddress

import java.net.InetSocketAddress

fun resolveServerAddress(address: String): InetSocketAddress {
    val socketAddress = address.toInetSocketAddress(
        defaultPort = DEFAULT_SERVER_PORT,
        resolve     = false,
    )

    if (socketAddress.address != null)
        return socketAddress

    val port = if (':' in address)
        socketAddress.port
    else
        resolveServerPort(socketAddress.hostName).toInt()

    return InetSocketAddress(socketAddress.hostName, port)
}

fun resolveServerPort(hostName: String): UShort {
    try {
        val lookupSession = LookupSession.defaultBuilder().build()
        val lookup = Name.fromString("_minecraft._tcp.$hostName")
        val records = lookupSession.lookupAsync(lookup, Type.SRV)
            .toCompletableFuture()
            .get()
            .records
            .map { it as SRVRecord }
        val minRecordPriority = records.minOf(SRVRecord::getPriority)
        val preferredRecord = records.filter { it.priority == minRecordPriority }
            .maxBy(SRVRecord::getWeight)

        return preferredRecord.port.toUShort()
    } catch (_: Exception) {
        return DEFAULT_SERVER_PORT
    }
}