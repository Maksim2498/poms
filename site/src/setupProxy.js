const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = app => {
    app.use(createProxyMiddleware(
        "/api",
        {
            changeOrigin: true,
            target:       "http://localhost:8000/",
        }
    ))

    app.use(createProxyMiddleware(
        "/ws/console",
        {
            changeOrigin: true,
            target:       "ws://localhost:8000/",
            ws:           true
        }
    ))
}