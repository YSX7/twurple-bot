import { TwurpleClient } from '../TwurpleClient'
import { ChatMessage } from '../ChatMessage'
import { BaseCommand } from '../BaseCommand'
import { dateDiff } from '../utils/dateDiff'

export default class Uptime extends BaseCommand {
  constructor(client: TwurpleClient) {
    super(client, {
      name: 'uptime',
      userlevel: 'everyone',
      aliases: [
        'аптайм'
      ],
      description: 'Продолжительность трансляции',
      args: [
        {
          name: 'username'
        }
      ]
    })
  }

  async run(msg: ChatMessage, { username }) {
    const channel = msg.channel.name
    const stream = await (
      await this.client.api.users.getUserByName(username || channel)
    ).getStream()

    if (stream) {
      const dates = dateDiff(stream.startDate)
      const formatDate = Object.entries(dates)
        .map(date => {
          if (date[1] > 0) {
            return date[1] + date[0].charAt(0)
          }
        })
        .filter(v => v !== undefined)

      msg.reply(`${stream.userDisplayName} online ${formatDate.join(' ')}`)
    } else {
      msg.reply(`${channel} is currently offline`)
    }
  }
}