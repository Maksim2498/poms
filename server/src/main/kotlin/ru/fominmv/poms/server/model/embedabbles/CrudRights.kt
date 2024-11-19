package ru.fominmv.poms.server.model.embedabbles

import jakarta.persistence.*

@Embeddable
data class CrudRights(
    @Column(nullable = false)
    var canCreate: Boolean = true,

    @Column(nullable = false)
    var canRead: Boolean = true,

    @Column(nullable = false)
    var canUpdate: Boolean = true,

    @Column(nullable = false)
    var canDelete: Boolean = true,
) {
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
