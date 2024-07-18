// ==UserScript==
// @name         Dark mode
// @namespace    https://github.com/grisha765
// @version      0.0.2
// @description  Enable dark mode with only one line of CSS, and check for built-in dark theme support
// @author       Grisha Golyam
// @license      none
// @match        *://*/*
// @grant        none
// @downloadURL  https://github.com/grisha765/dark_mode_websites/raw/main/dark-mode.user.js
// @updateURL    https://github.com/grisha765/dark_mode_websites/raw/main/dark-mode.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // Apply initial dark theme as soon as possible
    const initialStyle = document.createElement('style');
    initialStyle.textContent = `
        html, body {
            background-color: #111 !important;
            color: #eee !important;
            visibility: hidden;
        }
    `;
    document.head.appendChild(initialStyle);

    window.addEventListener('load', function () {
        // Function to determine if the site is already in dark mode
        function isDarkMode() {
            const bgColor = window.getComputedStyle(document.body).backgroundColor;
            if (!bgColor) return false;

            const rgb = bgColor.match(/\d+/g);
            if (!rgb || rgb.length < 3) return false;

            const [r, g, b] = rgb.map(Number);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness < 128;
        }

        // Remove the initial dark theme
        document.head.removeChild(initialStyle);

        // If the site is already in dark mode, show the page and do nothing
        if (isDarkMode()) {
            document.body.style.visibility = 'visible';
            return;
        }

        // Apply dark mode
        const style = document.createElement('style');
        style.textContent = `
            html {
                filter: invert(1) hue-rotate(180deg) contrast(0.8);
            }

            /** reverse filter for media elements */
            img, video, picture, canvas, iframe, embed {
                filter: invert(1) hue-rotate(180deg);
            }

            body {
                visibility: visible;
            }
        `;
        document.head.appendChild(style);
    });
}());

