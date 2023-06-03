enum ServerState {
    CREATED      = "created",      // 0-+
                                   //   |
    INITIALIZING = "initializing", // <-+   1-+
                                   //         |
    INITIALIZED  = "initialized",  // <-------+   2-+   <-------------+
                                   //               |                 |
    OPENING      = "opening",      // <-------------+   3-+           |
                                   //                     |           |
    LISTENING    = "listening",    // <-------------------+   4-+     |
                                   //                           |     |
    CLOSING      = "closing",      // <-------------------------+   5-+
}

export default ServerState