package ru.fominmv.poms.server.util.hibernate

import org.hibernate.boot.model.naming.*
import org.hibernate.boot.model.source.spi.AttributePath

import ru.fominmv.poms.libs.commons.text.strings.ext.withFirstLowercase

class CustomImplicitNamingStrategy(
    private val ignoredAttributePathPartPrefixes: Set<String> = setOf("internal"),
    private val listIndexColumnName: String = "order",
) : ImplicitNamingStrategyJpaCompliantImpl() {
    override fun determineForeignKeyName(source: ImplicitForeignKeyNameSource): Identifier {
        val from = source.tableName.text
        val to = source.referencedTableName.text
        val by = source.columnNames.joinToString("_AND_") { it.text }

        return Identifier.toIdentifier("FK_${from}_TO_${to}_BY_${by}")
    }

    override fun determineUniqueKeyName(source: ImplicitUniqueKeyNameSource): Identifier {
        val from = source.tableName.text
        val by = source.columnNames.joinToString("_AND_") { it.text }

        return Identifier.toIdentifier("U_${from}_BY_${by}")
    }

    override fun determineJoinTableName(source: ImplicitJoinTableNameSource): Identifier =
        Identifier.toIdentifier(
            transformAttributePath(
                source.owningEntityNaming.entityName.split(".").last() +
                "." +
                source.associationOwningAttributePath
            )
        )

    override fun determineListIndexColumnName(source: ImplicitIndexColumnNameSource): Identifier =
        Identifier.toIdentifier(listIndexColumnName)

    override fun transformAttributePath(attributePath: AttributePath): String =
        transformAttributePath(attributePath.fullPath)

    private fun transformAttributePath(fullPath: String): String =
        fullPath
            .split('.')
            .map { part ->
                ignoredAttributePathPartPrefixes.forEach { prefix ->
                    if (part.startsWith(prefix))
                        return@map part.substring(prefix.length).withFirstLowercase()
                }

                return@map part
            }
            .joinToString(".")
}
