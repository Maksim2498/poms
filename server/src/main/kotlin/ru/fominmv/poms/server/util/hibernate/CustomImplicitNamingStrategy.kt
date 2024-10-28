package ru.fominmv.poms.server.util.hibernate

import org.hibernate.boot.model.naming.*
import org.hibernate.boot.model.source.spi.AttributePath

import ru.fominmv.poms.server.util.string.ext.firstLower

class CustomImplicitNamingStrategy(
    private val ignoredAttributePathPartPrefixes: Set<String> = setOf("internal"),
    private val listIndexColumnName: String = "order",
) : ImplicitNamingStrategyJpaCompliantImpl() {
    override fun determineListIndexColumnName(source: ImplicitIndexColumnNameSource): Identifier =
        Identifier.toIdentifier(listIndexColumnName)

    override fun transformAttributePath(attributePath: AttributePath): String =
        attributePath.fullPath
            .split('.')
            .map { part ->
                ignoredAttributePathPartPrefixes.forEach { prefix ->
                    if (part.startsWith(prefix))
                        return@map part.substring(prefix.length).firstLower()
                }

                return@map part
            }
            .joinToString(".")
}
