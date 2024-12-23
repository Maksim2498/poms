package ru.fominmv.poms.server.services.model.cleanup

import org.slf4j.LoggerFactory

import ru.fominmv.poms.libs.commons.text.strings.ext.plural
import ru.fominmv.poms.server.model.interfaces.immutable.Expirable
import ru.fominmv.poms.server.services.model.accessors.expirable.ExpirableState
import ru.fominmv.poms.server.services.model.accessors.expirable.bulk.BulkExpirableValueAccessor

@Suppress("MemberVisibilityCanBePrivate")
open class LoggingCleanupService(
    protected val accessor: BulkExpirableValueAccessor<*>,
    protected val targetTypeSingular: String,
    protected val targetTypePlural: String = targetTypeSingular.plural(),
) : CleanupService {
    companion object {
        inline operator fun <reified T : Expirable> invoke(
            expiredBulkAccessor: BulkExpirableValueAccessor<T>,
            targetTypeSingular: String = T::class.simpleName.orEmpty().ifBlank { DEFAULT_TARGET_TYPE_SINGULAR },
            targetTypePlural: String = targetTypeSingular.plural(),
        ): LoggingCleanupService =
            LoggingCleanupService(expiredBulkAccessor, targetTypeSingular, targetTypePlural)

        const val DEFAULT_TARGET_TYPE_SINGULAR = "object"
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
