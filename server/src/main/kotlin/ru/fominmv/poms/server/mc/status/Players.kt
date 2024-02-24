package ru.fominmv.poms.server.mc.status

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
class Players(
    val online: Int           = 0,
    val max:    Int           = 10,
    val sample: List<Player>? = null,
) {
    init {
        if (online < 0)
            throw IllegalArgumentException("<online> must be non-negative")

        if (max < 0)
            throw IllegalArgumentException("<max> must be non-negative")
    }
}
