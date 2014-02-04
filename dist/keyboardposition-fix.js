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
  var focusOutTimeout = null;
  
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
      var overflow = getStyle(elem, 'overflow');
      if (overflow == 'scroll' || overflow == 'auto') return elem;
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
    while (elem.parentNode) if (getStyle(elem, "position") == 'fixed') return elem; else elem = elem.parentNode; 
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
      doc.removeEventListener('focusout', focusOutHandler);
      var newScrollTop = doc.body.scrollTop;
      
      // use position: fixed
      //top = (scrollTop - newScrollTop) - overflowScrollTop;
      //fixedParent.style.top = top + 'px';
      
      // use position: absolute
      top = newScrollTop + (scrollTop - newScrollTop) - overflowScrollTop;
      fixedParent.style.position = 'absolute';
      
      fixedParent.style.top = top + 'px'; 
      if (overflowContainer) {
        overflowContainer.style.minHeight = (overflowContainer.scrollHeight + win.innerHeight) + "px";
      }
      doc.addEventListener('focusout', focusOutHandler);
    }
    
    
    function resizeHandler(e) {
      if (focusedElement) {
        if (validatedHeight != window.innerHeight) {
          var diff =  window.innerHeight - validatedHeight;
          validatedHeight = window.innerHeight;
          //focusedElement.blur();
        }
      }
    }
    
    function focusInHandler(e) {
      if (matchesSelector(e.target, inputSelector)) {
        if (!focusedElement) {
          scrollTop = doc.body.scrollTop;
          fixedParent = getFixedParent(e.target);
          overflowContainer = getOverflowContainer(e.target);
          overflowScrollTop = overflowContainer ? overflowContainer.scrollTop : 0;
        }
        focusedElement = e.target;
        if (fixedParent) {
          win.removeEventListener('scroll', scrollHandler);
          win.addEventListener('scroll', scrollHandler);
        }
      }
    }
    
    function focusOutHandler(e) {
      win.clearTimeout(focusOutTimeout);
      focusOutTimeout = win.setTimeout(function() {
        var activeElement = doc.activeElement;
        if (!matchesSelector(activeElement, inputSelector) || !isChildOf(activeElement, fixedParent)) {
          focusedElement = null;
          top = 0;
          fixedParent.style.top = "";
          fixedParent.style.position = "";
          if (overflowContainer) {
            overflowContainer.style.minHeight = "";
            overflowContainer.style.overflow = '';
            overflowContainer.scrollTop = overflowScrollTop;
            overflowContainer = null;
            overflowScrollTop = 0;
          }
          fixedParent.style.top = '';
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
      win.clearTimeout(focusOutTimeout);
      focusOutTimeout = win.setTimeout(function() {
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
