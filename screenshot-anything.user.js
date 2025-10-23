// ==UserScript==
// @name         Tab Screenshot to JPG
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Take a screenshot of the current tab as JPG via action button (menu command)
// @author       you
// @match        *://*/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    async function screenshotAndDownload() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "browser" } });
            const track = stream.getVideoTracks()[0];

            let width, height, canvas, ctx;

            // Try using ImageCapture (best quality)
            if ('ImageCapture' in window) {
                const imageCapture = new ImageCapture(track);
                const bitmap = await imageCapture.grabFrame();
                width = bitmap.width;
                height = bitmap.height;
                canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                ctx = canvas.getContext('2d');
                ctx.drawImage(bitmap, 0, 0);
            } else {
                // Fallback for browsers without ImageCapture
                const video = document.createElement('video');
                video.srcObject = stream;
                await video.play();
                width = video.videoWidth;
                height = video.videoHeight;
                canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, width, height);
                video.pause();
            }

            // Download as JPG
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.download = 'screenshot.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            track.stop();
        } catch (e) {
            alert('Screenshot failed: ' + e);
            console.error(e);
        }
    }

    // Register extension action menu in Tampermonkey
    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand('⚡ Take Screenshot', screenshotAndDownload, 's');
    }
})();
