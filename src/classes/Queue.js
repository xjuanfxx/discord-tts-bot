class Queue {
  constructor(initial = []) {
    if (!Array.isArray(initial)) {
      throw new TypeError('Queue may only contain an array as a store.');
    }

    this.store = initial;
  }

  get length() {
    return this.store.length;
  }

  enqueue(item) {
    this.store.push(item);
  }

  dequeue() {
    return this.store.shift();
  }

  peek() {
    return this.store[0];
  }

  /**
   * Removes every item that matches the predicate.
   * @param {Function} predicate
   * @returns {Array} The removed items.
   */
  removeWhere(predicate) {
    const removed = [];
    this.store = this.store.filter((item) => {
      if (predicate(item)) {
        removed.push(item);
        return false;
      }
      return true;
    });
    return removed;
  }

  clear() {
    this.store = [];
  }

  isEmpty() {
    return this.store.length === 0;
  }
}

module.exports = Queue;
