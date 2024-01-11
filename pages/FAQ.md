---
layout: post
title:  "Frequently Asked Questions"
permalink: /FAQ
---

<head>
<style>
.collapsible {
  background-color: #fff;
  color: black;
  cursor: pointer;
  padding: 18px;
  width: 100%;
  border: none;
  text-align: left;
  outline: none;
  font-size: 1.75rem;
}

.active, .collapsible:hover {
  background-color: #007bffcc;
}

.content {
  padding: 0 18px;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s ease-out;
  background-color: #f8f9fa;
}
</style>
</head>
<body>

<button class="collapsible">What is this site for?</button>
<div class="content">
  <p>It is a online recipe book of curated recipes used by members and relatives of the of the Saathoff Family.</p>
</div>
<button class="collapsible">How do I Navigate the website?</button>
<div class="content">
  <p>Everything is linked in the header bar at the top of of the website or on mobile click on the hamburger menu (the button on the top right that looks like three lines on top of each other).</p>
</div>

<button class="collapsible">When I went to the site it asked me to install something?</button>
<div class="content">
<p>This prompt is part of our site’s Progressive Web App (PWA) feature. A PWA combines the best of web and mobile apps, offering offline capabilities, fast loading, and a device-friendly layout. When you ‘install’ the site, it adds a shortcut to your device for easy access, just like a regular app, but it doesn’t take up as much space.</p>
</div>

<button class="collapsible">Can I submit recipes?</button>
<div class="content">
<p>Yes you can either use the <a href="/convert">Convert and submit</a>, <a href="mailto:recipes@saathoff.us?subject=Recipe Submission">email</a>,or submit a pull request from the github repo.</p>
</div>

<button class="collapsible">Is there RSS Feed?</button>
<div class="content">
<p>Yes there is an xml feed located at <a href="/feed.xml">/feed.xml</a>.</p>
</div>

<button class="collapsible">Where is the source code?</button>
<div class="content">
<p>The source can be found at <a href="https://github.com/cjthedj97/chowdown">https://github.com/cjthedj97/chowdown</a>.</p>
</div>

<button class="collapsible">I think I found a bug or I have feedback where do I report it?</button>
<div class="content">
<p>Feel free to get ahold of me though the <a href="mailto:recipes@saathoff.us?subject=Site Feedback">email</a> or open a github issue <a href="https://github.com/cjthedj97/chowdown/issues/new/choose">Github</a>.</p>
</div>

<button class="collapsible">How many Recipe are on the site?</button>
<div class="content">
<p>Check out <a href="/stats">https://recipes.saathoff.us/stats</a> for an answer to that.</p>
</div>

<script>
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.maxHeight){
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    } 
  });
}
</script>