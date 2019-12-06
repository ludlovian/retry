# retry
Retry with backoff

## API

Only one default exported function

### retry
`retry(fn, opts)`

runs an async function, retrying if it fails

optsions are:
- `retries` how many retries in additon to the first attempt (default 5)
- `delay` what is the first delay (in ms) (default 1 second)
- `backoff` how does the delay increase each time (default `retry.exponential(1.5)`
- `onRetry` function to be called on retry with `{ attempt, delay, error }`

### retry.exponential
`retry.exponential(2.0)`

Generates an exponential backoff function
