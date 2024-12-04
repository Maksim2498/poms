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
    var canManagerRights: Boolean = false,

    @Column(nullable = false)
    @ColumnDefault("'OWNER'")
    @Enumerated(EnumType.STRING)
    var opLevel: OpLevel = OpLevel.ALL,
) {
    companion object {
        fun full(): UserRights =
            UserRights(
                users = CrudRights.full(),
                invites = CrudRights.full(),
                servers = CrudRights.full(),
                canManagerRights = true,
                opLevel = OpLevel.OWNER,
            )
    }
}
