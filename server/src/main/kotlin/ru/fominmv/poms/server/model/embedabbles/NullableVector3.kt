package ru.fominmv.poms.server.model.embedabbles

import jakarta.persistence.*

@Embeddable
@AttributeOverrides(
    AttributeOverride(name = "x", column = Column()),
    AttributeOverride(name = "y", column = Column()),
    AttributeOverride(name = "z", column = Column()),
)
class NullableVector3(
    x: Double = 0.0,
    y: Double = 0.0,
    z: Double = 0.0,
) : Vector3(x, y, z)
