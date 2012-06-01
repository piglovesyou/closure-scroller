
goog.provide('goog.ui.Scroller');

goog.require('goog.ui.Control');
goog.require('goog.ui.Slider');


/**
 * @constructor
 */
goog.ui.Scroller = function (opt_domHelper) {
  goog.base(this, '', opt_domHelper);
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
 * @type {Number}
 */
goog.ui.Scroller.prototype.scrollDistance_ = 15;


/**
 * @type {Number}
 */
goog.ui.Scroller.prototype.minThumbHeight_ = 15;


/**
 * @type {?goog.ui.Scroller.Slider}
 */
goog.ui.Scroller.prototype.slider_;


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
  var slider = new goog.ui.Scroller.Slider(this.getDomHelper());
  slider.setOrientation(goog.ui.SliderBase.Orientation.VERTICAL);
  slider.setMoveToPointEnabled(true);
  slider.setMaximum(100000);
  this.slider_ = slider;
};


/**
 * @override
 * @param {Element} element
 */
goog.ui.Scroller.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  this.slider_.render(this.getElement());
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

  var height          = this.height_          = container.offsetHeight;
  var scrollHeight    = this.scrollHeight_    = this.getScrollHeight();
  var scrollableRange = this.scrollableRange_ = scrollHeight - height;

  var enable = scrollableRange > 0;
  if (enable) {
    this.adjustThumbHeight_();
    this.adjustValueByScrollTop_();
    this.adjustUnitIncrement_();
  }
  this.setEnabled(enable);
};


/**
 * @protected
 */
goog.ui.Scroller.prototype.getScrollHeight = function () {
  return this.containerElm_.scrollHeight;
};


goog.ui.Scroller.prototype.setEnabled = function (enable) {
  goog.base(this, 'setEnabled', enable);
  this.setMouseWheelEnable_(enable);
  this.slider_.setEnabled(enable);
  this.slider_.setVisible(enable);
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
  if (!goog.dom.contains(this.slider_.getElement(), e.target)) {
    // XXX: Access to private method
    goog.ui.SliderBase.prototype.handleMouseWheel_.call(this.slider_, e);
  }
};


goog.ui.Scroller.prototype.adjustThumbHeight_ = function () {
  var height = this.height_;
  var rate = height / this.scrollHeight_;
  var thumbHeight = Math.max(rate * height, this.minThumbHeight_);
  goog.style.setHeight(this.slider_.getValueThumb(), thumbHeight);
};


goog.ui.Scroller.prototype.getScrollableRange = function () {
  return this.scrollableRange_;
};


goog.ui.Scroller.prototype.adjustUnitIncrement_ = function () {
  var valueRange = this.scrollDistance_ / this.scrollableRange_ * this.slider_.getMaximum(); 
  this.slider_.setUnitIncrement(valueRange);
};


goog.ui.Scroller.prototype.setZero = function () {
  this.slider_.setValueFromTop(0);
};


goog.ui.Scroller.prototype.getSlider = function () {
  return this.slider_;
};


goog.ui.Scroller.prototype.adjustScrollTop_ = function () {
  this.containerElm_.scrollTop = this.scrollableRange_ * this.getRate();
};

goog.ui.Scroller.prototype.getRate = function () {
  return this.slider_.getRate();
};


goog.ui.Scroller.prototype.canChangeScrollTop_ = true;


/**
 * XXX: Do I want this method?
 * Set value without dispatch CHANGE event.
 */
goog.ui.Scroller.prototype.adjustValueByScrollTop_ = function () {
  var currRate = this.containerElm_.scrollTop / this.scrollableRange_;
  var value = currRate * this.slider_.getMaximum();

  this.canChangeScrollTop_ = false;
  this.slider_.setValueFromTop(value);
  this.canChangeScrollTop_ = true;
};


goog.ui.Scroller.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  this.getHandler()
    .listen(this.slider_, goog.ui.Component.EventType.CHANGE, this.handleChange_)
    .listen(this.getElement(), goog.events.EventType.FOCUS, this.handleFocus_);
  
  this.setZero();
  this.containerElm_.scrollTop = 0;
};


goog.ui.Scroller.prototype.lastValue_ = 0;

goog.ui.Scroller.prototype.handleChange_ = function (e) {
  if (this.canChangeScrollTop_) {
    this.adjustScrollTop_();

    var currValue = this.slider_.getValueFromTop();
    this.dispatchEvent({
      type: goog.ui.Scroller.EventType.SCROLL,
      delta: this.lastValue_ < currValue ? 1 : -1
    });
    this.lastValue_ = currValue;
  }
};


goog.ui.Scroller.prototype.handleFocus_ = function (e) {
  var sliderElm = this.slider_.getElement();
  if (sliderElm && goog.style.isElementShown(sliderElm) && goog.dom.isFocusableTabIndex(sliderElm)) {
    sliderElm.focus();
  }
};







/**
 * @constructor
 */
goog.ui.Scroller.Slider = function (opt_domHelper) {
  goog.base(this, opt_domHelper);
};
goog.inherits(goog.ui.Scroller.Slider, goog.ui.SliderBase);


goog.ui.Scroller.Slider.prototype.CssBase_ = 'goog-scroller-bar'; 
  

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



goog.ui.Scroller.Slider.prototype.setValueFromTop = function (val) {
  this.setValue(this.getMaximum() - val);
};

goog.ui.Scroller.Slider.prototype.getRate = function () {
  return this.getValueFromTop() / this.getMaximum();
};

goog.ui.Scroller.Slider.prototype.getValueFromTop = function () {
  return this.getMaximum() - this.getValue();
};
