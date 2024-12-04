package ru.fominmv.poms.server.model.embedabbles

import jakarta.persistence.*
import org.hibernate.annotations.ColumnDefault

@Embeddable
data class UserRights(
    @Embedded
    var users: CrudRights = CrudRights(),

    @Embedded
    var invites: CrudRights = CrudRights(),

    @Embedded
    var servers: CrudRights = CrudRights(),

    @ColumnDefault("FALSE")
    @Column(nullable = false)
    var canManagerRights: Boolean = false,
) {
    companion object {
        fun full(): UserRights =
            UserRights(
                users = CrudRights.full(),
                invites = CrudRights.full(),
                servers = CrudRights.full(),
                canManagerRights = true,
            )
    }
}
