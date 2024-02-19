package ru.fominmv.poms.server.controller

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

import ru.fominmv.poms.server.mc.status.ServerStatus
import ru.fominmv.poms.server.service.ServerStatusService

@RestController
@RequestMapping("server")
class ServerController {
    @Autowired
    lateinit var statusService: ServerStatusService

    @RequestMapping("/status")
    fun getStatus(): ServerStatus =
        statusService.serverStatus
}