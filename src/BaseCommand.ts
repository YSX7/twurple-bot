import { TwurpleClient } from './TwurpleClient'
import { ChatMessage } from './ChatMessage'

export interface CommandOptions {
  /**
   * Command name (default alias)
   */
  name: string

  /**
   * Userlevel access (everyone, regular, vip, subscriber, moderator, broadcaster)
   */
  userlevel: keyof typeof UserLevel

  /**
   * Command message text (used on text commands!)
   */
  text?: string

  /**
   * Command description (required for output to !help <command>)
   */
  description?: string

  /**
   * Message send type (used on text commands!)
   * default: (reply)
   */
  messageType?: keyof typeof MessageType

  /**
   * Command examples (requited for output to !help <command>)
   */
  examples?: string[]

  /**
   * Command arguments
   */
  args?: CommandArgument[]

  /**
   * More aliases
   */
  aliases?: string[]

  /**
   * The command is available only on the bot channel
   * Make sure the client enable `autoJoinBotChannel` parametr
   */
  botChannelOnly?: boolean

  /**
   * Hide command help output to `!commands`
   */
  hideFromHelp?: boolean

  /**
   * The command is available only in the private message of the bot
   */
  privmsgOnly?: boolean
}

export interface CommandArgument {
  /**
   * Alias name
   */
  name: string

  /**
   * Value typesafe
   */
  type?: StringConstructor | NumberConstructor | BooleanConstructor

  /**
   * Default value
   */
  defaultValue?: string | number | boolean
}

export enum UserLevel {
  vip = 'vip',
  everyone = 'everyone',
  regular = 'regular',
  subscriber = 'subscriber',
  moderator = 'moderator',
  broadcaster = 'broadcaster'
}

export enum MessageType {
  reply = 'reply',
  actionReply = 'actionReply',
  say = 'say',
  actionSay = 'actionSay'
}

export type NamedParameters = Record<string, string | number | boolean>

export type CommandProvider = Record<string, CommandOptions>

export class BaseCommand {
  public options: CommandOptions
  public client: TwurpleClient

  constructor(client: TwurpleClient, options: CommandOptions) {
    this.options = options
    this.client = client
  }

  /**
   * Method called when executeCommand
   *
   * @param msg
   * @param chatter
   */
  async execute(msg: ChatMessage): Promise<any> { }

  /**
   * Method called when command is executed
   *
   * @param msg
   * @param parameters
   */
  async run(msg: ChatMessage, parameters: unknown): Promise<any> { }

  /**
   * Prepare the command to be executed
   *
   * @param msg
   * @param parameters
   */
  async prepareRun(msg: ChatMessage, parameters: string[]): Promise<any> {
    const namedParameters: NamedParameters = {}

    if (this.options.args && this.options.args.length > 0) {
      for (let i = 0; i < this.options.args.length; i++) {
        if (parameters[i]) {
          if (typeof this.options.args[i].type === 'function') {
            namedParameters[this.options.args[i].name] = this.options.args[i].type(parameters[i])
          } else {
            namedParameters[this.options.args[i].name] = parameters[i]
          }
        } else {
          if (this.options.args[i].defaultValue) {
            namedParameters[this.options.args[i].name] = this.options.args[i].defaultValue
          } else {
            namedParameters[this.options.args[i].name] = null
          }
        }
      }
    }

    await this.run(msg, namedParameters)
  }

  /**
   * Pre validation before to known if can execute command
   *
   * @param msg
   */
  preValidate(msg: ChatMessage): string | boolean {
    if (msg.messageType !== 'whisper' && this.options.privmsgOnly) {
      return 'This command is available only via private message'
    }

    if (this.options.botChannelOnly) {
      if (msg.channel.name !== this.client.getUsername()) {
        return 'This command can be executed only in the bot channel. Please head to https://twitch.tv/' + this.client.getUsername()
      }
    }

    if (this.options.userlevel === UserLevel.everyone) {
      return true
    }

    let validationPassed = false

    if (msg.author.isBroadcaster) {
      validationPassed = true
    }

    if (msg.author.isModerator) {
      validationPassed = true
    }

    if (this.options.userlevel === UserLevel.regular) {
      if (!validationPassed
        && this.client.options?.botOwners.length > 0
        && !this.client.options.botOwners.includes(msg.author.username)
      ) {
        return 'This command can be executed only from bot owners'
      }
    }

    if (this.options.userlevel === UserLevel.subscriber) {
      if (!validationPassed && !msg.author.isSubscriber) {
        return 'This command can be executed only from the subscribers'
      }
    }

    if (this.options.userlevel === UserLevel.vip) {
      if (!validationPassed && !msg.author.isVip) {
        return 'This command can be executed only from the vips'
      }
    }

    if (this.options.userlevel === UserLevel.moderator) {
      if (!validationPassed) {
        return 'This command can be executed only from the broadcaster'
      }
    }

    if (this.options.userlevel === UserLevel.broadcaster) {
      if (!msg.author.isBroadcaster) {
        return 'This command can be executed only from a mod or the broadcaster'
      }
    }

    return true
  }
}