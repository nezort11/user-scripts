// ==UserScript==
// @name         Always Clear PWA Badges
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Prevent PWAs/websites from showing any badge using the Badging API (setAppBadge/clearAppBadge), disables badge display.
// @author       You
// @match        https://web.telegram.org/k/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=telegram.org
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    function overrideBadging() {
        if (navigator.setAppBadge) {
            navigator.setAppBadge = function() {
                // Do nothing, or optionally always call clearAppBadge
                if (navigator.clearAppBadge) {
                    navigator.clearAppBadge();
                }
                return Promise.resolve();
            };
        }
        if (navigator.clearAppBadge) {
            navigator.clearAppBadge = function() {
                // Do nothing (badge stays clear)
                return Promise.resolve();
            };
        }
    }

    if (navigator.clearAppBadge) {
        navigator.clearAppBadge();
    }

    // Override as soon as possible (document-start), but some browsers might only define these later.
    overrideBadging();
    // Also, re-apply after page load (covers late script loading by SPA frameworks)
    window.addEventListener('DOMContentLoaded', overrideBadging);
})();