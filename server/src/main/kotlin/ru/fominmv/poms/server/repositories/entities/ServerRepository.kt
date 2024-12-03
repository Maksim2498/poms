package ru.fominmv.poms.server.repositories.entities

import org.springframework.stereotype.Repository

import ru.fominmv.poms.server.model.entities.Server
import ru.fominmv.poms.server.repositories.base.*

import java.util.UUID

@Repository
interface ServerRepository :
    EntityManagementRepository<Server>,
    EntityRepository<Server, UUID>,
    LoginRepository<Server>

