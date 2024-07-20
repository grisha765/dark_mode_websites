// ==UserScript==
// @name         Dark mode
// @namespace    https://github.com/grisha765
// @version      0.0.8
// @description  Enable dark mode with only one line of CSS, and check for built-in dark theme support
// @author       Grisha Golyam
// @license      none
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @downloadURL  https://github.com/grisha765/dark_mode_websites/raw/main/dark-mode.user.js
// @updateURL    https://github.com/grisha765/dark_mode_websites/raw/main/dark-mode.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // Function to load settings from Tampermonkey storage
    function loadSettings() {
        return GM_getValue('darkModeSettings', {});
    }

    // Function to save settings to Tampermonkey storage
    function saveSettings(settings) {
        GM_setValue('darkModeSettings', settings);
    }

    // Function to check if a domain is enabled
    function isDomainEnabled(domain) {
        const settings = loadSettings();
        for (const pattern in settings) {
            if (pattern === 'timeRange') continue;
            const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
            if (regex.test(domain)) {
                return settings[pattern];
            }
        }
        return null;
    }

    // Function to check if the current time is within the allowed time range
    function isWithinTimeRange() {
        const settings = loadSettings();
        const timeRange = settings.timeRange;
        if (!timeRange || !timeRange.start || !timeRange.end) return true;

        const now = new Date();
        const start = new Date();
        const end = new Date();
        const [startHours, startMinutes] = timeRange.start.split(':').map(Number);
        const [endHours, endMinutes] = timeRange.end.split(':').map(Number);

        start.setHours(startHours, startMinutes, 0);
        end.setHours(endHours, endMinutes, 0);

        if (start <= end) {
            return now >= start && now <= end;
        } else {
            return now >= start || now <= end;
        }
    }

    // Function to add domain to settings
    function addDomain(domain, enabled, legacy) {
        const settings = loadSettings();
        settings[domain] = { enabled, legacy };
        saveSettings(settings);
    }

    // Function to remove domain from settings
    function removeDomain(domain) {
        const settings = loadSettings();
        delete settings[domain];
        saveSettings(settings);
    }

    // Function to extract the main domain
    function getMainDomain(url) {
        const a = document.createElement('a');
        a.href = url;
        const host = a.hostname.split('.').slice(-2).join('.');
        return `*${host}*`;
    }

    // Function to determine if the site is already in dark mode
    function isDarkMode() {
        const bgColor = window.getComputedStyle(document.body).backgroundColor;
        const fgColor = window.getComputedStyle(document.body).color;
        if (!bgColor || !fgColor) return false;

        const rgb = bgColor.match(/\d+/g);
        const rgbText = fgColor.match(/\d+/g);
        if (!rgb || rgb.length < 3 || !rgbText || rgbText.length < 3) return false;

        const [r, g, b] = rgb.map(Number);
        const [rt, gt, bt] = rgbText.map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const brightnessText = (rt * 299 + gt * 587 + bt * 114) / 1000;

        const backgroundIsDark = brightness < 128;
        const textIsLight = brightnessText > 128;

        return backgroundIsDark && textIsLight;
    }

    // Function to check and apply dark mode for sites without their own dark theme
    function checkAndApplyDarkMode() {
        if (isDarkMode()) {
            document.body.style.visibility = 'visible';
            return;
        }
        requestAnimationFrame(requestAnimationFrameCallback);
    }

    // Function for adding styles
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            html {
                filter: invert(1) hue-rotate(180deg) contrast(0.8);
            }

            /** reverse filter for media elements */
            img, video, picture, canvas, iframe, embed {
                filter: invert(1) hue-rotate(180deg);
            }

            .dark-mode-settings, .dark-mode-settings * {
                filter: none !important;
                background-color: rgba(0, 0, 0, 0.8) !important;
                color: #fff !important;
            }

            body {
                visibility: visible;
            }
        `;
        document.head.appendChild(style);
    }

    // Function to apply dark mode using requestAnimationFrame
    function requestAnimationFrameCallback() {
        if (document.head) {
            addStyles();
        } else {
            requestAnimationFrame(requestAnimationFrameCallback);
        }
    }

    // Function to apply dark mode using Legacy method
    function applyLegacyDarkMode() {
        window.addEventListener('load', function () {
            if (isDarkMode()) {
                document.body.style.visibility = 'visible';
                return;
            }
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
    }

    // Apply initial dark theme as soon as possible if within time range
    const currentDomain = window.location.hostname;
    const domainSettings = isDomainEnabled(currentDomain);

    if (isWithinTimeRange()) {
        if (domainSettings) {
            if (domainSettings.legacy) {
                applyLegacyDarkMode();
            } else {
                requestAnimationFrame(requestAnimationFrameCallback);
            }
        } else if (domainSettings === null) {
            // Check and apply dark mode for sites without their own dark theme
            requestAnimationFrame(checkAndApplyDarkMode);
        }
    }

    // Create settings UI
    function createSettingsUI() {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        container.style.color = '#fff';
        container.style.padding = '10px';
        container.style.zIndex = '10000';
        container.classList.add('dark-mode-settings'); // Add a class for CSS targeting

        const title = document.createElement('h2');
        title.textContent = 'Dark Mode Settings';
        container.appendChild(title);

        const domainInput = document.createElement('input');
        domainInput.type = 'text';
        domainInput.placeholder = 'Enter domain or pattern...';
        container.appendChild(domainInput);

        const legacyCheckbox = document.createElement('input');
        legacyCheckbox.type = 'checkbox';
        legacyCheckbox.id = 'legacyMode';
        const legacyLabel = document.createElement('label');
        legacyLabel.htmlFor = 'legacyMode';
        legacyLabel.textContent = 'Legacy Mode';
        container.appendChild(legacyCheckbox);
        container.appendChild(legacyLabel);

        const enableButton = document.createElement('button');
        enableButton.textContent = 'Enable';
        enableButton.onclick = () => {
            let domain = domainInput.value.trim();
            const legacy = legacyCheckbox.checked;
            if (!domain) {
                domain = getMainDomain(window.location.href);
            }
            addDomain(domain, true, legacy);
            domainInput.value = '';
            legacyCheckbox.checked = false;
            updateDomainList();
        };
        container.appendChild(enableButton);

        const disableButton = document.createElement('button');
        disableButton.textContent = 'Disable';
        disableButton.onclick = () => {
            let domain = domainInput.value.trim();
            if (!domain) {
                domain = getMainDomain(window.location.href);
            }
            addDomain(domain, false, false);
            domainInput.value = '';
            legacyCheckbox.checked = false;
            updateDomainList();
        };
        container.appendChild(disableButton);

        const domainList = document.createElement('ul');
        container.appendChild(domainList);

        const startTimeInput = document.createElement('input');
        startTimeInput.type = 'time';
        startTimeInput.placeholder = 'Start Time (HH:MM)';
        container.appendChild(startTimeInput);

        const endTimeInput = document.createElement('input');
        endTimeInput.type = 'time';
        endTimeInput.placeholder = 'End Time (HH:MM)';
        container.appendChild(endTimeInput);

        const saveTimeButton = document.createElement('button');
        saveTimeButton.textContent = 'Save Time Range';
        saveTimeButton.onclick = () => {
            const start = startTimeInput.value.trim();
            const end = endTimeInput.value.trim();
            const settings = loadSettings();

            if (start && end) {
                settings.timeRange = { start, end };
            } else {
                delete settings.timeRange;
            }

            saveSettings(settings);
        };
        container.appendChild(saveTimeButton);

        function updateDomainList() {
            const settings = loadSettings();
            domainList.innerHTML = '';
            Object.keys(settings).forEach(domain => {
                if (domain === 'timeRange') return;
                const listItem = document.createElement('li');
                listItem.textContent = `${domain} - ${settings[domain].enabled ? 'Enabled' : 'Disabled'} ${settings[domain].legacy ? '(Legacy)' : ''}`;
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.onclick = () => {
                    removeDomain(domain);
                    updateDomainList();
                };
                listItem.appendChild(removeButton);
                domainList.appendChild(listItem);
            });
        }

        function loadTimeRange() {
            const settings = loadSettings();
            const timeRange = settings.timeRange;
            if (timeRange) {
                startTimeInput.value = timeRange.start;
                endTimeInput.value = timeRange.end;
            } else {
                startTimeInput.value = '';
                endTimeInput.value = '';
            }
        }

        updateDomainList();
        loadTimeRange();
        document.body.appendChild(container);

        // Add a close button to remove the UI
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.display = 'block';
        closeButton.style.marginTop = '10px';
        closeButton.onclick = () => {
            document.body.removeChild(container);
        };
        container.appendChild(closeButton);
    }

    // Function to initialize the settings UI after DOM is ready
    function initializeSettingsUI() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createSettingsUI);
        } else {
            createSettingsUI();
        }
    }

    // Register the menu command
    GM_registerMenuCommand('Dark Mode Settings', initializeSettingsUI);

    // Apply styles to exclude the settings UI from inversion
    GM_addStyle(`
        .dark-mode-settings, .dark-mode-settings * {
            filter: none !important;
            background-color: rgba(0, 0, 0, 0.8) !important;
            color: #fff !important;
        }
    `);

}());


