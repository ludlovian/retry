# retry
Retry with backoff

## API

Only one default exported function

### retry
`retry(fn, opts)`

runs an async function, retrying if it fails

There are a variety of options

- `attempts` will set the maximum number of attempts
- `delay` can be a number or array of numbers setting the delay between
attempts.
- `retryIf` is a function, (error) => Boolean, which determines if the
error encountered should be retried
- `verify`  is a function (result) => Boolean called after an apparent
success to see if it really worked
- `onRetry` is a function called before each retry attempt, before the sleep
- `timeout` apply a timeout wrap to the function.

THe promise returned by `retry` also has a `_retry` object attached.
This contains:

- `attempt` the attempt number
- `err` the latest error
- `errs` the array of errors
- `timedOut` - if the last invocation timed out
- `verifyFailed` - if the last invocation failed to verify


