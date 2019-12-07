import test from 'ava'

import retry from '../src'

test('one that works', async t => {
  await retry(async () => {
    t.pass()
  })
})

test('one that passes eventually', async t => {
  let n = 0
  const err = new Error('oops')
  async function go () {
    if (++n === 3) return 17
    throw err
  }

  const res = await retry(go, { retries: 3, delay: 100 })
  t.is(res, 17)
})

test('one that throws eventually', async t => {
  const err = new Error('oops')

  async function go () {
    throw err
  }

  const e = await t.throwsAsync(retry(go, { retries: 1, delay: 100 }))
  t.is(e, err)
})

test('retry callback', async t => {
  const callbacks = []

  let n = 0
  const err = new Error('oops')
  async function go () {
    if (++n === 3) return 17
    throw err
  }

  function onRetry ({ error, attempt, delay }) {
    t.is(error, err)
    callbacks.push([attempt, delay])
  }

  const res = await retry(go, { retries: 3, delay: 100, onRetry })
  t.is(res, 17)

  t.deepEqual(callbacks, [
    [1, 100],
    [2, 150]
  ])
})
