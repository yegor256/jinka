// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

/**
 * A wish that was already in the directory when jinka started.
 * It describes ongoing work, so its file is never deleted: closing it
 * only gives its claim back, sending it to the end of the queue.
 * @todo #10:45min A permanent wish goes back to the queue right after
 *  a successful run, so a directory with a single permanent wish makes
 *  the agent work on it without any pause, burning the subscription.
 *  Let us decide whether a permanent wish must wait some time after
 *  a success before it is tried again, and implement that delay.
 */
export class Permanent {
  constructor(origin) {
    this.origin = origin;
  }
  name() {
    return this.origin.name();
  }
  async text() {
    return this.origin.text();
  }
  fate() {
    return 'which stays there after you exit, so you must not delete it';
  }
  async close() {
    this.origin.free();
  }
  free() {
    this.origin.free();
  }
}
