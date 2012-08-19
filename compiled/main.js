goog.provide('my.app');

goog.require('goog.ui.Scroller');

my.app = function () {

    var vscroller = new goog.ui.Scroller;
    var velm = goog.dom.getElement('my-vscroller');
    vscroller.decorate(velm);
    var vbutton = goog.dom.getElement('vdecrementButton');
    vbutton.removeAttribute('disabled');
    goog.events.listen(vbutton, 'click', goog.bind(decrement, null, vscroller));

    var hscroller = new goog.ui.Scroller(goog.ui.Scroller.ORIENTATION.HORIZONTAL);
    var helm = goog.dom.getElement('my-hscroller');
    hscroller.decorate(helm);
    var hbutton = goog.dom.getElement('hdecrementButton');
    hbutton.removeAttribute('disabled');
    goog.events.listen(hbutton, 'click', goog.bind(decrement, null, hscroller));

    var bscroller = new goog.ui.Scroller(goog.ui.Scroller.ORIENTATION.BOTH);
    var belm = goog.dom.getElement('my-bscroller');
    bscroller.decorate(belm);
    var bbutton = goog.dom.getElement('bdecrementButton');
    bbutton.removeAttribute('disabled');
    goog.events.listen(bbutton, 'click', goog.bind(decrement, null, bscroller));

    function decrement (scroller, e) {
      var container = scroller.getContentElement()
      var item = goog.dom.getLastElementChild(container);
      if (item) {
        goog.dom.removeNode(item);
        scroller.update();
        // br
        var br = goog.dom.getLastElementChild(container);
        if (br && br.nodeName == goog.dom.TagName.BR) goog.dom.removeNode(br);
        if (goog.dom.getChildren(container).length == 0) {
          var buttonElm = e.target;
          buttonElm.setAttribute('disabled', 'disabled');
          goog.events.unlisten(buttonElm, 'click', decrement);
        }
      }
    }
  
};

goog.exportSymbol('my.app', my.app);
