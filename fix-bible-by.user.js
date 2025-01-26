// ==UserScript==
// @name         Fix bible.by
// @namespace    http://tampermonkey.net/
// @version      2025-01-26
// @description  Fix bible.by
// @author       You
// @match        https://bible.by/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bible.by
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  !(function (e) {
    e(function () {
      function e() {
        var e = document.getElementsByTagName("body")[0],
          n = "";
        if ("undefined" != typeof window.getSelection) {
          var t = window.getSelection();
          if (t.rangeCount) {
            for (
              var o = document.createElement("div"),
                i = 0,
                r = t.rangeCount;
              r > i;
              ++i
            )
              o.appendChild(t.getRangeAt(i).cloneContents());
            n = o.innerHTML;
          }
          if (!(n.toString().split(" ").length < 7)) {
            var l = document.title.split("—")?.[0]?.trim?.(),
              a = n + " " + l,
              d = document.createElement("div");
            (d.style.position = "absolute"),
              (d.style.left = "-99999px"),
              e.appendChild(d),
              (d.innerHTML = a),
              t.selectAllChildren(d),
              window.setTimeout(function () {
                e.removeChild(d);
              }, 0);
          }
        }
      }
      document.oncopy = e;
    });
  })(jQuery);
})();
