# 🤖 Twurple Bot

![GitHub package.json version](https://img.shields.io/github/package-json/v/crashmax-dev/twurple-bot)
[![GitHub license](https://img.shields.io/badge/license-MIT-green.svg?label=License)](https://github.com/twurple/twurple/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@twurple/auth.svg?style=flat&label=@twurple/auth)](https://www.npmjs.com/package/@twurple/auth)

# 🔨 Создание приложения разработчика Twitch

- Перейдите в [консоль приложения разработчика](https://dev.twitch.tv/console/apps) и зарегистрируйте новое приложение.
  
<img src="docs/1.png"></img>

- Укажите OAuth Redirect URL - `http://localhost:3030/twitch/callback`.
  
<img src="docs/2.png"></img>

- Сгенерируйте токены, нажав на кнопку `Новый секретный код`.

<img src="docs/3.png"></img>

# 📄 Создание конфига

В папке `config` создайте файл `config.json` подобный файлу [`config.example.json`](config/config.example.json). 
Настройте конфигурационный файл, введите идентификатор клиента - `clientId` и секретный код клиента - `clientSecret`, полученные выше. Указажите канал(-ы), к которому будет подключен бот.

```json
{
  "channels": [
    "channel_name"
  ],
  "botOwners": [],
  "ignoreList": [
    "moobot",
    "mirrobot",
    "nightbot",
    "streamlabs",
    "restreambot",
    "streamelements"
  ],
  "server": {
    "hostname": "localhost",
    "port": 3030
  },
  "prefix": "!",
  "clientId": "O5U93Th2J5dQEgc5rEqzS4HLnkPWZNlN",
  "clientSecret": "AIzaSyBbw9O8K5DTLY1KQKfhv55v5GNe84g5Jy0",
  "accessToken": "",
  "refreshToken": ""
}
```

# 📌 Список команд

- [!aphorism](#aphorism)
- [!automod](#automod)
- [!cat](#cat)
- [!commands](#commands)
- [!eval](#eval)
- [!followage](#followage)
- [!game](#game)
- [!giphy](#giphy)
- [!hsdeck](#hsdeck)
- [!ignore](#ignore)
- [!join](#join)
- [!part](#part)
- [!pokemon](#pokemon)
- [!raid](#raid)
- [!sounds](#sounds)
- [!song](#song)
- [!command](#command)
- [!tts](#tts)
- [!title](#title)
- [!quote](#quote)
- [!uptime](#uptime)
- [!weather](#weather)
- [!youtube](#youtube)

# ⚠ Интеграция с другими приложениями (не обязательно)

Для корректной работы таких команд как [`!giphy`](#giphy), [`!song`](#song), [`!youtube`](#youtube) и [`!weather`](#weather) нужно создать файл `.env` подобный файлу [`.env.example`](.env.example) и внести в него ваши api-ключи.

```
# https://nowplaying.tinyrobot.co
SPOTIFY_NOW_PLAYING_KEY=xxxxxxxxxxxx

# https://openweathermap.org/api
WEATHER_KEY=xxxxxxxxxxxx

# https://console.cloud.google.com/apis/credentials
YOUTUBE_KEY=xxxxxxxxxxxx

# https://developers.giphy.com/dashboard/
GIPHY_KEY=xxxxxxxxxx
```

# ▶ Запуск бота

- Установите [Node.js](https://nodejs.org/en/) 14.х или выше
- Установите зависимости командой `npm install`
- Для запуска используйте команду `npm start`

## `!aphorism`

- Случайный афоризм, цитата или фраза

```
usage: !афоризм
twurple: Ошибки всегда извинительны, когда имеешь силу в них признаться. Франсуа де Ларошфуко
```

## `!automod`

- Включает или выключает Automod

```
usage: !automod
twurple: AutoMod включен VoteYea
```

- добавляет или удаляет правило для Automod

```
usage: !automod remove Kappa
twurple: @le_xot, Правило добавлено
```

```
usage: !automod remove Kappa
twurple: @le_xot, Правило удалено
```

## `!cat`

- Случайная картинка котейки

```
usage: !кот
twurple: CoolCat cataas.com/cat/60ef3f0151a2ca0011c74560
```

## `!commands`

- Выводит список команд

```
usage: !команды
twurple: @username, Команды: !aphorism, !cat, etc..
```

## `!eval`

- Выполняет JS код

```
usage: !eval 2+2
twurple: 4
```

## `!followage`

- Время отслеживания канала

```
usage: !followage
twurple: @user, отслеживает канал с 7 сентября 2021 г. (52 день)
```

- проверяет продолжительность отслеживания конкретного пользователя

```
usage: !followage @user
twurple: @user отслеживает канал с 7 сентября 2021 г. (52 дня)
```

## `!game`

- Показывает текущий раздел стрима

```
usage: !игра
twurple: @user, <game>
```

- изменяет раздел стрима

```
usage: !игра <newGame>
twurple: @user, Игра изменена: <newGame>
```

## `!giphy`

- Поиск gif с сайта giphy.com

```
usage: !giphy
twurple: @user, Its Friday GIF by telenet → http://gph.is/27H8H5h
```

- в качестве поиска используется аргумент команды

```
usage: !giphy cat
twurple: @user, Dance Cat GIF by Banggood → http://gph.is/2chfxc6
```

## `!hsdeck`

- Декодирует код колоды из Hearthstone

```
usage: !hsdeck AAECAf0EAuj3A/T8Aw7BuAPHzgPNzgOk0QP30QPU6gPQ7APR7AOn9wOu9wOy9wP8ngT9ngTonwQA
twurple: @user скинул колоду Мага для Стандартного формата: https://decklist.hsdeckviewer.com/Vvh8gS HSCheers
```

## `!ignore`

- Добавляет или убирает юзера из игнор-листа бота

```
usage: !ignore add @user
twurple: Пользователю @user запрещено использовать команды
```

```
usage: !ignore remove @user
twurple:  Пользователь @user удален из черного списка
```

## `!join`

- Включает бота на выбранном канале

```
usage: !join @user
twurple: Бот на канале @user успешно включен
```

## `!part`

- Отключает бота от выбранного канала

```
usage: !part @user
twurple: Бот на канале @user успешно отключен
```

## `!pokemon`

- Показывает случайного покемона

```
usage: !покемон
twurple: @user, А ты что за покемон? Ты Бронзор KomodoHype modpixelmon.ru/bronzor
```

- поиск в вики

```
usage: !покемон дитто
twurple: @user, Дитто: modpixelmon.ru/ditto
```

## `!raid`

- Запускает рейд на случайный канал из текущей категории

```
usage: !raid
twurple: Проводим рейд в количестве 25 зрителей на канал @user
```

## `!sounds`

- Воспроизведение звуков на стриме

```
usage: !звуки
twurple: @user, !погнали, !казино, etc..
```

## `!song`

- Показывает текущий проигрываемый трек со Spotify

```
usage: !song
twurple: Rick Astley - Never Gonna Give You Up
```

## `!command`

- создание команды

```
usage: !command add twitter https://twitter.com/user
twurple: @user, Команда создана: !twitter
```

- удаление команды

```
usage: !command remove twitter
twurple: @user, Команда !twitter удалена
```

- список ранее созданных команд

```
usage: !command list
twurple: @user, Текстовые команды: !gametiers, !rules, etc..
```

- информация о команде

```
usage: !command get test
twurple: @user,Параметры: message - test, userlevel - everyone, sendType - reply
```

- изменение уровня доступа для команды 

```
usage: !command userlevel test vip
twurple: @user, Уровень доступа обновлен: vip
```

- измненения типа отправки команда 

```
usage: !command sendtype test say
twurple: @user, Метод отправки сообщения обновлен: say
```

## `!tts`

- Воспроизводит написанный текст с помощью технологии Text-To-Speech (Только для Windows!).

```
usage: !tts Привет, я робот
```

## `!title`

- Показывает текущее название стрима

```
usage: !title
twurple: @user, <title>
```

- изменяет текущее название стрима

```
usage: !title <newTitle>
twurple: @user, Название стрима изменено: <newTitle>
```

## `!quote`

- IT-цитаты с TProger.ru

```
usage: !quote
twurple: #60: Думать или загуглить — вот в чем вопрос
```

## `!uptime`

Показывает длительность трансляции

```
usage: !uptime
twurple: @user вещает уже 2ч 1м 54сек
```

## `!weather`

Показывает погоду в указанном населённом пункте

```
usage: !погода Москва
twurple: @user, Москва 9°C Подробнее: openweathermap.org/city/524901
```

## `!youtube`

Поиск видео на YouTube

```
usage: !youtube daft punk
twurple: Daft Punk https://www.youtube.com/channel/UC_kRDKYrUlrbtrSiyu5Tflg
```