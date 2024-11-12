package ru.fominmv.poms.server.model.embedabbles

import jakarta.persistence.*

import kotlin.math.sqrt

@Embeddable
@MappedSuperclass
data class Vector3(
    @Column(nullable = false)
    var x: Double = 0.0,

    @Column(nullable = false)
    var y: Double = 0.0,

    @Column(nullable = false)
    var z: Double = 0.0,
) {
    fun zero(): Vector3 =
        apply { 0.0 }

    fun negate(): Vector3 =
        apply { xyz -> -xyz }

    fun normalize(): Vector3 =
        length.let { length ->
            apply { xyz ->
                xyz / length
            }
        }

    fun normalized(): Vector3 =
        length.let { length ->
            map { xyz ->
                xyz / length
            }
        }

    fun map(map: (component: Double) -> Double): Vector3 =
        Vector3(
            x = map(x),
            y = map(y),
            z = map(z),
        )

    fun apply(apply: (component: Double) -> Double): Vector3 {
        x = apply(x)
        y = apply(y)
        z = apply(z)

        return this
    }

    val length: Double
        get() = sqrt(x*x + y*y + z*z)
}
