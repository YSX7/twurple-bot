import path from 'path'
import { LowSync } from 'lowdb-hybrid'
import Commands from './Commands'
import { randomInt } from '../utils'
import compile from 'compile-template'
import { CommandVariables, ChatMessage, BaseCommand, CommandOptions, MessageType, TwurpleClient, UserLevel } from '../client'

type ITextCommand = Pick<CommandOptions, 'name' | 'message' | 'sendType' | 'hideFromHelp' | 'userlevel'>

class TextCommand extends BaseCommand {
  constructor(client: TwurpleClient, options: CommandOptions) {
    super(client, options)
  }

  async run(msg: ChatMessage) {
    try {
      const message = await this.formatMessage(msg)
      msg[this.options.sendType](message)
    } catch (err) {
      console.log(err)
    }
  }

  async formatMessage(msg: ChatMessage) {
    let message = this.options.message
    const regex = /\${([^}]+)}/g
    const matches = [...message.matchAll(regex)]

    if (matches.length) {
      try {
        const { user, channel, random, chatter, vm } = new CommandVariables(this.client, msg)

        // promises
        for (const match of matches) {
          switch (match[1]) {
            case 'chatter': {
              const chatters = await chatter()
              const randomChatter = chatters[randomInt(0, chatters.length - 1)]
              message = message.replace(match[0], randomChatter)
              break
            }
            case 'eval': {
              const vms = await vm(match[0].slice(5).slice(0, -1))
              message = message.replace(match[0], vms)
              break
            }
            default:
              break
          }
        }

        return compile(message, {
          // without promises
          user,
          channel,
          random
        })()
      } catch (err) {
        console.log(err)
      }
    } else {
      return message
    }
  }
}

export default class TextCommandManager extends BaseCommand {
  private commands: LowSync<ITextCommand[]>

  constructor(client: TwurpleClient) {
    super(client, {
      name: 'command',
      userlevel: 'regular',
      description: 'Эта команда позволяет управлять текстовыми командами.',
      examples: [
        'command add <name> <message>',
        'command remove <name>',
        'command list',
        'command get <name>',
        'command userlevel <command> <userlevel> <level>',
        'command sendtype <command> <sendtype> <type>'
      ]
    })

    this.commands = this.client.lowdbAdapter<ITextCommand[]>({
      path: path.join(__dirname, '../../config/commands.json'),
      initialData: []
    })

    this.commands.data.forEach(command => {
      this.client.commands.push(new TextCommand(this.client, command))
      this.client.logger.info(`Register command ${command.name}`)
    })
  }

  async prepareRun(msg: ChatMessage, args: string[]) {
    if (args.length) {
      const action = args[0]
      args.shift()
      const command = args[0]
      args.shift()
      const options = args.join(' ')

      switch (action) {
        case 'add':
          this.addCommand(msg, command, options)
          break

        case 'remove':
          this.removeCommand(msg, command)
          break

        case 'list':
          this.commandList(msg)
          break

        case 'get':
          this.getCommand(msg, command)
          break

        case 'userlevel':
          this.updateUserLevel(msg, command, options as UserLevel)
          break

        case 'sendtype':
          this.updateSendType(msg, command, options as MessageType)
          break

        default:
          msg.reply(`Аргумент '${action}' не найден`)
      }
    } else {
      Commands.commandHelp(msg, this.client.commands, this.options.name)
    }
  }

  addCommand(msg: ChatMessage, name: string, message: string): Promise<[string, string] | [string]> {
    if (!message.length) {
      return msg.reply('Укажите сообщение команды')
    }

    const command = this.client.findCommand({ command: name })

    if (!command) {
      const newCommand: ITextCommand = {
        name,
        message,
        sendType: 'say',
        userlevel: 'everyone',
        hideFromHelp: true
      }

      this.client.commands.push(new TextCommand(this.client, newCommand))
      this.commands.data.push(newCommand)
      this.commands.write()

      msg.reply(`Команда создана: ${this.client.config.prefix}${name}`)
    } else {
      msg.reply('Команда уже существует')
    }
  }

  removeCommand(msg: ChatMessage, name: string): void {
    const command = this.commands.data.find(cmd => cmd.name === name)

    if (command) {
      this.client.commands = this.client.commands.filter(cmd => name !== cmd.options.name)
      this.commands.data = this.commands.data.filter(cmd => name !== cmd.name)
      this.commands.write()

      msg.reply(`Команда ${this.client.config.prefix}${command.name} удалена`)
    } else {
      msg.reply(`Команда ${this.client.config.prefix}${name} не найдена`)
    }
  }

  commandList(msg: ChatMessage): void {
    const commands = this.commands.data
      .map(command => {
        return this.client.config.prefix + command.name
      })
      .join(', ')

    if (commands.length) {
      msg.reply(`Текстовые команды: ${commands}`)
    } else {
      msg.reply(`Создайте свою первую команду, используя ${this.client.config.prefix}${this.options.examples[0]}`)
    }
  }

  getCommand(msg: ChatMessage, name: string): void {
    const command = this.client.findCommand({ command: name })

    if (command) {
      const { message, userlevel, sendType } = command.options
      msg.reply(`Параметры: message - ${message}, userlevel - ${userlevel}, sendType - ${sendType}`)
    } else {
      msg.reply(`Команда ${this.client.config.prefix}${name} не найдена`)
    }
  }

  updateUserLevel(msg: ChatMessage, name: string, userlevel: UserLevel): void {
    const UserLevels = Object.values(UserLevel)

    if (UserLevels.includes(userlevel)) {
      this.updateCommandOptions(name, { userlevel })
      msg.reply(`Уровень доступа обновлен: ${userlevel}`)
    } else {
      msg.reply(`Доступные аргументы: ${UserLevels.join(', ')}`)
    }
  }

  updateSendType(msg: ChatMessage, name: string, sendType: MessageType): void {
    const SendTypes = Object.values(MessageType)

    if (SendTypes.includes(sendType)) {
      this.updateCommandOptions(name, { sendType })
      msg.reply(`Метод отправки сообщения обновлен: ${sendType}`)
    } else {
      msg.reply(`Доступные аргументы: ${SendTypes.join(', ')}`)
    }
  }

  updateCommandOptions(name: string, { ...options }: Partial<ITextCommand>): void {
    const command = this.commands.data.find(command => command.name === name)
    Object.assign(command, options)
    this.commands.write()

    this.client.commands.forEach(command => {
      if (command.options.name === name) {
        command.options = {
          ...command.options,
          ...options
        }
      }
    })
  }
}