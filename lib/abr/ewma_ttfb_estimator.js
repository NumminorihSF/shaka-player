/*! @license
 * Shaka Player
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

goog.provide('shaka.abr.EwmaTtfbEstimator');

goog.require('shaka.abr.Ewma');


/**
 * @summary
 * This class tracks TTFB samples and estimates existed TTFB.
 * Based on the maximum of two exponentially-weighted moving averages with
 * different half-lives.
 *
 */
shaka.abr.EwmaTtfbEstimator = class {
  /** */
  constructor() {
    /**
     * A fast-moving average.
     * Half of the estimate is based on the last 2 seconds of sample history.
     * @private {!shaka.abr.Ewma}
     */
    this.fast_ = new shaka.abr.Ewma(2);

    /**
     * A slow-moving average.
     * Half of the estimate is based on the last 5 seconds of sample history.
     * @private {!shaka.abr.Ewma}
     */
    this.slow_ = new shaka.abr.Ewma(5);

    /**
     * Number of sampled requests.
     * @private {number}
     */
    this.requestsSampled_ = 0;


    /**
     * Minimum number of requests sampled before we trust the estimate.
     *
     * @private {number}
     */
    this.minTotalRequest_ = 4;
  }


  /**
   * Called by the Player to provide an updated configuration any time it
   * changes.
   * Must be called at least once before init().
   *
   * @param {shaka.extern.AdvancedAbrConfiguration} config
   */
  configure(config) {
    this.minTotalRequest_ = config.minTotalRequests;
    this.fast_.updateAlpha(config.fastTtfbHalfLife);
    this.slow_.updateAlpha(config.slowTtfbHalfLife);
  }


  /**
   * Takes a ttfb sample.
   *
   * @param {number} durationMs The amount of time, in milliseconds, for a
   *   particular request.
   */
  sample(durationMs) {
    this.requestsSampled_ ++;
    this.fast_.sample(1, durationMs);
    this.slow_.sample(1, durationMs);
  }


  /**
   * Gets the current ttfb estimate.
   *
   * @param {number} defaultEstimate
   * @return {number} The ttfb estimate in milliseconds.
   */
  getTtfbEstimate(defaultEstimate) {
    if (this.requestsSampled_ < this.minTotalRequest_) {
      return defaultEstimate;
    }

    // Take the maximum of these two estimates.  This should have the effect
    // of adapting down quickly, but up more slowly.
    return Math.max(this.fast_.getEstimate(), this.slow_.getEstimate());
  }


  /**
   * @return {boolean} True if there is enough data to produce a meaningful
   *   estimate.
   */
  hasGoodEstimate() {
    return this.requestsSampled_ >= this.minTotalRequest_;
  }
};
