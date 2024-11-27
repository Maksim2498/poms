package ru.fominmv.poms.libs.mc.status

import com.fasterxml.jackson.annotation.JsonInclude

@JsonInclude(JsonInclude.Include.NON_NULL)
data class PlayerList(
    val online: Int = 0,
    val max: Int = 10,
    val sample: List<Player>? = null,
) {
    init {
        require(online >= 0) { "online is negative" }
        require(max >= 0) { "max is negative" }
    }
}
