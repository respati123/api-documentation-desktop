// Runs tasks one after another. A task starts only when the previous one has settled, so it reads what that one saved.
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve()
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = tail.then(task)
    tail = run.catch(() => undefined)
    return run
  }
}
