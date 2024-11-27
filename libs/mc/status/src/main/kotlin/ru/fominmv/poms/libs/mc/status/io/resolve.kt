package ru.fominmv.poms.libs.mc.status.io

import org.xbill.DNS.lookup.LookupSession
import org.xbill.DNS.*

import ru.fominmv.poms.libs.commons.text.strings.ext.*

import java.net.InetSocketAddress

fun resolveAddress(address: String): InetSocketAddress {
    address.toIp4SocketAddressOrNull()?.let { return it }

    if (':' in address)
        return address.toDomainNameSocketAddress()

    val inetAddress = address.toDomainNameAddress()

    val port = try {
        resolvePort(inetAddress.hostName)
    } catch (_: Exception) {
        DEFAULT_PORT
    }

    return InetSocketAddress(inetAddress, port.toInt())
}

fun resolvePort(hostname: String): UShort {
    val lookupSession = LookupSession.defaultBuilder().build()
    val lookup = Name.fromString("_minecraft._tcp.$hostname")
    val records = lookupSession.lookupAsync(lookup, Type.SRV)
        .toCompletableFuture()
        .get()
        .records
        .map { it as SRVRecord }

    val minRecordPriority = records.minOfOrNull(SRVRecord::getPriority) ?: DEFAULT_PORT
    val preferredRecord = records
        .filter { it.priority == minRecordPriority }
        .maxBy(SRVRecord::getWeight)

    return preferredRecord.port.toUShort()
}
