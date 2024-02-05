package ru.fominmv.poms.server.controller

import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

import ru.fominmv.poms.server.mc.status.ServerStatus

@RestController
@RequestMapping("server")
class ServerController {
    @RequestMapping("/status")
    fun getStatus(): ServerStatus =
        ServerStatus()
}