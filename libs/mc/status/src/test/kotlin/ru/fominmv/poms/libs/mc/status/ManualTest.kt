package ru.fominmv.poms.libs.mc.status

import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer

import ru.fominmv.poms.libs.commons.text.strings.ext.declaration
import ru.fominmv.poms.libs.mc.status.io.NetStatusProvider

import java.awt.event.*
import java.awt.*

import javax.swing.BoxLayout

class ManualTest : Frame("Manual Server Status Test") {
    private var address: String = "mc.hypixel.net"

    private var status: Status? = null
    private var isStatusUpdating: Boolean = false
    private var statusUpdateException: Exception? = null

    init {
        addWindowListener(object : WindowAdapter() {
            override fun windowClosing(event: WindowEvent) =
                dispose()
        })

        preferredSize = Dimension(800, 400)
        layout = BorderLayout()

        updateUi()
        pack()
    }

    private fun updateUi() {
        removeAll()

        add(
            Panel().apply {
                layout = FlowLayout()

                add(TextField(address).apply {
                    isEnabled = !isStatusUpdating

                    addTextListener { address = text }

                    addActionListener {
                        if (!isStatusUpdating)
                            updateStatus()
                    }
                })

                add(Button("Get").apply {
                    isEnabled = !isStatusUpdating

                    addActionListener {
                        if (!isStatusUpdating)
                            updateStatus()
                    }
                })
            },

            BorderLayout.PAGE_START,
        )

        add(
            Panel().apply {
                layout = FlowLayout()

                if (isStatusUpdating) {
                    add(Label("Loading..."))
                    return@apply
                }

                if (statusUpdateException != null) {
                    add(Label(statusUpdateException?.message ?: "Something went wrong").apply {
                        foreground = Color.RED
                    })

                    return@apply
                }

                if (status == null)
                    return@apply

                layout = GridBagLayout()

                add(
                    Panel().apply {
                        layout = GridBagLayout()

                        if (status!!.favicon != null) {
                            add(
                                object : Panel() {
                                    init {
                                        preferredSize = Dimension(64, 64)
                                    }

                                    override fun paint(g: Graphics) {
                                        g.drawImage(status!!.favicon, 0, 0, size.width, size.height, null)
                                        super.paint(g)
                                    }
                                },

                                GridBagConstraints().apply {
                                    gridx = 0
                                    gridy = 0

                                    gridheight = GridBagConstraints.REMAINDER
                                },
                            )
                        }

                        add(
                            Label("Version: ${status!!.version.name.declaration()} (protocol: ${status!!.version.protocol})"),

                            GridBagConstraints().apply {
                                gridx = 1
                                gridy = 0

                                anchor = GridBagConstraints.WEST

                                insets = Insets(0, 8, 0, 0, )
                            },
                        )

                        add(
                            Label("MOTD: ${PlainTextComponentSerializer.plainText().serialize(status!!.description)}"),

                            GridBagConstraints().apply {
                                gridx = 1
                                gridy = 1

                                anchor = GridBagConstraints.WEST

                                insets = Insets(0, 8, 0, 0, )
                            },
                        )

                        add(
                            Label("Players: ${status!!.players.online}/${status!!.players.max}"),

                            GridBagConstraints().apply {
                                gridx = 1
                                gridy = 2

                                anchor = GridBagConstraints.WEST

                                insets = Insets(0, 8, 0, 0, )
                            },
                        )

                        add(
                            Label("Ping: ${status!!.ping}"),

                            GridBagConstraints().apply {
                                gridx = 1
                                gridy = 3

                                anchor = GridBagConstraints.WEST

                                insets = Insets(0, 8, 0, 0, )
                            },
                        )
                    },

                    GridBagConstraints().apply {
                        gridx = 0
                        gridy = 0
                    }
                )

                if (status!!.players.sample != null)
                    add(
                        ScrollPane().apply {
                            add(Panel().apply {
                                layout = BoxLayout(this, BoxLayout.Y_AXIS)

                                for (player in status!!.players.sample!!)
                                    add(Label("${player.name} (id: ${player.id  })"))
                            })
                        },

                        GridBagConstraints().apply {
                            gridx = 0
                            gridy = 1

                            fill = GridBagConstraints.HORIZONTAL

                            insets = Insets(16, 0, 0, 0)
                        }
                    )
            },

            BorderLayout.CENTER,
        )

        validate()
    }

    private fun updateStatus() {
        isStatusUpdating = true

        updateUi()

        Thread {
            try {
                status = NetStatusProvider(address).status
                statusUpdateException = null
            } catch (exception: Exception) {
                status = null
                statusUpdateException = exception
            } finally {
                isStatusUpdating = false
                updateUi()
            }
        }.start()
    }
}

fun main() {
    ManualTest().isVisible = true
}
