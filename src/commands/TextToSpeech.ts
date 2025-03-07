import path from 'path'
import type { LowSync } from 'lowdb-hybrid'
import type { ChildProcess } from 'child_process'
import { exec, spawn } from 'child_process'
import type { TwurpleClient, ChatMessage, ChatUser } from '../client'
import type { UserLevel } from '../client'
import { BaseCommand } from '../client'
import { ClearMsg } from '@twurple/chat/lib'
import { markAsUntransferable } from 'worker_threads'
import { clamp } from 'lodash'

interface IPlayingTts{
  cp: ChildProcess
  cmd: string
}

interface ITtsSettings{
  speed?: number
  volume?: number
  voice?: string
}

interface IUser extends ITtsSettings{
  id: string
  nickname: string
}

interface ITextToSpeech {
  minSpeed: number
  speed: number
  volume: number
  voice: string
  users: IUser[]
}

export default class TextToSpeech extends BaseCommand {
  private enabled = true
  private playing = 0
  private cmd: string
  private playingNow: IPlayingTts[] = []
  private queue: {msg: string, userId: string}[] = []
  private db: LowSync<ITextToSpeech>
  private VOICE_NAME_MAX_LENGTH = 50

  constructor(client: TwurpleClient) {
    super(client, {
      name: 'tts',
      userlevel: 'everyone',
      disabled: true,
      description: 'Text to speech',
      aliases: ['ттс', 'ttsf', 'ттсф'],
      examples: [
        'tts',
        'tts skip',
        'tts voices',
        'tts voice <voice>',
        'tts speed <speed>',
        'tts volume <volume>',
        'tts user <username>'
      ],
      allowed: {
        watcher: ['on', 'off'],
        subscriber: ['skip', 'voices', 'voice', 'speed', 'volume', 'user'],
        vip: ['skip', 'voices', 'voice', 'speed', 'volume', 'user'],
        everyone: ['help']
      }
    })

    this.cmd =
      'Add-Type -AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer;'

    this.db = this.client.lowdbAdapter<ITextToSpeech>({
      path: path.join(__dirname, '../../config/tts.json')
    })
  }

  async prepareRun(msg: ChatMessage, args: string[]) {
    if (this.options.disabled) return true
    const forceChar = msg.text.split(' ')[0].slice(-1)
    if (forceChar === 'f' || forceChar === 'ф'){
      this.speech(args, msg.author.id, true)
      return
    }


    if (args.length) {
      const cmd = this.getAllowedCommand(args[0],msg)

      switch (cmd){
        case 'on':
          this.enabled = true
          break
        case 'off':
          this.enabled = false
          break
        case 'voices':
          this.getVoices((response) => msg.reply(response))
          break
        case 'voice':
          args.shift()
          this.changeVoice(msg, args.join(' '))
          break
        case 'speed':
          this.changeSpeed(msg, args[1])
          break
        case 'volume':
          this.changeVolume(msg, args[1])
          break
        case 'user':
          msg.reply(this.checkUser(args[1]))
          break
        case 'skip':
          this.skipSpeech(msg)
          break
        case 'reset':
          this.skipAllSpeech(msg)
          break
        case 'help':
          msg.reply(
            `Доступные аргументы: ${this.options.examples.join(
              `, ${this.client.config.prefix}`
            )}`
          )
          break
        default:
          this.speech(args, msg.author.id)
      }
    } else {
      let { speed, volume, voice } = this.db.data
      const settings = this.findUserSettingsById(msg.author.id)
      if (settings)
      {
        speed = settings.speed ? settings.speed : speed
        volume = settings.volume ? settings.volume : volume
        voice = settings.voice ? settings.voice : voice
      }
      msg.reply(
        `${this.options.description}, speed: ${speed}, volume: ${volume}, voice: ${voice}`
      )
    }
  }

  skipAllSpeech(msg: ChatMessage) {
    if (this.playing > 0) {
      while (this.playingNow.length > 0) {
        spawn('taskkill', [
          '/pid',
          this.playingNow.shift().cp.pid.toString(),
          '/f',
          '/t'
        ])
      }
    }
  }

  skipSpeech(msg: ChatMessage){
    if (this.playing > 1) {
      while (this.playingNow.length > 0) {
        spawn('taskkill', [
          '/pid',
          this.playingNow.shift().cp.pid.toString(),
          '/f',
          '/t'
        ])
      }
    }
  }

  getVoices(callback: (response: string) => void) {
    let voices = ''
    let cmd = this.cmd
    cmd += '$speak.GetInstalledVoices() | % {$_.VoiceInfo.Name}'

    const shell = spawn('powershell', [cmd])
    shell.stdout.on('data', (data: Buffer) => {
      voices += data.toString().split('\r\n')
    })

    shell.addListener('exit', (code, signal) => {
      if (code === null || signal !== null) {
        return callback(
          `say.getInstalledVoices(): could not get installed voices, had an error [code: ${code}] [signal: ${signal}]`
        )
      }

      if (voices.length > 0) {
        voices =
          voices[voices.length - 1] === ''
            ? voices.slice(0, voices.length - 1)
            : voices
      }

      voices = voices.slice(0, -1)
      callback(voices.replace(',', ', '))
    })

    shell.stdin.end()
  }

  changeVoice(msg: ChatMessage, voice: string | undefined) {
    if (voice) {
      if(msg.author.isBroadcaster){
        this.db.data.voice = voice
      } else {
        const user = this.findUser(msg.author)

        Object.assign(user, { voice: voice.substring(0,this.VOICE_NAME_MAX_LENGTH) })
      }
      this.db.write()
    } else {
      this.getVoices((response) => {
        msg.reply(response)
      })
    }
  }

  changeSpeed(msg: ChatMessage, speed: string) {
    try {
      let spd = clamp(Number(speed),0,10000)

      if (isNaN(spd)) {
        throw false
      }

      spd = Math.round(spd * 100) / 100
 
      if (msg.author.isBroadcaster)
      {
        this.db.data.speed = spd
      } else {
        const user = this.findUser(msg.author)
        Object.assign(user, { speed: spd })
      }
      this.db.write()
    } catch (err) {
      msg.reply('Укажите тембр. (рекомендуемое значение: 25-50)')
    }
  }

  changeVolume(msg: ChatMessage, volume: string) {
    try {
      let vol = Number(volume)

      if (isNaN(vol)) {
        throw false
      }

      vol = Math.round(vol * 100) / 100

      if (vol > 100 || vol < 0) {
        throw false
      }

      if(msg.author.isBroadcaster){
        this.db.data.volume = vol
       
      } else {
        const user = this.findUser(msg.author)
        Object.assign(user, { volume: vol })
      }
      this.db.write()
    } catch (err) {
      msg.reply('Укажите громкость звука от 0-100')
    }
  }

  speech(args: string | string[], userId: string, isForce = false) {

    if (!this.enabled) return

    const message =
      typeof args !== 'string' ? args.join(' ').replace(/[|&'<>]/gi, '') : args

    if (!isForce && this.playing > 0){
      return this.queue.push({ msg: message, userId: userId })
    }

    let { speed, volume, voice } = this.db.data
    const settings = this.findUserSettingsById(userId)
    if(settings)
    {
      speed = settings.speed && settings.speed > this.db.data.minSpeed ? settings.speed : speed
      volume = settings.volume && settings.volume < volume ? settings.volume : volume
      voice = settings.voice ? settings.voice : voice
    }
    

    let cmd = 'powershell.exe ' + this.cmd
    cmd += `$speak.SelectVoice('${voice}'); `
    cmd += `$speak.Volume = ${volume}; `
    cmd += `$speak.Rate = ${speed}; `
    cmd += `$speak.Speak('${message}'); `

    this.playing++

    this.playingNow.push({ cmd, cp: exec(cmd, (err) => {
      if (err) {
        this.client.logger.error(err.toString(), this.constructor.name)
      }

      this.playingNow = this.playingNow.filter((val) => val.cmd !== cmd)
      this.playing--

      if (this.queue.length && this.playing === 0) {
        const nextTts = this.queue.shift()
        this.speech(nextTts.msg, nextTts.userId)
      }
    }) }
    )
  }

  findUser(chatUser : ChatUser) : IUser{
    let user = this.db.data.users.find((user)=>user.id === chatUser.id)
    if (!user){
      user = { id: chatUser.id,
        nickname: chatUser.displayName }
      this.db.data.users.push(user)
    }
    return user
  }

  findUserSettingsByUsername(username: string): ITtsSettings{
    username = username.replace('@', '')
    const user = this.db.data.users.find((user) => user.nickname.toLowerCase() === username.toLowerCase())
    if (!user)
      return undefined
    return { speed: user.speed, volume: user.volume, voice: user.voice }
  }

  findUserSettingsById(userId: string): ITtsSettings{
    const user = this.db.data.users.find((user) => user.id === userId)
    if (!user)
      return undefined
    return { speed: user.speed, volume: user.volume, voice: user.voice }
  }

  checkUser(args: string): string{
    if (!args){
      return 'Укажите чаттерса'
    }
    const settings = this.findUserSettingsByUsername(args)
    if (settings)
    {
      let result = `${this.options.description}`
      result += settings.speed ? `, speed: ${settings.speed}` : ''
      result += settings.volume ? `, volume: ${settings.volume}` : ''
      result += settings.voice ? `, voice: ${settings.voice}` : ''
      return result
    }
    else { return `${args} не ставил настройки` }
  }
}
