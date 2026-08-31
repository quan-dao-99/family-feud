import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { WebSocketServer, WebSocket } from 'ws'

function gameSyncPlugin(): Plugin {
  let savedGameState: any = null
  const clients = new Set<WebSocket>()

  function setupWebSocketServer(httpServer: any) {
    if (!httpServer) return
    const wss = new WebSocketServer({ noServer: true })

    httpServer.on('upgrade', (request: any, socket: any, head: any) => {
      try {
        const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`)
        if (url.pathname === '/ws-sync') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request)
          })
        }
      } catch (err) {
        console.error('[GameSync] Upgrade error:', err)
      }
    })

    wss.on('connection', (ws) => {
      clients.add(ws)
      console.log(`[GameSync] Device connected. Total connected devices: ${clients.size}`)

      // If we already have a synchronized game state, send it immediately to newly connected device
      if (savedGameState) {
        try {
          ws.send(JSON.stringify({ type: 'SYNC_STATE', state: savedGameState }))
        } catch (e) {
          console.error('[GameSync] Error sending initial state:', e)
        }
      }

      ws.on('message', (data) => {
        try {
          const raw = data.toString()
          const action = JSON.parse(raw)

          if (action.type === 'SYNC_STATE' && action.state) {
            savedGameState = action.state
          } else if (action.type === 'REQUEST_SYNC' && savedGameState) {
            ws.send(JSON.stringify({ type: 'SYNC_STATE', state: savedGameState }))
            return
          }

          // Broadcast to all other connected clients (Phone -> TV, TV -> Phone)
          for (const client of clients) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(raw)
            }
          }
        } catch (err) {
          console.error('[GameSync] Message handling error:', err)
        }
      })

      ws.on('close', () => {
        clients.delete(ws)
        console.log(`[GameSync] Device disconnected. Remaining devices: ${clients.size}`)
      })

      ws.on('error', (err) => {
        console.error('[GameSync] Socket error:', err)
        clients.delete(ws)
      })
    })
  }

  return {
    name: 'chungsuc-game-sync',
    configureServer(server) {
      setupWebSocketServer(server.httpServer)
    },
    configurePreviewServer(server) {
      setupWebSocketServer(server.httpServer)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isHttpsMode = mode === 'https' || process.env.HTTPS === 'true'

  return {
    server: {
      host: true, // Listen on all local IP addresses (LAN)
    },
    preview: {
      host: true,
    },
    plugins: [
      ...(isHttpsMode ? [basicSsl()] : []),
      react(),
      gameSyncPlugin(),
      legacy({
        targets: ['chrome >= 49', 'edge >= 18', 'safari >= 11', 'firefox >= 52', 'not IE 11'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      }),
    ],
  }
})
