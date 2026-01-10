import { setTimeout as sleep } from 'node:timers/promises'
import { timeout as timeoutWrap, TimeoutError } from '@ludlovian/timeout'

export default function retry (
  fn,
  {
    attempts = 1, //            how many should we try
    delay, //                   array or number of ms to delay
    retryIf, //                 should this error be retried
    verify, //                  did this really work
    onRetry, //                 called on retry
    log, //                     where to log
    context, //                 context used for logging
    timeout //                  wrap in a timeout
  } = {}
) {
  // set up the context and parameters
  const ctx = {}

  if (typeof delay === 'number') delay = [delay]
  if (Array.isArray(delay)) {
    while (delay.length < attempts - 1) {
      delay.push(delay.at(-1))
    }
    if (attempts < delay.length + 1) attempts = delay.length + 1
  }
  log = log === undefined ? console.error : log

  const { promise, resolve, reject } = Promise.withResolvers()
  promise._retry = ctx

  // start the process of running it
  _retry({
    fn,
    ctx,
    resolve,
    reject,
    attempts,
    delay,
    retryIf,
    verify,
    onRetry,
    log,
    context,
    timeout
  })

  return promise
}

async function _retry ({
  fn,
  ctx,
  resolve,
  reject,
  attempts,
  delay,
  retryIf,
  verify,
  onRetry,
  log,
  context,
  timeout: timeoutMs
}) {
  for (ctx.attempt = 1; ctx.attempt <= attempts; ctx.attempt++) {
    try {
      if (ctx.attempt > 1) {
        if (onRetry) await Promise.try(onRetry, ctx)
        if (log) {
          log(ctx.err)
          log('%s: Attempt #%d', context || 'Error', ctx.attempt)
        }
        if (delay) await sleep(delay[ctx.attempt - 1])
      }

      let pResult = Promise.try(fn)
      if (timeoutMs) pResult = timeoutWrap(pResult, timeoutMs)
      const result = await pResult
      if (verify) {
        if (!(await Promise.try(verify, result, ctx))) {
          throw new FailedToVerify()
        }
      }
      // if all goes well, we resolve & leave.
      return resolve(result)
    } catch (err) {
      ctx.err = err
      ctx.errs ??= []
      ctx.errs.push(err)
      ctx.timedOut = err instanceof TimeoutError
      ctx.verifyFailed = err instanceof FailedToVerify
      if (retryIf && !(await Promise.try(retryIf, err, ctx))) break
    }
    // go around again
  }
  // out of attempts - reject with most recent error
  ctx.attempt = Math.min(ctx.attempt, attempts)
  ctx.err._retry = ctx
  reject(ctx.err)
}

class FailedToVerify extends Error {
  constructor () {
    super('Failed to verify')
  }
}

retry.TimeoutError = TimeoutError
retry.FailedToVerify = FailedToVerify
export { retry, TimeoutError, FailedToVerify }
