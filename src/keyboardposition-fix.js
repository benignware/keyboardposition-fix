(function() {
  
  /**
   * fix for fixed position virtual keyboard position bug
   */
  
  var isIOS6 = (function() {
    if (/iP(hone|od|ad)/.test(navigator.platform)) {
      var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
      var version = [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
      if (version[0] <= 6) return true;
    }
    return false;
  })();
  
  
  var isAndroid = (function() {
    if (/android/i.test(navigator.userAgent)) {
      return true;
    }
    return false;
  })();
  
  if (!isIOS6 && !isAndroid) {
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
    while(elem) {
      var overflow = getStyle(elem, 'overflow');
      if (overflow == 'scroll' || overflow == 'auto') {
        return elem;
      }
      elem = elem.parentNode;
      if (elem == doc) break;
    }
    return null;
  }
  
  function getFixedParent(elem) {
    while (elem.parentNode) {
      if (getStyle(elem, "position") == 'fixed') {
        return elem;
      }
      elem = elem.parentNode;
    }
    return null;
  }
  
  
  // ios fix

  (function() {
    
    if (!isIOS6) return;
    
    // applies to ios <= 6
    
    
    // TODO: dismiss keyboard on scroll
    // TODO: content gets hidden in overflow containers
  
    function scrollHandler(e) {
      top = scrollTop - doc.body.scrollTop + top;
      fixedParent.style.WebkitTransform = 'translate(0, ' + top + 'px)';
      win.removeEventListener('scroll', scrollHandler);
      doc.removeEventListener('focusout', focusOutHandler);
      doc.addEventListener('focusout', focusOutHandler);
    }
    
    function focusInHandler(e) {
      if (matchesSelector(e.target, inputSelector)) {
        scrollTop = doc.body.scrollTop;
        focusedElement = e.target;
        fixedParent = getFixedParent(focusedElement);
        if (fixedParent) {
          win.removeEventListener('scroll', scrollHandler);
          win.addEventListener('scroll', scrollHandler);
        }
      }
    }
    
    function focusOutHandler(e) {
      win.setTimeout(function() {
        var activeElement = doc.activeElement;
        if (!matchesSelector(activeElement, inputSelector) || !isChildOf(activeElement, fixedParent)) {
          top = 0;
          fixedParent.style.WebkitTransform = '';
          doc.removeEventListener('focusout', focusOutHandler);
          win.removeEventListener('scroll', scrollHandler);
        }
      }, 0);
    }
  
    doc.addEventListener('focusin', focusInHandler);
  
    
  })();
  


  // android fix

  (function() {
    
    if (!isAndroid) return;
    
    // applies to android

    // TODO: transition

    function resizeHandler(e) {
      var pos = getPosition(focusedElement);
      var top = - pos.y + win.innerHeight - focusedElement.offsetHeight - win.innerHeight * 0.25;
      doc.body.style.WebkitTransform = 'translate(0, ' + top + 'px)';
      win.removeEventListener('resize', resizeHandler);
      doc.removeEventListener('focusout', focusOutHandler);
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
