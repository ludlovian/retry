# retry
Retry an async function

## API

The default export is `retry`. Named exports too.

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
- `log` if a function to be used to log error output. Defaults to
`console.error` but if set to `null` then no output will be given
- `context` is the context to be used in the logging
- `timeout` apply a timeout wrap to the function.

There is a context object, available as `_retry` on the returned
promise and passed into `onRetry`. This has the following:

- `attempt` the attempt number
- `err` the latest error
- `errs` the array of errors
- `timedOut` - if the last invocation timed out
- `verifyFailed` - if the last invocation failed to verify


