package ru.fominmv.poms.server.services.cleanup

import org.slf4j.LoggerFactory

import ru.fominmv.poms.server.model.interfaces.immutable.Expirable
import ru.fominmv.poms.server.services.model.accessors.expirable.ExpirableState
import ru.fominmv.poms.server.services.model.accessors.expirable.bulk.BulkExpirableValueAccessor

open class LoggingCleanUpService(
    private val accessor: BulkExpirableValueAccessor<*>,
    private val targetTypeSingular: String,
    private val targetTypePlural: String,
) : CleanUpService {
    companion object {
        inline operator fun <reified T : Expirable> invoke(
            expiredBulkAccessor: BulkExpirableValueAccessor<*>,
            targetTypeSingular: String = T::class.simpleName.orEmpty().ifBlank { "object" },
            targetTypePlural: String = "${targetTypeSingular}s",
        ): LoggingCleanUpService =
            LoggingCleanUpService(expiredBulkAccessor, targetTypeSingular, targetTypePlural)
    }

    protected val logger = LoggerFactory.getLogger(javaClass)!!

    override fun cleanUp(): Long {
        logger.debug("Deleting expired $targetTypePlural...")

        val deleted = accessor.deleteAll(ExpirableState.EXPIRED)
        val message = when (deleted) {
            0L -> "No expired $targetTypePlural found"
            1L -> "Deleted 1 expired $targetTypeSingular"
            else -> "Deleted $deleted expired $targetTypePlural"
        }

        logger.debug(message)

        return deleted
    }
}
