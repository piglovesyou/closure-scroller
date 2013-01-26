/**
 * @license
 * Copyright (c) 2012 Soichi Takamura (http://stakam.net/).
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

goog.provide('goog.ui.Scroller');

goog.require('goog.ui.Control');
goog.require('goog.ui.Slider');


/**
 * Provides natural scrolling UI similar to browser native.
 * @constructor
 * @param {?goog.ui.Scroller.ORIENTATION=} opt_orient Scrolling
 *    direction which you can choose VERTICAL, HORIZONTAL, BOTH.
 *    The default value is VERTICAL.
 * @param {goog.dom.DomHelper=} opt_domHelper .
 * @extends {goog.ui.Control}
 */
goog.ui.Scroller = function(opt_orient, opt_domHelper) {
  goog.base(this, '', null, opt_domHelper);

  /**
   * @type {goog.ui.Scroller.ORIENTATION}
   * @private
   */
  this.orient_ = /** @type {goog.ui.Scroller.ORIENTATION} */
    (opt_orient & goog.ui.Scroller.ORIENTATION.HORIZONTAL ||
    opt_orient & goog.ui.Scroller.ORIENTATION.BOTH ?
    opt_orient : goog.ui.Scroller.ORIENTATION.VERTICAL); /* default */

  this.setupSlider_();
};
goog.inherits(goog.ui.Scroller, goog.ui.Control);


/**
 * @enum {string}
 */
goog.ui.Scroller.EventType = {
  SCROLL: 'scroll'
};


/**
 * @enum {number}
 */
goog.ui.Scroller.ORIENTATION = {
  VERTICAL: 1,
  HORIZONTAL: 2,
  BOTH: 4
};


/**
 * Scrolling distance of each MouseWheelEvent / KeyEvent.
 * Sets smaller in Mac. This works fine for my env but what do you think?
 * @type {number}
 * @private
 */
goog.ui.Scroller.prototype.scrollDistance_ = goog.userAgent.MAC ? 4 : 15;


/**
 * Minimum size of a thumb in scroll bar. Use setMinThumbLength to change.
 * @type {number}
 * @private
 */
goog.ui.Scroller.prototype.minThumbLength_ = 15;


/**
 * Because some OS and browser provides large delta by MouseWheelEvent,
 * this limits it by the fine degree.
 * @type {number}
 * @private
 */
goog.ui.Scroller.prototype.maxDelta_ = 40;


/**
 * A place holder of a vertical scroll bar.
 * @type {?goog.ui.Scroller.Slider}
 * @private
 */
goog.ui.Scroller.prototype.vslider_;


/**
 * A place holder of a horizontal scroll bar.
 * @type {?goog.ui.Scroller.Slider}
 * @private
 */
goog.ui.Scroller.prototype.hslider_;


/**
 * DOM in which child components get.
 * @type {?Element}
 * @private
 */
goog.ui.Scroller.prototype.containerElm_;


/**
 * Private cache of scroll height of containerElm_.
 * @type {?number}
 * @private
 */
goog.ui.Scroller.prototype.scrollHeight_;


/**
 * Private cache of vertical scrollable range of containerElm_.
 * @type {?number}
 * @private
 */
goog.ui.Scroller.prototype.vscrollableRange_;


/**
 * Private cache of horizontal scrollable range of containerElm_.
 * @type {?number}
 * @private
 */
goog.ui.Scroller.prototype.hscrollableRange_;


/**
 * Private cache of containerElm_ height.
 * @type {?number}
 * @private
 */
goog.ui.Scroller.prototype.height_;


/**
 * Private cache of containerElm_ width.
 * @type {?number}
 * @private
 */
goog.ui.Scroller.prototype.width_;


/**
 * @type {string}
 * @private
 */
goog.ui.Scroller.prototype.CssBase_ = 'goog-scroller';


/**
 * Sometimes we want to change slider's value without extra handling.
 * This flag is referred in handleChange_ to know whether we should
 * handle the event or not.
 * @type {boolean}
 * @private
 */
goog.ui.Scroller.prototype.canChangeScroll_ = true;


/**
 * Private cache of last value of vertical slider.
 * @type {number}
 * @private
 */
goog.ui.Scroller.prototype.vlastValue_ = 0;


/**
 * Private cache of last value of horizontal slider.
 * @type {number}
 * @private
 */
goog.ui.Scroller.prototype.hlastValue_ = 0;


/**
 * @param {number} min .
 */
goog.ui.Scroller.prototype.setMinThumbLength = function(min) {
  this.minThumbLength_ = min;
};


/**
 * @return {boolean} Whether the scroller supports VERTICAL orientation.
 */
goog.ui.Scroller.prototype.supportVertical = function() {
  return !!(this.orient_ & goog.ui.Scroller.ORIENTATION.VERTICAL ||
    this.orient_ & goog.ui.Scroller.ORIENTATION.BOTH);
};


/**
 * @return {boolean} Whether the scroller supports HORIZONTAL orientation.
 */
goog.ui.Scroller.prototype.supportHorizontal = function() {
  return !!(this.orient_ & goog.ui.Scroller.ORIENTATION.HORIZONTAL ||
    this.orient_ & goog.ui.Scroller.ORIENTATION.BOTH);
};


/**
 * Public interface to update all inner cache of the scroller.
 * Call this when the content height/width was changed.
 */
goog.ui.Scroller.prototype.update = function() {
  this.update_();
};


/**
 * @override
 * @return {Element} .
 */
goog.ui.Scroller.prototype.getContentElement = function() {
  return this.containerElm_;
};


/**
 * @private
 */
goog.ui.Scroller.prototype.setupSlider_ = function() {
  if (this.supportVertical()) {
    this.vslider_ = this.createSlider_(goog.ui.SliderBase.Orientation.VERTICAL);
  }
  if (this.supportHorizontal()) {
    this.hslider_ =
      this.createSlider_(goog.ui.SliderBase.Orientation.HORIZONTAL);
  }
};


/**
 * @param {goog.ui.SliderBase.Orientation} orient .
 * @return {goog.ui.Scroller.Slider} .
 * @private
 */
goog.ui.Scroller.prototype.createSlider_ = function(orient) {
  var slider = new goog.ui.Scroller.Slider(this.getDomHelper());
  slider.setOrientation(orient);
  slider.setMoveToPointEnabled(true);
  slider.setMaximum(100000);
  slider.setBlockIncrementFn(goog.bind(this.getBlockIncrement_, this));
  return slider;
};


/**
 * @param {goog.ui.SliderBase.Orientation} orient .
 * @param {number} unitInc .
 * @return {number} .
 * @private
 */
goog.ui.Scroller.prototype.getBlockIncrement_ = function(orient, unitInc) {
  return (orient == goog.ui.SliderBase.Orientation.VERTICAL ?
    this.height_ : this.width_) / this.scrollDistance_ * unitInc;
};


/**
 * @override
 * @param {Element} element .
 */
goog.ui.Scroller.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  this.renderSliders_();
};


/**
 * @override
 * @param {Element} element .
 */
goog.ui.Scroller.prototype.canDecorate = function(element) {
  if (element && goog.dom.classes.has(element, this.CssBase_)) {
    var container = goog.dom.getElementByClass(
        goog.getCssName(this.CssBase_, 'container'), element);
    if (container) {
      this.containerElm_ = container;
      return true;
    }
  }
  return false;
};


/** @inheritDoc */
goog.ui.Scroller.prototype.createDom = function() {
  var dh = this.getDomHelper();
  var element = dh.createDom('div', this.CssBase_,
      this.containerElm_ =
        dh.createDom('div', goog.getCssName(this.CssBase_, 'container')));
  this.setElementInternal(element);
  this.renderSliders_();
};


/**
 * @private
 */
goog.ui.Scroller.prototype.renderSliders_ = function() {
  if (this.supportVertical()) {
    this.vslider_.render(this.getElement());
    this.vslider_.setValueFromStart(0);
  }
  if (this.supportHorizontal()) {
    this.hslider_.render(this.getElement());
    this.hslider_.setValueFromStart(0);
  }
};


/**
 * @return {?number} .
 */
goog.ui.Scroller.prototype.getHeight = function() {
  return this.height_;
};


/**
 * @return {?number} .
 */
goog.ui.Scroller.prototype.getWidth = function() {
  return this.width_;
};


/**
 * @private
 */
goog.ui.Scroller.prototype.update_ = function() {
  var container = this.containerElm_;
  if (this.supportVertical()) {
    var height = this.height_ = container.offsetHeight;
    var scrollHeight = this.scrollHeight_ = this.getScrollHeight();
    this.vscrollableRange_ = scrollHeight - height;
  }
  if (this.supportHorizontal()) {
    var width = this.width_ = container.offsetWidth;
    var scrollWidth = this.scrollWidth_ = this.getScrollWidth();
    this.hscrollableRange_ = scrollWidth - width;
  }
  var venable = this.isOrientEnabled(goog.ui.Scroller.ORIENTATION.VERTICAL);
  var henable = this.isOrientEnabled(goog.ui.Scroller.ORIENTATION.HORIZONTAL);

  if (this.supportVertical()) {
    this.adjustThumbSize_(goog.ui.Scroller.ORIENTATION.VERTICAL, henable);
    this.adjustValueByScroll_(goog.ui.Scroller.ORIENTATION.VERTICAL);
    this.adjustUnitIncrement_(goog.ui.Scroller.ORIENTATION.VERTICAL);
  }
  if (this.supportHorizontal()) {
    this.adjustThumbSize_(goog.ui.Scroller.ORIENTATION.HORIZONTAL, venable);
    this.adjustValueByScroll_(goog.ui.Scroller.ORIENTATION.HORIZONTAL);
    this.adjustUnitIncrement_(goog.ui.Scroller.ORIENTATION.HORIZONTAL);
  }

  // XXX: Because the method accepts only one argument,
  //        we calc isOrientEnabled again inside of this method.
  this.setEnabled(venable || henable);
};


/**
 * @param {goog.ui.Scroller.ORIENTATION} orient .
 * @return {boolean} .
 */
goog.ui.Scroller.prototype.isOrientEnabled = function(orient) {
  var support, scrollableRange;
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    return this.supportVertical() && this.vscrollableRange_ > 0;
  } else if (orient & goog.ui.Scroller.ORIENTATION.HORIZONTAL) {
    return this.supportHorizontal() && this.hscrollableRange_ > 0;
  }
  return false;
};


/**
 * @protected
 * @return {number} .
 */
goog.ui.Scroller.prototype.getScrollHeight = function() {
  return this.containerElm_.scrollHeight;
};


/**
 * @return {number} .
 * @protected
 */
goog.ui.Scroller.prototype.getScrollWidth = function() {
  return this.containerElm_.scrollWidth;
};


/**
 * @override
 * @param {boolean} enable .
 */
goog.ui.Scroller.prototype.setEnabled = function(enable) {
  goog.base(this, 'setEnabled', enable);
  this.setMouseWheelEnable_(enable);

  var venable = this.isOrientEnabled(goog.ui.Scroller.ORIENTATION.VERTICAL);
  var henable = this.isOrientEnabled(goog.ui.Scroller.ORIENTATION.HORIZONTAL);

  if (this.supportVertical()) {
    this.vslider_.setEnabled(venable);
    this.vslider_.setVisible(venable);
  }
  if (this.supportHorizontal()) {
    this.hslider_.setEnabled(henable);
    this.hslider_.setVisible(henable);
  }
};


/**
 * @type {?goog.events.MouseWheelHandler}
 */
goog.ui.Scroller.prototype.mouseWheelHandler_;


/**
 * Switch mouse wheel event listening.
 * @param {boolean} enable .
 * @private
 */
goog.ui.Scroller.prototype.setMouseWheelEnable_ = function(enable) {
  if (enable) {
    if (!this.mouseWheelHandler_) {
      this.mouseWheelHandler_ = new goog.events.MouseWheelHandler(
          this.getElement());
    }
    this.getHandler().listen(this.mouseWheelHandler_,
        goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
        this.handleMouseWheel_);
  } else if (this.mouseWheelHandler_) {
    this.getHandler().unlisten(this.mouseWheelHandler_,
        goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
        this.handleMouseWheel_);
  }
};


/**
 * @param {goog.events.MouseWheelEvent} e .
 * @private
 */
goog.ui.Scroller.prototype.handleMouseWheel_ = function(e) {
  // If scroller only supports HORIZONTAL, then deltaY gets effect to hslider_.
  var slider = this.supportVertical() && e.deltaY ?
      this.vslider_ : this.hslider_;
  if (slider) {
    var isPositive = e.detail > 0;
    var val = slider.getValueFromStart();
    if ((!isPositive && val == slider.getMinimum()) ||
        (isPositive && val == slider.getMaximum())) {
      return;
    }
    slider.moveThumbs(slider.getUnitIncrement() *
        -goog.ui.Scroller.calcNiceDetail_(slider, e.detail,
                                          isPositive, this.maxDelta_));
    e.preventDefault();
  }
};


/**
 * @param {goog.ui.Scroller.Slider} slider .
 * @param {number} detail .
 * @param {boolean} isPositive .
 * @param {number} max .
 * @return {number} .
 * @private
 */
goog.ui.Scroller.calcNiceDetail_ = function(slider, detail, isPositive, max) {
  if (goog.userAgent.WEBKIT && goog.userAgent.MAC) {
    detail = detail / 20;
    detail = isPositive ? Math.ceil(detail) : Math.floor(detail);
  }
  if (slider.getOrientation() === goog.ui.SliderBase.Orientation.HORIZONTAL) {
    detail = -detail;
  }
  return goog.math.clamp(detail, -max, max);
};


/**
 * @param {goog.ui.Scroller.ORIENTATION} orient .
 * @param {boolean} enableOpposit .
 * @private
 */
goog.ui.Scroller.prototype.adjustThumbSize_ = function(orient, enableOpposit) {
  var len, rate, setSize, slider, oppositBarWidth;
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    len = this.height_;
    rate = len / this.scrollHeight_;
    setSize = goog.style.setHeight;
    slider = this.vslider_;
    if (enableOpposit) {
      oppositBarWidth = this.hslider_.getElement().offsetHeight;
    }
  } else {
    len = this.width_;
    rate = len / this.scrollWidth_;
    setSize = goog.style.setWidth;
    slider = this.hslider_;
    if (enableOpposit) {
      oppositBarWidth = this.vslider_.getElement().offsetWidth;
    }
  }
  setSize(slider.getElement(),
          goog.isDefAndNotNull(oppositBarWidth) ?
            len - oppositBarWidth : '100%');
  var thumbSize = Math.max(rate * len, this.minThumbLength_);
  setSize(slider.getValueThumb(), thumbSize);
};


/**
 * @param {?goog.ui.Scroller.ORIENTATION=} opt_orient .
 * @return {?number} .
 */
goog.ui.Scroller.prototype.getScrollableRange = function(opt_orient) {
  if (opt_orient & goog.ui.Scroller.ORIENTATION.HORIZONTAL) {
    return this.hscrollableRange_;
  }
  return this.vscrollableRange_;
};


/**
 * @param {goog.ui.Scroller.ORIENTATION} orient .
 * @private
 */
goog.ui.Scroller.prototype.adjustUnitIncrement_ = function(orient) {
  var scrollableRange, slider;
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    scrollableRange = this.vscrollableRange_;
    slider = this.vslider_;
  } else {
    scrollableRange = this.hscrollableRange_;
    slider = this.hslider_;
  }
  goog.asserts.assert(goog.isNumber(scrollableRange) && slider);
  this.updateMaximumIfNeeded_(slider, scrollableRange);
  var valueRange = this.scrollDistance_ / scrollableRange * slider.getMaximum();
  slider.setUnitIncrement(Math.max(valueRange, 1));
};


/**
 * If scrollableRange_ is very large, we should set slider maximum larger
 *   in order to emulate more precise scrollDistance_.
 * TODO: We can set optimum maximum everytime on update.
 * @param {goog.ui.Scroller.Slider} slider .
 * @param {number} scrollableRange .
 * @private
 */
goog.ui.Scroller.prototype.updateMaximumIfNeeded_ =
    function(slider, scrollableRange) {
  var m = slider.getMaximum();
  while (scrollableRange / m > 1) m *= 10;
  if (m > slider.getMaximum()) {
    this.canChangeScroll_ = false;
    var rate = slider.getRate();
    slider.setMaximum(m);
    slider.setValueFromStart(m * rate);
    this.canChangeScroll_ = true;
  }
};


/**
 */
goog.ui.Scroller.prototype.setZero = function() {
  if (this.supportVertical()) this.vslider_.setValueFromStart(0);
  if (this.supportHorizontal()) this.hslider_.setValueFromStart(0);
};


/**
 * @param {?goog.ui.Scroller.ORIENTATION=} opt_orient .
 * @return {goog.ui.Scroller.Slider} .
 */
goog.ui.Scroller.prototype.getSlider = function(opt_orient) {
  if (opt_orient & goog.ui.Scroller.ORIENTATION.HORIZONTAL) {
    return this.hslider_;
  }
  return this.vslider_;
};


/**
 * @param {goog.ui.Scroller.ORIENTATION} orient .
 * @protected
 */
goog.ui.Scroller.prototype.adjustScrollTop = function(orient) {
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    this.containerElm_.scrollTop =
      this.vscrollableRange_ * this.vslider_.getRate();
  } else if (orient == goog.ui.Scroller.ORIENTATION.HORIZONTAL) {
    this.containerElm_.scrollLeft =
      this.hscrollableRange_ * this.hslider_.getRate();
  }
};


/**
 * @param {goog.ui.Scroller.ORIENTATION} orient .
 * @protected
 * @suppress {underscore}
 */
goog.ui.Scroller.prototype.adjustValueByScroll_ = function(orient) {
  var currScroll, scrollableRange, slider;
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    currScroll = this.containerElm_.scrollTop;
    scrollableRange = this.vscrollableRange_;
    slider = this.vslider_;
  } else {
    currScroll = this.containerElm_.scrollLeft;
    scrollableRange = this.hscrollableRange_;
    slider = this.hslider_;
  }
  var currRate = scrollableRange > 0 ? currScroll / scrollableRange : 0;
  var value = currRate * slider.getMaximum();
  this.canChangeScroll_ = false;
  slider.setValueFromStart(value);
  this.canChangeScroll_ = true;
};


/**
 * Prepare all event listening and update at last.
 * @inheritDoc
 */
goog.ui.Scroller.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  if (this.supportVertical()) {
    this.getHandler().listen(this.vslider_,
        goog.ui.Component.EventType.CHANGE, this.handleChange_);
  }
  if (this.supportHorizontal()) {
    this.getHandler().listen(this.hslider_,
        goog.ui.Component.EventType.CHANGE, this.handleChange_);
  }

  this.update_();
};


/**
 * @param {goog.events.Event} e Handles both vslider_ and hslider_.
 * @private
 */
goog.ui.Scroller.prototype.handleChange_ = function(e) {
  if (!this.canChangeScroll_) return;
  var slider = e.target;
  goog.asserts.assertInstanceof(slider, goog.ui.Scroller.Slider);

  var orient =
    slider.getOrientation() === goog.ui.SliderBase.Orientation.VERTICAL ?
      goog.ui.Scroller.ORIENTATION.VERTICAL :
      goog.ui.Scroller.ORIENTATION.HORIZONTAL;
  this.adjustScrollTop(orient);

  var lastValue = orient & goog.ui.Scroller.ORIENTATION.VERTICAL ?
    this.vlastValue_ : this.hlastValue_;
  var currValue = slider.getValueFromStart();
  this.dispatchEvent({
    type: goog.ui.Scroller.EventType.SCROLL,
    delta: lastValue < currValue ? 1 : -1
  });
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    this.vlastValue_ = currValue;
  } else {
    this.hlastValue_ = currValue;
  }
};


/**
 * @inheritDoc
 * @param {goog.events.KeyEvent} e Key event to handle.
 * @return {boolean} .
 */
goog.ui.Scroller.prototype.handleKeyEventInternal = function(e) {
  var orient = this.orient_;
  var slider;
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    slider = this.vslider_;
  } else if (orient & goog.ui.Scroller.ORIENTATION.HORIZONTAL) {
    slider = this.hslider_;
  } else if (orient & goog.ui.Scroller.ORIENTATION.BOTH) {
    if (e.keyCode == goog.events.KeyCodes.LEFT ||
        e.keyCode == goog.events.KeyCodes.RIGHT) {
      slider = this.hslider_;
    } else {
      slider = this.vslider_;
    }
  }
  if (e.keyCode == goog.events.KeyCodes.SPACE) {
    slider.moveThumbsFromStart(e.shiftKey ?
        slider.getBlockIncrement() : -slider.getBlockIncrement());
    return true;
  }
  if (slider) {
    // XXX: Access to private method.
    slider.handleKeyDown_(e);
    // SliderBase's api sucks.. return always true.
    return e.getBrowserEvent().defaultPrevented;
  } else {
    return false;
  }
};


/** @inheritDoc */
goog.ui.Scroller.prototype.disposeInternal = function() {
  if (this.vslider_) {
    this.vslider_.dispose();
    this.vslider_ = null;
  }
  if (this.hslider_) {
    this.hslider_.dispose();
    this.hslider_ = null;
  }
  if (this.mouseWheelHandler_) {
    this.mouseWheelHandler_.dispose();
    this.mouseWheelHandler_ = null;
  }
  goog.base(this, 'disposeInternal');
};




/**
 * Slider used as a scroll bar of the goog.ui.Scroller.
 * @constructor
 * @param {goog.dom.DomHelper=} opt_domHelper .
 * @extends {goog.ui.SliderBase}
 */
goog.ui.Scroller.Slider = function(opt_domHelper) {
  goog.base(this, opt_domHelper);
};
goog.inherits(goog.ui.Scroller.Slider, goog.ui.SliderBase);


/**
 * @private
 * @type {string}
 */
goog.ui.Scroller.Slider.prototype.CssBase_ = 'goog-scroller-bar';


/**
 * If vertical, `top' should be zero. If horizontal, `left' should be zero.
 * @return {boolean} .
 * @private
 */
goog.ui.Scroller.Slider.prototype.shouldUpsideDown_ = function() {
  return this.getOrientation() === goog.ui.SliderBase.Orientation.VERTICAL;
};


/** @inheritDoc */
goog.ui.Scroller.Slider.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  // Slider doesn't need focused state. Only scroller does.
  goog.dom.setFocusableTabIndex(this.getElement(), false);
};


/** @inheritDoc */
goog.ui.Scroller.Slider.prototype.createThumbs = function() {
  var dh = this.getDomHelper();
  var element = this.getElement();
  goog.dom.classes.add(element, this.CssBase_);
  var thumb = /** @type {HTMLDivElement} */(
      dh.createDom('div', goog.getCssName(this.CssBase_, 'thumb')));
  dh.appendChild(element, thumb);
  this.valueThumb = this.extentThumb = thumb;
};


/**
 * @param {goog.ui.SliderBase.Orientation} orient .
 * @return {string} cssName.
 */
goog.ui.Scroller.Slider.prototype.getCssClass = function(orient) {
  return orient == goog.ui.SliderBase.Orientation.VERTICAL ?
      goog.getCssName(this.CssBase_, 'vertical') :
      goog.getCssName(this.CssBase_, 'horizontal');
};


/**
 * @param {number} val .
 */
goog.ui.Scroller.Slider.prototype.setValueFromStart = function(val) {
  this.setValue(this.shouldUpsideDown_() ? this.getMaximum() - val : val);
};


/**
 * @return {number} Rate of current value. 0 to 1.
 */
goog.ui.Scroller.Slider.prototype.getRate = function() {
  return this.getValueFromStart() / this.getMaximum();
};


/**
 * @param {number} delta .
 */
goog.ui.Scroller.Slider.prototype.moveThumbsFromStart = function(delta) {
  this.moveThumbs(this.shouldUpsideDown_() ? delta : -delta);
};


/**
 * @return {number} .
 */
goog.ui.Scroller.Slider.prototype.getValueFromStart = function() {
  return this.shouldUpsideDown_() ?
      this.getMaximum() - this.getValue() : this.getValue();
};


/**
 * We don't use mouseWheeel for a slider.
 * @inheritDoc
 */
goog.ui.Scroller.Slider.prototype.isHandleMouseWheel = function() {
  return false;
};


/**
 * TODO: Set function in constructor. 
 * @type {Function}
 * @private
 */
goog.ui.Scroller.Slider.prototype.blockIncrementFn_ = goog.nullFunction;


/**
 * @param {Function} fn .
 */
goog.ui.Scroller.Slider.prototype.setBlockIncrementFn = function(fn) {
  this.blockIncrementFn_ = fn;
};


/**
 * Because the slider does not know how much it should move (block increment),
 * slider has to use scroller's getter function. 
 * @inheritDoc
 */
goog.ui.Scroller.Slider.prototype.getBlockIncrement = function() {
  return this.blockIncrementFn_(this.getOrientation(), this.getUnitIncrement());
};
