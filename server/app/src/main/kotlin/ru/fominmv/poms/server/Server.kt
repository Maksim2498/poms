package ru.fominmv.poms.server

class Server {
    val greeting: String
        get() {
            return "Hello, World!"
        }
}

fun main() {
    val app = Server()

    println(app.greeting)
}
