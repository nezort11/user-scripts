// ==UserScript==
// @name         OZON Product Sorter by Reviews
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Sort OZON products by number of reviews
// @author       You
// @match        https://www.ozon.ru/*
// @match        https://ozon.ru/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Function to extract review count from product element - PRECISE VERSION
  function getReviewCount(productElement) {
    // Method 1: Look for the exact structure from your HTML
    // The reviews are in: <span style="color:var(--textSecondary);">62&nbsp;отзыва</span>
    const reviewSpans = productElement.querySelectorAll(
      'span[style*="textSecondary"]'
    );

    for (let span of reviewSpans) {
      const text = span.textContent || "";
      if (text.includes("отзыв")) {
        const match = text.match(/(\d+)\s*отзыв/);
        if (match) {
          const reviewCount = parseInt(match[1]);
          console.log(`Found reviews: ${reviewCount} in text: "${text}"`);
          return reviewCount;
        }
      }
    }

    // Method 2: Look for spans with specific style that contain reviews
    const allSpans = productElement.querySelectorAll("span");
    for (let span of allSpans) {
      const style = span.getAttribute("style") || "";
      const text = span.textContent || "";

      // Look for spans with textSecondary color that contain "отзыв"
      if (style.includes("textSecondary") && text.includes("отзыв")) {
        const match = text.match(/(\d+)\s*отзыв/);
        if (match) {
          const reviewCount = parseInt(match[1]);
          console.log(
            `Found reviews (method 2): ${reviewCount} in text: "${text}"`
          );
          return reviewCount;
        }
      }
    }

    // Method 3: Look in the specific rating section structure
    const ratingSections = productElement.querySelectorAll(
      ".ir5_24.r5i_24.p6b3_0_2-a"
    );
    for (let section of ratingSections) {
      const text = section.textContent || "";
      if (text.includes("отзыв")) {
        const match = text.match(/(\d+)\s*отзыв/);
        if (match) {
          const reviewCount = parseInt(match[1]);
          // Additional validation: review counts are usually reasonable numbers
          if (reviewCount <= 10000) {
            // Unlikely to have more than 10k reviews for a single product
            console.log(
              `Found reviews (method 3): ${reviewCount} in text: "${text}"`
            );
            return reviewCount;
          }
        }
      }
    }

    console.log(`No reviews found for product`);
    return 0; // Return 0 if no reviews found
  }

  // Function to sort products by review count
  function sortProductsByReviews() {
    try {
      // Get all direct children using querySelectorAll
      const products = document.querySelectorAll(
        '[data-widget="tileGridDesktop"] > *'
      );

      if (products.length === 0) {
        alert("No products found on this page!");
        return;
      }

      const container = products[0].parentNode;
      const productsArray = Array.from(products);

      console.log("=== Analyzing products ===");
      // Create array with products and their review counts
      const productsWithReviews = productsArray.map((product, index) => {
        const reviewCount = getReviewCount(product);

        return {
          element: product,
          reviewCount: reviewCount,
          index: index,
        };
      });

      // Log review counts for debugging
      console.log("=== Review counts before sorting ===");
      productsWithReviews.forEach((item) => {
        console.log(
          `Product ${item.index + 1}: ${item.reviewCount} reviews`
        );
      });

      // Sort by review count descending
      productsWithReviews.sort((a, b) => b.reviewCount - a.reviewCount);

      // Re-append in sorted order
      productsWithReviews.forEach((item) => {
        container.appendChild(item.element);
      });

      // Show success message
      const sortedCounts = productsWithReviews.map((p) => p.reviewCount);
      const validCounts = sortedCounts.filter(
        (count) => count > 0 && count < 1000
      ); // Filter out obviously wrong counts
      console.log("Products sorted by review count:", sortedCounts);
      alert(
        `✅ Sorted ${
          productsWithReviews.length
        } products by reviews!\nValid review counts: ${validCounts.join(
          ", "
        )}`
      );
    } catch (error) {
      console.error("Error sorting products:", error);
      alert("❌ Error sorting products. Check console for details.");
    }
  }

  // Alternative: Ultra-precise function that only accepts reasonable review counts
  function getReviewCountStrict(productElement) {
    // Only look in the specific element structure that contains reviews
    const reviewContainers =
      productElement.querySelectorAll(".p6b3_0_2-a4");

    for (let container of reviewContainers) {
      const text = container.textContent || "";
      if (text.includes("отзыв")) {
        const match = text.match(/(\d+)\s*отзыв/);
        if (match) {
          const reviewCount = parseInt(match[1]);
          // Only accept reasonable review counts (0-2000 typically)
          if (reviewCount >= 0 && reviewCount <= 2000) {
            console.log(
              `Found valid reviews: ${reviewCount} in text: "${text.trim()}"`
            );
            return reviewCount;
          } else {
            console.log(
              `Suspicious review count skipped: ${reviewCount} in text: "${text.trim()}"`
            );
          }
        }
      }
    }

    return 0;
  }

  // Function to create and add the sort button to the page
  function addSortButtonToPage() {
    // Check if button already exists
    if (document.getElementById("tm-sort-by-reviews-btn")) {
      return;
    }

    const button = document.createElement("button");
    button.id = "tm-sort-by-reviews-btn";
    button.innerHTML = "🔄 Sort by Reviews";
    button.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 10000;
            background: #005bff;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;

    button.addEventListener("mouseenter", function () {
      this.style.background = "#0045cc";
      this.style.transform = "translateY(-2px)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.background = "#005bff";
      this.style.transform = "translateY(0)";
    });

    // Use the strict version
    button.addEventListener("click", function () {
      // Replace the function temporarily with strict version
      const originalGetReviewCount = getReviewCount;
      window.getReviewCount = getReviewCountStrict;
      sortProductsByReviews();
      window.getReviewCount = originalGetReviewCount;
    });

    document.body.appendChild(button);
  }

  // Wait for page to load and add button
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addSortButtonToPage);
  } else {
    addSortButtonToPage();
  }

  // Also add button when navigating in SPA (for OZON)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(addSortButtonToPage, 2000);
    }
  }).observe(document, { subtree: true, childList: true });

  // Export functions for manual use in console
  window.sortOzonByReviews = sortProductsByReviews;
  window.getReviewCountStrict = getReviewCountStrict;

  console.log(
    "OZON Product Sorter loaded! Click the blue button or run: sortOzonByReviews()"
  );
})();
