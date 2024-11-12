package ru.fominmv.poms.server.model.embedabbles

import jakarta.persistence.*

@Embeddable
@AttributeOverrides(
    AttributeOverride(name = "x", column = Column()),
    AttributeOverride(name = "y", column = Column()),
    AttributeOverride(name = "z", column = Column()),
)
class NullableVector3(
    x: Float = 0f,
    y: Float = 0f,
    z: Float = 0f,
) : Vector3(x, y, z)
