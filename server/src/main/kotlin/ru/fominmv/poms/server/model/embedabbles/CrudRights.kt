package ru.fominmv.poms.server.model.embedabbles

import org.hibernate.annotations.ColumnDefault

import jakarta.persistence.*

@Embeddable
data class CrudRights(
    @ColumnDefault("FALSE")
    @Column(nullable = false)
    var canCreate: Boolean = false,

    @ColumnDefault("TRUE")
    @Column(nullable = false)
    var canRead: Boolean = true,

    @ColumnDefault("FALSE")
    @Column(nullable = false)
    var canUpdate: Boolean = false,

    @ColumnDefault("FALSE")
    @Column(nullable = false)
    var canDelete: Boolean = false,
) {
    companion object {
        fun full(): CrudRights =
            CrudRights(
                canCreate = true,
                canRead = true,
                canUpdate = true,
                canDelete = true,
            )
    }

    var canNotCreate: Boolean
        get() = !canCreate

        set(value) {
            canCreate = !value
        }

    var canNotRead: Boolean
        get() = !canRead

        set(value) {
            canRead = !value
        }

    var canNotUpdate: Boolean
        get() = !canUpdate

        set(value) {
            canUpdate = !value
        }

    var canNotDelete: Boolean
        get() = !canDelete

        set(value) {
            canDelete = !value
        }
}
