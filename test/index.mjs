import { suite, test } from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as sleep } from 'node:timers/promises'

import retry from '../src/index.mjs'

suite('retry', async () => {
  test('a simple call that works', async t => {
    const fn = async () => 17
    const pFn = retry(fn)
    await assert.doesNotReject(pFn, 'it resolves')
    assert.equal(await pFn, 17)
  })

  test('a simple call that works second time', async t => {
    let i = 0
    const err = new Error('oops')
    const fn = async () => {
      if (!i++) throw err
      return 17
    }
    const pFn = retry(fn, {
      attempts: 2,
      log: null // quiet logging
    })

    await assert.doesNotReject(pFn, 'it resolves')
    assert.equal(await pFn, 17)
    assert.deepEqual(pFn._retry, {
      attempt: 2,
      err,
      errs: [err],
      timedOut: false,
      verifyFailed: false
    })
  })

  test('a simple call with all the callbacks', async t => {
    let i = 0
    const err = new Error('oops')
    const fn = async () => {
      if (!i++) throw err
      return 17
    }

    let onRetryCount = 0
    const onRetry = async ctx => {
      onRetryCount++
      assert.equal(ctx.attempt, 2)
      await sleep(1)
    }

    let retryIfCount = 0
    const retryIf = async (_err, ctx) => {
      retryIfCount++
      assert.equal(_err, err)
      assert.equal(ctx.attempt, 1)
      await sleep(1)
      return true
    }

    let logCount = 0
    const log = () => {
      logCount++
    }

    let verifyCount = 0
    const verify = async result => {
      verifyCount++
      assert.equal(result, 17)
      await sleep(1)
      return true
    }

    const pFn = retry(fn, {
      attempts: 2,
      delay: 1,
      onRetry,
      verify,
      retryIf,
      log
    })

    await assert.doesNotReject(pFn, 'it resolves')
    assert.equal(await pFn, 17)
    assert.equal(onRetryCount, 1)
    assert.equal(verifyCount, 1)
    assert.equal(retryIfCount, 1)
    assert.equal(logCount, 1)
  })

  test('multiple failures results in failure', async t => {
    const err = new Error('oops')
    const fn = async () => {
      throw err
    }

    const pFn = retry(fn, {
      attempts: 3,
      delay: 1,
      log: null
    })

    await assert.rejects(pFn, err, 'it rejects')
    assert.equal(pFn._retry.err, err)
  })

  test('success, but fails to verify', async t => {
    const fn = async () => 17
    const verify = async () => false

    const pFn = retry(fn, {
      attempts: 3,
      delay: 1,
      verify,
      log: null
    })

    await assert.rejects(pFn, retry.FailedToVerify, 'it rejects')
    assert.equal(pFn._retry.verifyFailed, true)
  })

  test('multiple delays given', async t => {
    const err = new Error('oops')
    const fn = async () => {
      throw err
    }
    let onRetryCount = 0
    const onRetry = () => {
      onRetryCount++
    }

    const pFn = retry(fn, {
      attempts: 1,
      delay: [1, 2, 3],
      onRetry,
      log: null
    })

    await assert.rejects(pFn, err, 'it rejects')
    assert.equal(onRetryCount, 3)
    assert.equal(pFn._retry.attempt, 4)
  })

  test('add timeout', async t => {
    const fn = () => new Promise(() => {}) // never resolves
    const pFn = retry(fn, {
      attempts: 2,
      timeout: 20,
      log: null
    })

    await assert.rejects(pFn, retry.TimeoutError, 'it rejects')
    assert.equal(pFn._retry.timedOut, true)
  })

  test('retryIf returns false', async t => {
    const err = new Error('oops')
    const fn = () => Promise.reject(err)

    const retryIf = () => false

    const pFn = retry(fn, {
      attempts: 3,
      retryIf,
      log: null
    })

    await assert.rejects(pFn, err, 'it rejects')
    assert.equal(pFn._retry.attempt, 1)
  })
})
