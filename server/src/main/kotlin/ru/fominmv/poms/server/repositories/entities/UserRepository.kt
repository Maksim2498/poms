package ru.fominmv.poms.server.repositories.entities

import org.springframework.stereotype.Repository

import ru.fominmv.poms.server.model.entities.User
import ru.fominmv.poms.server.repositories.base.*

import java.util.*

@Repository
interface UserRepository:
    EntityManagementRepository<User>,
    EntityRepository<User, UUID>,
    LoginRepository<User>
