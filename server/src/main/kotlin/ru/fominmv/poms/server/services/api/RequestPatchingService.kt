package ru.fominmv.poms.server.services.api

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper

import com.github.fge.jsonpatch.JsonPatch

import org.springframework.stereotype.Service

import jakarta.validation.ConstraintViolationException
import jakarta.validation.Validator

@Service
class RequestPatchingService(
    private val objectMapper: ObjectMapper,
    private val validator: Validator,
) {
    fun <T : Any> applyPatch(
        request: T,
        patch: JsonPatch,
        validate: Boolean = true,
    ): T {
        val requestJson = objectMapper.valueToTree<JsonNode>(request)
        val patchedRequestJson = patch.apply(requestJson)
        val patchedRequest = objectMapper.treeToValue(patchedRequestJson, request.javaClass)

        if (validate) {
            val violations = validator.validate(patchedRequest)

            if (violations.isNotEmpty())
                throw ConstraintViolationException(violations)
        }

        return patchedRequest
    }
}
