
goog.provide('goog.ui.Scroller');

goog.require('goog.ui.Control');
goog.require('goog.ui.Slider');


/**
 * @constructor
 */
goog.ui.Scroller = function (orient, opt_domHelper) {
  goog.base(this, '', opt_domHelper);

  /**
   * @type {goog.ui.Scroller.ORIENTATION}
   */
  this.orient_ = 
    orient & goog.ui.Scroller.ORIENTATION.HORIZONTAL ||
    orient & goog.ui.Scroller.ORIENTATION.BOTH ?
    orient : goog.ui.Scroller.ORIENTATION.VERTICAL;

  this.setupSlider_();
};
goog.inherits(goog.ui.Scroller, goog.ui.Control);


/**
 * @enum {String}
 */
goog.ui.Scroller.EventType = {
  SCROLL: 'scroll'
};


goog.ui.Scroller.ORIENTATION = {
  VERTICAL: 1,
  HORIZONTAL: 2,
  BOTH: 4,
};


goog.ui.Scroller.prototype.supportVertical = function () {
  return this.orient_ & goog.ui.Scroller.ORIENTATION.VERTICAL ||
    this.orient_ & goog.ui.Scroller.ORIENTATION.BOTH;
};


goog.ui.Scroller.prototype.supportHorizontal = function () {
  return this.orient_ & goog.ui.Scroller.ORIENTATION.HORIZONTAL ||
    this.orient_ & goog.ui.Scroller.ORIENTATION.BOTH;
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
  

goog.ui.Scroller.prototype.update_ = function () {
  var container         = this.containerElm_;
  var venable;
  var henable;
  if (this.supportVertical()) {
    var height          = this.height_          = container.offsetHeight;
    var scrollHeight    = this.scrollHeight_    = this.getScrollHeight();
    var scrollableRange = this.vscrollableRange_ = scrollHeight - height;
    venable = scrollableRange > 0;
    if (venable) {
      this.adjustThumbHeight_();
      this.adjustValueByScrollTop_();
      this.adjustUnitIncrementV_();
    }
  }
  if (this.supportHorizontal()) {
    var width          = this.width_          = container.offsetWidth;
    var scrollWidth    = this.scrollWidth_    = this.getScrollWidth();
    var scrollableRange = this.hscrollableRange_ = scrollWidth - width;
    henable = scrollableRange > 0;
    if (henable) {
      this.adjustThumbWidth_();
      this.adjustValueByScrollLeft_();
      this.adjustUnitIncrementH_();
    }
  }
  this.setEnabled(venable || henable);
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


goog.ui.Scroller.prototype.setEnabled = function (enable) {
  goog.base(this, 'setEnabled', enable);
  this.setMouseWheelEnable_(enable);
  if (this.supportVertical()) {
    this.vslider_.setEnabled(enable);
    this.vslider_.setVisible(enable);
  }
  if (this.supportHorizontal()) {
    this.hslider_.setEnabled(enable);
    this.hslider_.setVisible(enable);
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
  var slider = this.supportVertical() ? this.vslider_ : this.hslider_;
  if (!goog.dom.contains(slider.getElement(), e.target)) {
    // XXX: Access to private method

    if (slider.getOrientation() === goog.ui.SliderBase.Orientation.HORIZONTAL) e.detail = -e.detail;
    goog.ui.SliderBase.prototype.handleMouseWheel_.call(slider, e);
  }
};


goog.ui.Scroller.prototype.adjustThumbHeight_ = function () {
  var height = this.height_;
  var rate = height / this.scrollHeight_;
  var thumbHeight = Math.max(rate * height, this.minThumbLength_);
  goog.style.setHeight(this.vslider_.getValueThumb(), thumbHeight);
};


goog.ui.Scroller.prototype.adjustThumbWidth_ = function () {
  var width = this.width_;
  var rate = width / this.scrollWidth_;
  var thumbWidth = Math.max(rate * width, this.minThumbLength_);
  goog.style.setWidth(this.hslider_.getValueThumb(), thumbWidth);
};


goog.ui.Scroller.prototype.getScrollableRange = function () {
  return this.supportVertical() ? this.vscrollableRange_ : this.hscrollableRange_;
};


goog.ui.Scroller.prototype.adjustUnitIncrementV_ = function () {
  var valueRange = this.scrollDistance_ / this.vscrollableRange_ * this.vslider_.getMaximum(); 
  this.vslider_.setUnitIncrement(valueRange);
};


goog.ui.Scroller.prototype.adjustUnitIncrementH_ = function () {
  var valueRange = this.scrollDistance_ / this.hscrollableRange_ * this.hslider_.getMaximum(); 
  this.hslider_.setUnitIncrement(valueRange);
};


goog.ui.Scroller.prototype.setZero = function () {
  if (this.supportVertical())   this.vslider_.setValueFromStart(0);
  if (this.supportHorizontal()) this.hslider_.setValueFromStart(0);
};


goog.ui.Scroller.prototype.getSlider = function () {
  return this.vslider_;
};


goog.ui.Scroller.prototype.adjustScrollTop_ = function () {
  if (this.supportVertical())   this.containerElm_.scrollTop =  this.vscrollableRange_ * this.vslider_.getRate();
  if (this.supportHorizontal()) this.containerElm_.scrollLeft = this.hscrollableRange_ * this.hslider_.getRate();
};



goog.ui.Scroller.prototype.canChangeScrollTop_ = true;


/**
 * Set value without dispatch CHANGE event.
 */
goog.ui.Scroller.prototype.adjustValueByScrollTop_ = function () {
  var currRate = this.containerElm_.scrollTop / this.vscrollableRange_;
  var value = currRate * this.vslider_.getMaximum();

  this.canChangeScrollTop_ = false;
  this.vslider_.setValueFromStart(value);
  this.canChangeScrollTop_ = true;
};


/**
 * Set value without dispatch CHANGE event.
 */
goog.ui.Scroller.prototype.adjustValueByScrollLeft_ = function () {
  var currRate = this.containerElm_.scrollLeft / this.hscrollableRange_;
  var value = currRate * this.hslider_.getMaximum();

  this.canChangeScrollLeft_ = false;
  this.hslider_.setValueFromStart(value);
  this.canChangeScrollLeft_ = true;
};

goog.ui.Scroller.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var eh = this.getHandler().listen(this.getElement(), goog.events.EventType.FOCUS, this.handleFocus_);
  
  if (this.supportVertical())   eh.listen(this.vslider_, goog.ui.Component.EventType.CHANGE, this.handleChange_);
  if (this.supportHorizontal()) eh.listen(this.hslider_, goog.ui.Component.EventType.CHANGE, this.handleChange_);
  
  this.setZero();
  this.containerElm_.scrollTop = 0;
};


goog.ui.Scroller.prototype.vlastValue_ = 0;
goog.ui.Scroller.prototype.hlastValue_ = 0;

goog.ui.Scroller.prototype.handleChange_ = function (e) {
  var slider = e.target;
  if (slider && this.canChangeScrollTop_) {
    this.adjustScrollTop_();

    var currValue = slider.getValueFromStart();
    this.dispatchEvent({
      type: goog.ui.Scroller.EventType.SCROLL,
      delta: this.lastValue_ < currValue ? 1 : -1
    });
    this.lastValue_ = currValue;
  }
};


goog.ui.Scroller.prototype.handleFocus_ = function (e) {
  var sliderElm = this.supportVertical() ? this.vslider_.getElement() : this.hslider_.getElement();
  if (sliderElm && goog.style.isElementShown(sliderElm) && goog.dom.isFocusableTabIndex(sliderElm)) {
    sliderElm.focus();
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
  var thumb = dh.createDom('div', goog.getCssName(this.CssBase_, 'thumb'));
  dh.appendChild(element, thumb);
  this.valueThumb = this.extentThumb = thumb;
};


goog.ui.Scroller.Slider.prototype.getCssClass = function(orient) {
  return orient == goog.ui.SliderBase.Orientation.VERTICAL ?
      goog.getCssName(this.CssBase_, 'vertical') :
      goog.getCssName(this.CssBase_, 'horizontal');
};


goog.ui.Scroller.Slider.prototype.setValueFromStart = function (val) {
  this.setValue(this.upsidedown_ ? this.getMaximum() - val : val);
};

goog.ui.Scroller.Slider.prototype.getRate = function () {
  return this.getValueFromStart() / this.getMaximum();
};

goog.ui.Scroller.Slider.prototype.getValueFromStart = function () {
  return this.upsidedown_ ? this.getMaximum() - this.getValue() : this.getValue();
};
