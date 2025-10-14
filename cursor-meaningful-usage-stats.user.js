// ==UserScript==
// @name         Cursor Meaningful Usage Stats
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add percentage information to Cursor usage dashboard
// @author       You
// @match        https://cursor.com/dashboard?tab=usage
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cursor.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // More stable selectors based on the HTML structure
    const SELECTORS = {
        usageCard: '.rounded-xl.bg-brand-dashboard-card', // More stable - targets the card by background
        usageNumber: '.dashboard-xl:first-child', // First large number (current usage)
        totalNumber: '.dashboard-xl.dashboard-text-tertiary', // The "/ 500" text
        progressBar: '.bg-\\[#81A1C1\\]:not(.opacity-10)', // The colored progress bar
        resetText: '.dashboard-sm.dashboard-text-tertiary', // Text containing reset date
        usageLabel: '.dashboard-base.font-medium.opacity-50' // "Included Requests Used" label
    };

    function calculateAndInjectPercentages() {
        try {
            // Find the usage card using more stable selectors
            const usageCards = document.querySelectorAll(SELECTORS.usageCard);
            if (!usageCards.length) return;

            const usageCard = usageCards[0];

            // Check if we've already injected our percentages
            if (usageCard.querySelector('.userscript-enhanced')) return;

            // Extract current usage and total using more robust parsing
            const usageNumberEl = usageCard.querySelector(SELECTORS.usageNumber);
            const totalNumberEl = usageCard.querySelector(SELECTORS.totalNumber);

            if (!usageNumberEl || !totalNumberEl) return;

            const currentUsage = parseInt(usageNumberEl.textContent.trim());
            const totalText = totalNumberEl.textContent;
            const totalMatch = totalText.match(/\d+/);
            const totalRequests = totalMatch ? parseInt(totalMatch[0]) : 500;

            if (isNaN(currentUsage) || isNaN(totalRequests) || totalRequests === 0) return;

            // Calculate usage percentage
            const usagePercent = ((currentUsage / totalRequests) * 100).toFixed(0);

            // Update usage display - add percentage next to numbers
            const numbersContainer = usageNumberEl.parentElement;
            if (numbersContainer) {
                const percentSpan = document.createElement('div');
                percentSpan.className = 'dashboard-sm dashboard-text-tertiary ml-2 userscript-enhanced';
                percentSpan.textContent = `(${usagePercent}%)`;
                percentSpan.style.fontSize = '0.875rem';
                percentSpan.style.opacity = '0.7';
                numbersContainer.appendChild(percentSpan);
            }

            // Extract and process reset date
            const resetTextElements = usageCard.querySelectorAll(SELECTORS.resetText);
            let resetTextElement = null;

            // Find the reset text element that contains date information
            for (let el of resetTextElements) {
                if (el.textContent.includes('Next reset on:')) {
                    resetTextElement = el;
                    break;
                }
            }

            if (resetTextElement && !resetTextElement.querySelector('.userscript-enhanced')) {
                const resetText = resetTextElement.textContent;
                const resetDateMatch = resetText.match(/Next reset on: (\w+ \d+, \d{4})/);

                if (resetDateMatch) {
                    const resetDateStr = resetDateMatch[1];
                    const resetDate = new Date(resetDateStr);
                    const today = new Date();

                    // Calculate the start of billing period (previous month same day)
                    const periodStart = new Date(resetDate);
                    periodStart.setMonth(resetDate.getMonth() - 1);

                    // Handle cases where the previous month doesn't have the same day
                    if (periodStart.getDate() !== resetDate.getDate()) {
                        periodStart.setDate(0); // Last day of previous month
                    }

                    // Calculate time percentages
                    const totalPeriodMs = resetDate.getTime() - periodStart.getTime();
                    const elapsedMs = today.getTime() - periodStart.getTime();

                    // Ensure we don't get negative or >100% values
                    let timePercent = 0;
                    if (totalPeriodMs > 0 && elapsedMs >= 0) {
                        timePercent = Math.min(100, Math.max(0, (elapsedMs / totalPeriodMs) * 100));
                    }

                    const timePercentFormatted = timePercent.toFixed(0);

                    // Create new reset text with percentage
                    const newResetText = resetText.replace(
                        /Next reset on: [^<]+/,
                        `Next reset on: ${resetDateStr} (${timePercentFormatted}%)`
                    );

                    // Create wrapper to preserve HTML structure
                    const wrapper = document.createElement('div');
                    wrapper.className = 'userscript-enhanced';
                    wrapper.innerHTML = newResetText.replace(/\n/g, '<br>');

                    // Replace the original element content
                    resetTextElement.innerHTML = '';
                    resetTextElement.appendChild(wrapper);
                }
            }

            console.log('Cursor Usage Enhancer: Percentages injected successfully');

        } catch (error) {
            console.error('Cursor Usage Enhancer Error:', error);
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Initial run with delay to ensure content is loaded
            setTimeout(calculateAndInjectPercentages, 1000);
            setTimeout(calculateAndInjectPercentages, 3000);
        });
    } else {
        // Run immediately if DOM is already ready
        setTimeout(calculateAndInjectPercentages, 1000);
        setTimeout(calculateAndInjectPercentages, 3000);
    }

    // Observer for dynamic content loading (SPA navigation)
    const observer = new MutationObserver(function(mutations) {
        let shouldRun = false;

        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if this might be our usage card or related content
                        if (node.querySelector && (
                            node.querySelector(SELECTORS.usageCard) ||
                            node.textContent.includes('Included Requests Used')
                        )) {
                            shouldRun = true;
                            break;
                        }
                    }
                }
            }
            if (shouldRun) break;
        }

        if (shouldRun) {
            setTimeout(calculateAndInjectPercentages, 500);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also run when URL changes (for SPA navigation)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl && url.includes('dashboard?tab=usage')) {
            lastUrl = url;
            setTimeout(calculateAndInjectPercentages, 1000);
        }
    }).observe(document, { subtree: true, childList: true });

})();
