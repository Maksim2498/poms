package ru.fominmv.poms.server.model.embedabbles

import jakarta.persistence.*

@Embeddable
@MappedSuperclass
class Vector3(
    @Column(nullable = false)
    var x: Float = 0f,

    @Column(nullable = false)
    var y: Float = 0f,

    @Column(nullable = false)
    var z: Float = 0f,
)
