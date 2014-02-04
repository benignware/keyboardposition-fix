(function() {
  
  /**
   * fix for fixed position virtual keyboard position bug
   */
  
  var isIOS = (function() {
    if (/iP(hone|od|ad)/.test(navigator.platform)) {
      return true;
    }
    return false;
  })();
  
  var iOSVersion = (function() {
    if (isIOS) {
      var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
      var version = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
      return version[0];
    }
    return null;
  })();
  
  
  var isAndroid = (function() {
    if (/android/i.test(navigator.userAgent)) {
      return true;
    }
    return false;
  })();
  
  if (!isIOS && !isAndroid) {
    return;
  }
  
  // applies to iOS version <= 6 and android all versions
  
  
  
  // init variables
    
  var focusedElement = null;
  var fixedParent = null;
  var overflowContainer = null;
  var overflowScrollTop = 0;
  var scrollTop = 0;
  var top = 0;
  var inputSelector = "textarea, input:not([type='hidden']):not([type='checkbox']):not([type='radio'])";
  //inputSelector = "*";
  var win = window;
  var doc = document;
  
  // shared utilities
  
  function isChildOf(child, parent) {
    while((child = child.parentNode) && child !== parent); 
    return !!child; 
  }

  function matchesSelector(elem, selector) {
    return Array.prototype.indexOf.call(elem.parentNode.querySelectorAll(selector), elem) != -1;
  }
  
  function getStyle(elem, styleName) {
    return win.getComputedStyle(elem, null).getPropertyValue(styleName);
  }

  function getOverflowContainer(elem) {
    while(elem = elem.parentNode) {
      var value = elem.style.overflow;
      elem.style.overflow = "";
      var overflow = getStyle(elem, 'overflow');
      elem.style.overflow = value;
      if (overflow == 'scroll' || overflow == 'auto') {
        return elem;
      }
      if (elem == doc) break;
    }
    return null;
  }
  
  function getPosition(elem){
    var x = 0;
    var y = 0;
    while (true) {
        x += elem.offsetLeft;
        y += elem.offsetTop;
        if (elem.offsetParent === null) {
            break;
        }
        elem = elem.offsetParent;
    }
    return {x: x, y: y};
  }
  
  function getFixedParent(elem) {
    while (elem.parentNode) {
      var value = elem.style.position;
      elem.style.position = '';
      var position = getStyle(elem, "position");
      elem.style.position = value;
      if (position == 'absolute') {
        //alert('absolute parent' + elem.className);
        //return null;
      }
      if (position == 'fixed') {
        return elem;
      }
      elem = elem.parentNode;
    }
    return null;
  }
  
  
  // ios fix

  (function() {
    
    if (!isIOS) return;
     // applies to ios
    
    if (iOSVersion > 6) return; 
    // applies to ios <= 6 
    
    // TODO: dismiss keyboard on scroll
    // TODO: content gets hidden in overflow containers
    
    var scrollDiff = 0;
    var validatedHeight = 0;
    var overflowScrollTop = 0;
    
    function scrollHandler(e) {
      
      win.removeEventListener('scroll', scrollHandler);
      if (!focusedElement) return;
      if (getStyle(focusedElement, 'position') == 'static') {
        // top = scrollTop - doc.body.scrollTop + top;
        // console.log('diff: ', scrollTop - doc.body.scrollTop, "top: ", parseFloat(getStyle(fixedParent, 'top')));
        // fixedParent.style.top = top + 'px';
        if (fixedParent && getStyle(fixedParent, 'position') == 'fixed') {
          top = doc.body.scrollTop + (scrollTop - doc.body.scrollTop);
          if (overflowContainer) {
            overflowScrollTop = overflowContainer.scrollTop;
            top-= overflowScrollTop;
          }
          fixedParent.style.position = 'absolute';
          fixedParent.style.top = top + 'px';
          if (overflowContainer) {
            overflowContainer.style.height = (win.innerHeight + doc.body.scrollTop) + "px";
          }
        }

        validatedHeight = window.innerHeight;
        win.addEventListener('resize', resizeHandler);
      }
          
      
    }
    
    function resizeHandler(e) {
      if (focusedElement) {
        if (validatedHeight != window.innerHeight) {
          var diff =  window.innerHeight - validatedHeight;
          validatedHeight = window.innerHeight;
          focusedElement.blur();
        }
      }
    }
    function focusInHandler(e) {
      scrollTop = doc.body.scrollTop;
      win.removeEventListener('scroll', scrollHandler);
      if (matchesSelector(e.target, inputSelector)) {
        fixedParent = getFixedParent(e.target);
        if (focusedElement != e.target) {
          focusedElement = e.target;
          overflowContainer = getOverflowContainer(e.target);
          if (fixedParent) {
            // top = doc.body.scrollTop;
            // fixedParent.style.position = 'absolute';
            // fixedParent.style.top = top + 'px';
            win.addEventListener('scroll', scrollHandler);
            doc.addEventListener('focusout', focusOutHandler);
          }
        }
      }
    }
    
    var focusOutTimeout = null;
    
    function focusOutHandler(e) {
      doc.removeEventListener('focusout', focusOutHandler);
      win.removeEventListener('scroll', scrollHandler);
      // win.clearTimeout(focusOutTimeout);
      if (!fixedParent) return;
      //focusOutTimeout = win.setTimeout(function() {
      win.webkitRequestAnimationFrame(function() {
        var activeElement = doc.activeElement;
        if (!matchesSelector(activeElement, inputSelector) || !isChildOf(activeElement, fixedParent)) {
          top = 0;
          fixedParent.style.top = "";
          fixedParent.style.position = "";
          if (overflowContainer) {
            overflowContainer.style.height = "";
            overflowContainer.scrollTop = overflowScrollTop;
            overflowContainer = null;
          }
          focusedElement = null;
        }
      });
      //, 10);
    }
  
    doc.addEventListener('focusin', focusInHandler);
  
    
  })();
  


  // android fix

  (function() {
    
    if (!isAndroid) return;
    
    // applies to android

    // TODO: transition

    function resizeHandler(e) {
      doc.removeEventListener('focusout', focusOutHandler);
      var pos = getPosition(focusedElement);
      var top = - pos.y + win.innerHeight - focusedElement.offsetHeight - win.innerHeight * 0.25;
      top = Math.min(top, 0);
      doc.body.style.WebkitTransform = 'translate(0, ' + top + 'px)';
      doc.addEventListener('focusout', focusOutHandler);
    }
    
    function focusInHandler(e) {
      if (matchesSelector(e.target, inputSelector)) {
        focusedElement = e.target;
        fixedParent = getFixedParent(focusedElement);
        if (fixedParent) {
          win.removeEventListener('resize', resizeHandler);
          win.addEventListener('resize', resizeHandler);
        }
      }
    }
    
    function focusOutHandler(e) {
      win.setTimeout(function() {
        var activeElement = doc.activeElement;
        if (!matchesSelector(activeElement, inputSelector) || !isChildOf(activeElement, fixedParent)) {
          doc.body.style.WebkitTransform = '';
          doc.removeEventListener('focusout', focusOutHandler);
          win.removeEventListener('resize', resizeHandler);
        }
      }, 0);
    }
    
    doc.addEventListener('focusin', focusInHandler);
  
  })();
  
})();
