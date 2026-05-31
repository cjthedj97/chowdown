---
layout: post
title:  "Frequently Asked Questions"
permalink: /FAQ
---

<style>
.faq-wrap {
  max-width: 900px;
  margin: 0 auto;
}

.faq-intro {
  margin-bottom: 1rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: linear-gradient(120deg, var(--surface), color-mix(in srgb, var(--accent) 8%, var(--surface)));
}

.faq-list {
  display: grid;
  gap: 0.75rem;
}

.faq-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  overflow: hidden;
}

.faq-item summary {
  cursor: pointer;
  list-style: none;
  padding: 0.9rem 1rem;
  font-size: 1.05rem;
  font-weight: 600;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: "+";
  float: right;
  color: var(--accent);
  font-size: 1.2rem;
}

.faq-item[open] summary::after {
  content: "-";
}

.faq-answer {
  padding: 0 1rem 1rem;
  color: var(--text);
}

.faq-answer p {
  margin: 0;
}
</style>

<div class="faq-wrap">
  <div class="faq-intro">
    <p><strong>Need help using Chowdown?</strong> Start here for quick answers on submitting recipes, finding features, and reporting issues.</p>
  </div>

  <div class="faq-list">
    <details class="faq-item" open>
      <summary>What is this site for?</summary>
      <div class="faq-answer">
        <p>This is an online recipe book with curated recipes used by the Saathoff family and friends.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>How do I navigate the website?</summary>
      <div class="faq-answer">
        <p>Use the top navigation bar. On mobile, open the hamburger menu in the top-right corner to access all pages.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>Can I submit recipes?</summary>
      <div class="faq-answer">
        <p>Yes. You can use <a href="/convert">Convert and Submit</a>, send recipes by <a href="mailto:recipes@saathoff.us?subject=Recipe Submission">email</a>, or open a pull request on GitHub.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>What is the Convert page and how do I use it?</summary>
      <div class="faq-answer">
        <p>The Convert page helps turn a plain recipe into site-ready markdown frontmatter. It now supports tags, prep/cook/total time, servings, <code>date_added</code>, and <code>status</code> fields.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>What does recipe status mean?</summary>
      <div class="faq-answer">
        <p><code>published</code> is ready to show publicly, <code>planned</code> is queued, and <code>draft</code> is still in progress.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>What is date_added used for?</summary>
      <div class="faq-answer">
        <p>The home page Recently Added section uses <code>date_added</code> to sort and show the newest recipes.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>Why did my browser ask to install the site?</summary>
      <div class="faq-answer">
        <p>The site is a Progressive Web App (PWA). Installing it creates a home screen shortcut and can improve load/offline behavior on supported devices.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>Can I save favorites?</summary>
      <div class="faq-answer">
        <p>Yes. Use the favorite button on recipe pages, then view saved recipes at <a href="/favorites">/favorites</a>. Favorites are stored in your browser (localStorage).</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>Can I search by category or tag?</summary>
      <div class="faq-answer">
        <p>Yes. The home/search page includes tag chips (like Copycat, Dessert, Meal Prep, and more) to narrow results quickly.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>What are Collections pages?</summary>
      <div class="faq-answer">
        <p>Collections are curated dynamic lists for common use cases like meal prep, holiday recipes, and game day food.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>What is Inventory matching?</summary>
      <div class="faq-answer">
        <p>The Inventory page can match your pantry items to likely recipes and show likely missing ingredients to help plan shopping.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>Is there an RSS feed?</summary>
      <div class="faq-answer">
        <p>Yes. The feed is available at <a href="/feed.xml">/feed.xml</a>.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>How many recipes are on the site?</summary>
      <div class="faq-answer">
        <p>Check the stats page at <a href="/stats">/stats</a> for both total recipes and published recipes, plus other breakdowns.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>Where is the source code?</summary>
      <div class="faq-answer">
        <p>The code is on GitHub: <a href="https://github.com/cjthedj97/chowdown">cjthedj97/chowdown</a>.</p>
      </div>
    </details>

    <details class="faq-item">
      <summary>How do I report bugs or share feedback?</summary>
      <div class="faq-answer">
        <p>Send feedback via <a href="mailto:recipes@saathoff.us?subject=Site Feedback">email</a> or open an issue on <a href="https://github.com/cjthedj97/chowdown/issues/new/choose">GitHub</a>.</p>
      </div>
    </details>
  </div>
</div>
