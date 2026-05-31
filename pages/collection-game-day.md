---
layout: page
permalink: /collections/game-day
title: Game Day Collection
---

<div class="container max-width-3 py3">
  <h1 class="center">Game Day Collection</h1>
  <p class="center">Dips, snacks, finger foods, and party mains.</p>

  {% assign published_recipes = site.recipes | where_exp: "r", "r.status != 'draft' and r.status != 'planned'" %}
  {% assign game_day = published_recipes | where_exp: "r", "r.tags contains 'party' or r.tags contains 'Appetizer' or r.tags contains 'copycat' or r.tags contains 'sides' or r.title contains 'Dip'" %}

  <div class="recipes xs-px1 xs-mt2">
    <div class="clearfix">
      {% for post in game_day %}
      <div class="sm-col sm-col-6 md-col-6 lg-col-4 xs-px1 xs-mb2">
        <a class="block relative bg-blue" href="{{ post.url }}">
          <div class="image ratio bg-cover"
               {% if post.image and post.image contains 'http' %}
               style="background-image:url({{ post.image }});"
               {% else %}
                style="background-image:url(/images/{{ post.image }});"
               {% endif %}>
          </div>
          <h1 class="title p2 m0 absolute bold white bottom-0 left-0">{{ post.title }}</h1>
        </a>
      </div>
      {% endfor %}
    </div>
  </div>
</div>
