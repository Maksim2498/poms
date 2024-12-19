package ru.fominmv.poms.server.repositories.entities

import org.springframework.stereotype.Repository

import ru.fominmv.poms.server.model.entities.AvatarStateGroup
import ru.fominmv.poms.server.repositories.base.*

import java.util.UUID

@Repository
interface AvatarStateGroupRepository :
    EntityManagementRepository<AvatarStateGroup>,
    EntityRepository<AvatarStateGroup, UUID>,
    ByReferenceAccessRepository<AvatarStateGroup, UUID>

