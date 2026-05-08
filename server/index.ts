import 'dotenv/config'
import { createApp } from './app'

const port = Number(process.env.PORT || 8787)
const app = createApp()

app.listen(port, '127.0.0.1', () => {
  console.log(`CBL poetry API listening on http://127.0.0.1:${port}`)
})
