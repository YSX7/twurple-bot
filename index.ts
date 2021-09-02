import path from 'path'
import { TwurpleClient, ChatMessage } from './src'

import dotenv from 'dotenv'
dotenv.config()

const client = new TwurpleClient({
  pathConfig: path.join(__dirname, 'config.json'),
  channels: ['quakerlegend', 'le_xot', 'vs_code'],
  botOwners: ['vs_code']
})

client.on('message', (msg: ChatMessage) => {
  if (msg.text.startsWith(client.options.prefix)) {
    return client.execCommand('sounds', msg)
  }

  client.execCommand('hsdeck', msg)
})

client.registerDefaultCommands()

client.connect()