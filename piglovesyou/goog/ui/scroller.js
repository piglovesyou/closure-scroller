
goog.provide('goog.ui.Scroller');

goog.require('goog.ui.Control');
goog.require('goog.ui.Slider');


/**
 * @constructor
 * @param {?goog.ui.Scroller.ORIENTATION=} 
 */
goog.ui.Scroller = function (orient, opt_domHelper) {
  goog.base(this, '', opt_domHelper);

  /**
   * @type {goog.ui.Scroller.ORIENTATION}
   */
  this.orient_ = 
    orient & goog.ui.Scroller.ORIENTATION.HORIZONTAL ||
    orient & goog.ui.Scroller.ORIENTATION.BOTH ?
    orient : goog.ui.Scroller.ORIENTATION.VERTICAL; /* default */

  this.setupSlider_();
};
goog.inherits(goog.ui.Scroller, goog.ui.Control);


/**
 * @enum {String}
 */
goog.ui.Scroller.EventType = {
  SCROLL: 'scroll'
};


/**
 * @enum {Number}
 */
goog.ui.Scroller.ORIENTATION = {
  VERTICAL: 1,
  HORIZONTAL: 2,
  BOTH: 4,
};


/**
 * @type {Number}
 */
goog.ui.Scroller.prototype.scrollDistance_ = 15;


/**
 * @type {Number}
 */
goog.ui.Scroller.prototype.minThumbLength_ = 15;


/**
 * @type {?goog.ui.Scroller.Slider}
 */
goog.ui.Scroller.prototype.vslider_;


/**
 * @type {?goog.ui.Scroller.Slider}
 */
goog.ui.Scroller.prototype.hslider_;


/**
 * @type {?Element}
 */
goog.ui.Scroller.prototype.containerElm_;


/**
 * @type {?Number}
 */
goog.ui.Scroller.prototype.scrollHeight;


/**
 * @type {?Number}
 */
goog.ui.Scroller.prototype.scrollableRange_;

/**
 * @type {?Number}
 */
goog.ui.Scroller.prototype.height_;


/**
 * @type {String}
 */
goog.ui.Scroller.prototype.CssBase_ = 'goog-scroller';


/**
 * @return {boolean}
 */
goog.ui.Scroller.prototype.supportVertical = function () {
  return this.orient_ & goog.ui.Scroller.ORIENTATION.VERTICAL ||
    this.orient_ & goog.ui.Scroller.ORIENTATION.BOTH;
};


/**
 * @return {boolean}
 */
goog.ui.Scroller.prototype.supportHorizontal = function () {
  return this.orient_ & goog.ui.Scroller.ORIENTATION.HORIZONTAL ||
    this.orient_ & goog.ui.Scroller.ORIENTATION.BOTH;
};


/**
 */
goog.ui.Scroller.prototype.update = function() {
  this.update_();
};


/**
 * @override
 * @return {Element}
 */
goog.ui.Scroller.prototype.getContentElement = function() {
  return this.containerElm_;
};


/**
 * @private
 */
goog.ui.Scroller.prototype.setupSlider_ = function () {
  if (this.supportVertical()) {
    this.vslider_ = this.createSlider_(goog.ui.SliderBase.Orientation.VERTICAL);
  }
  if (this.supportHorizontal()) {
    this.hslider_ = this.createSlider_(goog.ui.SliderBase.Orientation.HORIZONTAL);
  }
};


/**
 * @return {goog.ui.Scroller.Slider}
 */
goog.ui.Scroller.prototype.createSlider_ = function (orient) {
  var slider = new goog.ui.Scroller.Slider(this.getDomHelper());
  slider.setOrientation(orient);
  slider.setMoveToPointEnabled(true);
  slider.setMaximum(100000);
  return slider;
};


/**
 * @override
 * @param {Element} element
 */
goog.ui.Scroller.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  if (this.supportVertical())   this.vslider_.render(this.getElement());
  if (this.supportHorizontal()) this.hslider_.render(this.getElement());
  this.update_();
};


/**
 * @override
 * @param {Element} element
 */
goog.ui.Scroller.prototype.canDecorate = function(element) {
  if (element && goog.dom.classes.has(element, goog.getCssName(this.CssBase_))) {
    var container = goog.dom.getElementByClass(goog.getCssName(this.CssBase_, 'container'), element);
    if (container) {
      this.containerElm_ = container;
      return true;
    }
  }
  return false;
};


/**
 * @return {Number}
 */
goog.ui.Scroller.prototype.getHeight = function () {
  return this.height_;
};


/**
 * @return {Number}
 */
goog.ui.Scroller.prototype.getWidth = function () {
  return this.width_;
};
  

goog.ui.Scroller.prototype.update_ = function () {
  var container         = this.containerElm_;

  if (this.supportVertical()) {
    var height             = this.height_           = container.offsetHeight;
    var scrollHeight       = this.scrollHeight_     = this.getScrollHeight();
    this.vscrollableRange_ = scrollHeight - height;
  }
  if (this.supportHorizontal()) {
    var width              = this.width_          = container.offsetWidth;
    var scrollWidth        = this.scrollWidth_    = this.getScrollWidth();
    this.hscrollableRange_ = scrollWidth - width;
  }
  var venable = this.isOrientEnabled(goog.ui.Scroller.ORIENTATION.VERTICAL);
  var henable = this.isOrientEnabled(goog.ui.Scroller.ORIENTATION.HORIZONTAL);

  if (venable) {
    this.adjustThumbSize_(goog.ui.Scroller.ORIENTATION.VERTICAL, henable);
    this.adjustValueByScroll_(goog.ui.Scroller.ORIENTATION.VERTICAL);
    this.adjustUnitIncrement_(goog.ui.Scroller.ORIENTATION.VERTICAL);
  }
  if (henable) {
    this.adjustThumbSize_(goog.ui.Scroller.ORIENTATION.HORIZONTAL, venable);
    this.adjustValueByScroll_(goog.ui.Scroller.ORIENTATION.HORIZONTAL);
    this.adjustUnitIncrement_(goog.ui.Scroller.ORIENTATION.HORIZONTAL);
  }

  // XXX: Because of method spec, we calc isOrientEnabled again inside of this method.
  this.setEnabled(venable || henable);
};


/**
 * @param {goog.ui.Scroller.ORIENTATION} orient
 * @return {boolean}
 */
goog.ui.Scroller.prototype.isOrientEnabled = function (orient) {
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
 */
goog.ui.Scroller.prototype.getScrollHeight = function () {
  return this.containerElm_.scrollHeight;
};


/**
 * @protected
 */
goog.ui.Scroller.prototype.getScrollWidth = function () {
  return this.containerElm_.scrollWidth;
};


/**
 * @override
 * @param {boolean} enable
 */
goog.ui.Scroller.prototype.setEnabled = function (enable) {
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


goog.ui.Scroller.prototype.setMouseWheelEnable_ = function (enable) {
  if (enable) {
    if (!this.mouseWheelHandler_) {
      this.mouseWheelHandler_ = new goog.events.MouseWheelHandler(
          this.getElement());
    }
    this.getHandler().listen(this.mouseWheelHandler_,
        goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.handleMouseWheel_);
  } else if (this.mouseWheelHandler_) {
    this.getHandler().unlisten(this.mouseWheelHandler_,
        goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, this.handleMouseWheel_);
  }
};


goog.ui.Scroller.prototype.handleMouseWheel_ = function (e) {
  // If scroller only supports HORIZONTAL, then deltaY gets effect to hslider_.
  var slider = this.supportVertical() && e.deltaY ? this.vslider_ : this.hslider_;
  if (slider && !goog.dom.contains(slider.getElement(), e.target)) {
    // XXX: Access to private method
    if (slider.getOrientation() === goog.ui.SliderBase.Orientation.HORIZONTAL) e.detail = -e.detail;
    goog.ui.SliderBase.prototype.handleMouseWheel_.call(slider, e);
  }
};


goog.ui.Scroller.prototype.adjustThumbSize_ = function (orient, isOppositEnable) {
  var len, rate, setSize, slider;
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    len = this.height_;
    rate = len / this.scrollHeight_;
    setSize = goog.style.setHeight;
    slider = this.vslider_;
  } else {
    len = this.width_;
    rate = len / this.scrollWidth_;
    setSize = goog.style.setWidth;
    slider = this.hslider_;
  }
  setSize(slider.getElement(), isOppositEnable ? len - 10 : '100%');
  var thumbSize = Math.max(rate * len, this.minThumbLength_);
  setSize(slider.getValueThumb(), thumbSize);
};


goog.ui.Scroller.prototype.getScrollableRange = function () {
  return this.supportVertical() ? this.vscrollableRange_ : this.hscrollableRange_;
};


/**
 * @param {goog.ui.Scroller.ORIENTATION} orient
 */
goog.ui.Scroller.prototype.adjustUnitIncrement_ = function (orient) {
  var scrollableRange, slider;
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    scrollableRange = this.vscrollableRange_;
    slider = this.vslider_;
  } else {
    scrollableRange = this.hscrollableRange_;
    slider = this.hslider_;
  }
  var valueRange = this.scrollDistance_ / scrollableRange * slider.getMaximum(); 
  slider.setUnitIncrement(valueRange);
};


goog.ui.Scroller.prototype.setZero = function () {
  if (this.supportVertical())   this.vslider_.setValueFromStart(0);
  if (this.supportHorizontal()) this.hslider_.setValueFromStart(0);
};


/**
 * @param {?goog.ui.Scroller.ORIENTATION=} opt_orient
 * @return {goog.ui.Scroller.Slider}
 */
goog.ui.Scroller.prototype.getSlider = function (opt_orient) {
  if (opt_orient & goog.ui.Scroller.ORIENTATION.HORIZONTAL) return this.hslider_;
  return this.vslider_;
};


/**
 * @param {goog.ui.SliderBase.Orientation} orient
 */
goog.ui.Scroller.prototype.adjustScrollTop_ = function (orient) {
  if (orient == goog.ui.SliderBase.Orientation.VERTICAL)        this.containerElm_.scrollTop =  this.vscrollableRange_ * this.vslider_.getRate();
  else if (orient == goog.ui.SliderBase.Orientation.HORIZONTAL) this.containerElm_.scrollLeft = this.hscrollableRange_ * this.hslider_.getRate();
};


/**
 * @type {boolean}
 */
goog.ui.Scroller.prototype.canChangeScroll_ = true;


/**
 * @param {goog.ui.Scroller.ORIENTATION} orient
 */
goog.ui.Scroller.prototype.adjustValueByScroll_ = function (orient) {
  var currScroll, scrollableRange, slider;
  if (orient & goog.ui.Scroller.ORIENTATION.VERTICAL) {
    currScroll = this.containerElm_.scrollTop;
    scrollableRange = this.vscrollableRange_
    slider = this.vslider_;
  } else {
    currScroll = this.containerElm_.scrollLeft;
    scrollableRange = this.hscrollableRange_
    slider = this.hslider_;
  }
  var currRate = currScroll / scrollableRange;
  var value = currRate * slider.getMaximum();
  this.canChangeScroll_ = false;
  slider.setValueFromStart(value);
  this.canChangeScroll_ = true;
};


/**
 * @override
 */
goog.ui.Scroller.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var eh = this.getHandler().listen(this.getElement(), goog.events.EventType.FOCUS, this.handleFocus_);
  
  if (this.supportVertical())   eh.listen(this.vslider_, goog.ui.Component.EventType.CHANGE, this.handleChange_);
  if (this.supportHorizontal()) eh.listen(this.hslider_, goog.ui.Component.EventType.CHANGE, this.handleChange_);
  
  this.setZero();
  this.containerElm_.scrollTop = 0;
};


/**
 * @type {Number}
 */
goog.ui.Scroller.prototype.vlastValue_ = 0;


/**
 * @type {Number}
 */
goog.ui.Scroller.prototype.hlastValue_ = 0;


/**
 * @param {goog.events.Event} e
 */
goog.ui.Scroller.prototype.handleChange_ = function (e) {
  var slider = e.target;
  if (slider && this.canChangeScroll_) {
    this.adjustScrollTop_(slider.getOrientation());

    var currValue = slider.getValueFromStart();
    this.dispatchEvent({
      type: goog.ui.Scroller.EventType.SCROLL,
      delta: this.lastValue_ < currValue ? 1 : -1
    });
    this.lastValue_ = currValue;
  }
};


/**
 * @override
 */
goog.ui.Scroller.prototype.handleKeyEventInternal = function (e) {
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
  if (slider) {
    // XXX: Access to private method.
    slider.handleKeyDown_(e);
    // SliderBase's api sucks.. return always true.
    return e.getBrowserEvent().defaultPrevented;
  }
};






/**
 * @constructor
 */
goog.ui.Scroller.Slider = function (upsidedown, opt_domHelper) {
  goog.base(this, opt_domHelper);
};
goog.inherits(goog.ui.Scroller.Slider, goog.ui.SliderBase);


goog.ui.Scroller.Slider.prototype.CssBase_ = 'goog-scroller-bar'; 
  

goog.ui.Scroller.Slider.prototype.upsidedown_ = false;


/**
 * @override
 */
goog.ui.Scroller.Slider.prototype.setOrientation = function (orient) {
  goog.base(this, 'setOrientation', orient);

  /**
   * @type {boolean}
   */
  this.upsidedown_ = orient === goog.ui.SliderBase.Orientation.VERTICAL;
};


goog.ui.Scroller.Slider.prototype.createThumbs = function() {
  var dh = this.getDomHelper();
  var element = this.getElement();
  goog.dom.classes.add(element, this.CssBase_);
  var thumb = dh.createDom('div', goog.getCssName(this.CssBase_, 'thumb'));
  dh.appendChild(element, thumb);
  this.valueThumb = this.extentThumb = thumb;
};


/**
 * @param {goog.ui.SliderBase.Orientation} orient
 * @return {String} cssName.
 */
goog.ui.Scroller.Slider.prototype.getCssClass = function(orient) {
  return orient == goog.ui.SliderBase.Orientation.VERTICAL ?
      goog.getCssName(this.CssBase_, 'vertical') :
      goog.getCssName(this.CssBase_, 'horizontal');
};


/**
 * @param {Number} val
 */
goog.ui.Scroller.Slider.prototype.setValueFromStart = function (val) {
  this.setValue(this.upsidedown_ ? this.getMaximum() - val : val);
};


/**
 * @return {Number} 0 to 1.
 */
goog.ui.Scroller.Slider.prototype.getRate = function () {
  return this.getValueFromStart() / this.getMaximum();
};


/**
 * @return {Number}
 */
goog.ui.Scroller.Slider.prototype.getValueFromStart = function () {
  return this.upsidedown_ ? this.getMaximum() - this.getValue() : this.getValue();
};
