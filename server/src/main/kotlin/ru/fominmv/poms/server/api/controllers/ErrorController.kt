package ru.fominmv.poms.server.api.controllers

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.RequestMethod.*
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

import ru.fominmv.poms.server.api.PathAware

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.RequestDispatcher

@RestController
class ErrorController : PathAware {
    companion object {
        const val PATH = "/error"
    }

    override val path: String
        get() = PATH

    @RequestMapping(
        path = [PATH],
        method = [GET, PUT, HEAD, POST, DELETE, OPTIONS, PATCH, TRACE],
    )
    fun handleError(request: HttpServletRequest): ResponseEntity<String> {
        try {
            val originalUri = request.getAttribute(RequestDispatcher.FORWARD_REQUEST_URI)

            // Endpoint is only available via forward
            if (originalUri == PATH)
                return ResponseEntity.notFound().build()

            val defaultStatus = HttpStatus.INTERNAL_SERVER_ERROR

            val statusCode = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE) as? Int
                ?: defaultStatus.value()

            val errorMessage = request.getAttribute(RequestDispatcher.ERROR_MESSAGE) as? String
                ?: HttpStatus.resolve(statusCode)?.reasonPhrase
                ?: defaultStatus.reasonPhrase

            return ResponseEntity
                .status(statusCode)
                .body(errorMessage)
        } catch (exception: Exception) {
            return ResponseEntity
                .internalServerError()
                .build()
        }
    }
}
