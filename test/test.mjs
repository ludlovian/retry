import { test } from 'uvu'
import * as assert from 'uvu/assert'

import retry from '../src/index.mjs'

test('one that works', async () => {
  await retry(async () => {
    assert.ok(true)
  })
})

test('one that passes eventually', async () => {
  let n = 0
  const err = new Error('oops')
  async function go () {
    if (++n === 3) return 17
    throw err
  }

  const res = await retry(go, { retries: 3, delay: 100 })
  assert.is(res, 17)
})

test('one that throws eventually', async () => {
  const err = new Error('oops')

  async function go () {
    throw err
  }

  await retry(go, { retries: 1, delay: 100 }).then(
    () => {
      assert.unreachable()
    },
    e => {
      assert.is(e, err)
    }
  )
})

test('retry callback', async () => {
  const callbacks = []

  let n = 0
  const err = new Error('oops')
  async function go () {
    if (++n === 3) return 17
    throw err
  }

  function onRetry ({ error, attempt, delay }) {
    assert.is(error, err)
    callbacks.push([attempt, delay])
  }

  const res = await retry(go, { retries: 3, delay: 100, onRetry })
  assert.is(res, 17)

  assert.equal(callbacks, [
    [1, 100],
    [2, 150]
  ])
})

test.run()
