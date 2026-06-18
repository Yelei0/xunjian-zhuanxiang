import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFile, writeFile } from 'node:fs/promises'
import { updatePrdBlock } from './scripts/prd-edit-utils.mjs'

function readJsonBody(req: import('node:http').IncomingMessage): Promise<any> {
  return new Promise((resolveBody, reject) => {
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', chunk => { raw += chunk })
    req.on('end', () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

export default defineConfig({
  base: process.env.VERCEL ? '/' : './',
  plugins: [
    vue(),
    {
      name: 'prd-dev-editor',
      apply: 'serve',
      configureServer(server) {
        const prdPath = resolve(__dirname, 'PRD.md')
        server.watcher.unwatch(prdPath)

        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.endsWith('/__prd/update')) {
            next()
            return
          }

          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          try {
            const input = await readJsonBody(req)
            const markdown = await readFile(prdPath, 'utf8')
            const nextMarkdown = updatePrdBlock(markdown, input)
            if (nextMarkdown !== markdown) {
              await writeFile(prdPath, nextMarkdown, 'utf8')
              server.watcher.unwatch(prdPath)
            }
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ markdown: nextMarkdown }))
          } catch (error) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to update PRD' }))
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@skills': resolve(__dirname, 'skills'),
    },
  },
})
