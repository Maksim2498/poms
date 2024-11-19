package ru.fominmv.poms.server.model.embedabbles

import jakarta.persistence.*

@Embeddable
data class UserRights(
    @Embedded
    var users: CrudRights = CrudRights(),

    @Embedded
    var invites: CrudRights = CrudRights(),

    @Embedded
    var servers: CrudRights = CrudRights(),
)
