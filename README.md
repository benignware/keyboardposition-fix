picker-fix
==========

This fix addresses flawed virtual keyboard positioning within fixed elements on ios6 and android 

Issue
-----

When focusing input elements contained in fixed positioned elements that trigger the virtual keyboard, the screen isn't properly adjusted on iOS6 and Android. 
This makes the UI inusable if the keyboard hides the focused element and also comes with adhoc position flickering.  

The issue is described here...

http://getbootstrap.com/getting-started/#support-fixed-position-keyboards
http://stackoverflow.com/questions/7970389/ios-5-fixed-positioning-and-virtual-keyboard

Fix
-----------------
The fix hooks in the focusin-event of the document. 
It needs to be executed only once in a document's lifetime. 

In iOS7 the issue seems to be resolved and the fix is not applied.