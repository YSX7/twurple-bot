import { inspect } from 'util'

export const vm = async (code: string) => {
  try {
    let isPromise = false
    let evaled = eval(code.indexOf('await') !== -1 ? `(async() => { ${code} })()` : code)

    if (evaled && evaled instanceof Promise) {
      isPromise = true
      evaled = await evaled
    }

    if (typeof evaled !== 'string') {
      evaled = inspect(evaled, { depth: 0 })
    }

    return evaled
  } catch (err) {
    return err.toString()
  }
}