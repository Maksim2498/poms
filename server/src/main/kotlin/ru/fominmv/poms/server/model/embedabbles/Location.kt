package ru.fominmv.poms.server.model.embedabbles

import jakarta.persistence.*

import java.util.UUID

@Embeddable
data class Location(
    @Embedded
    var coordinates: Vector3 = Vector3(),

    @Column(nullable = false)
    var worldId: UUID = UUID(0, 0),
) {
    val x: Double
        get() = coordinates.x

    val y: Double
        get() = coordinates.y

    val z: Double
        get() = coordinates.z
}
