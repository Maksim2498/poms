package ru.fominmv.poms.server.model.embedabbles

import org.hibernate.annotations.ColumnDefault

import ru.fominmv.poms.libs.mc.commons.enums.OpLevel

import jakarta.persistence.*

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
    var canManageRights: Boolean = false,

    @ColumnDefault("'OWNER'")
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    var opLevel: OpLevel = OpLevel.ALL,
) {
    companion object {
        fun full(): UserRights =
            UserRights(
                users = CrudRights.full(),
                invites = CrudRights.full(),
                servers = CrudRights.full(),
                canManageRights = true,
                opLevel = OpLevel.OWNER,
            )
    }
}
