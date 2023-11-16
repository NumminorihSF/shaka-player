/*! @license
 * Shaka Player
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

goog.provide('shaka.abr.ProgressAccumulator');

goog.require('shaka.util.Timer');


/**
 * @summary Accumulator
 */
shaka.abr.ProgressAccumulator = class {
  /**
   * @param {!function(number, number, boolean)} onProgress_
   */
  constructor(onProgress_) {
    /** @private {!number} */
    this.progressInterval_ = 3;

    this.onProgress_ = onProgress_;
    /** @private {!number} */
    this.accumulatedSize_ = 0;

    /** @private {!boolean} */
    this.allowSwitch_ = false;

    /** @private {!number} */
    this.requestsCount_ = 0;

    /** @private {!number} */
    this.lastTimeCall_ = Date.now();

    /** @private {shaka.util.Timer} */
    this.timer_ = new shaka.util.Timer(() => {
      if (this.accumulatedSize_ === 0) {
        return;
      }
      const now = Date.now();
      this.onProgress_(
          now - this.lastTimeCall_,
          this.accumulatedSize_,
          this.allowSwitch_,
      );
      this.accumulatedSize_ = 0;
      this.lastTimeCall_ = now;
    });
  }

  /** */
  configure(progressInterval) {
    this.progressInterval_ = progressInterval;
    if (this.requestsCount_ > 0) {
      this.timer_.tickEvery(this.progressInterval_);
    }
  }

  /** */
  handleProgress(size, allowSwitch) {
    this.accumulatedSize_ += size;
    this.allowSwitch_ = allowSwitch;
  }

  /** */
  responseStart() {
    this.requestsCount_++;
    if (this.requestsCount_ !== 1) {
      return;
    }
    this.lastTimeCall_ = Date.now();
    this.timer_.tickEvery(this.progressInterval_);
  }

  /** */
  requestEnded() {
    this.requestsCount_--;
    if (this.requestsCount_ === 0) {
      this.timer_.tickNow();
      this.timer_.stop();
    }
  }

  /** */
  destroy() {
    this.timer_.stop();
  }
};


/**
 * @type {number}
 */
shaka.abr.ProgressAccumulator.INTERVAL = 100;
