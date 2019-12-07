export default function retry (fn, opts = {}) {
  return tryOne({ ...opts, fn, attempt: 1 })
}

function tryOne (options) {
  const {
    fn,
    attempt,
    retries = 10,
    delay = 1000,
    backoff = retry.exponential(1.5),
    onRetry
  } = options
  return new Promise(resolve => resolve(fn())).catch(error => {
    if (attempt > retries) throw error
    if (onRetry) onRetry({ error, attempt, delay })
    return sleep(delay).then(() =>
      tryOne({ ...options, attempt: attempt + 1, delay: backoff(delay) })
    )
  })
}

retry.exponential = x => n => Math.round(n * x)

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay))
