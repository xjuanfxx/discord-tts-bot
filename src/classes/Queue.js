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
   * @returns {number} The number of removed items.
   */
  removeWhere(predicate) {
    const before = this.store.length;
    this.store = this.store.filter((item) => !predicate(item));
    return before - this.store.length;
  }

  clear() {
    this.store = [];
  }

  isEmpty() {
    return this.store.length === 0;
  }
}

module.exports = Queue;
