---
layout: page
permalink: /collections/holiday
title: Holiday Favorites Collection
---

<div class="container max-width-3 py3">
  <h1 class="center">Holiday Favorites</h1>
  <p class="center">Seasonal classics, sides, and desserts for gatherings.</p>

  {% assign published_recipes = site.recipes | where_exp: "r", "r.status != 'draft' and r.status != 'planned'" %}
  {% assign holiday = published_recipes | where_exp: "r", "r.tags contains 'holiday' or r.tags contains 'dessert' or r.tags contains 'casserole' or r.tags contains 'side-dish' or r.title contains 'Christmas' or r.title contains 'Thanksgiving'" %}

  <div class="recipes xs-px1 xs-mt2">
    <div class="clearfix">
      {% for post in holiday %}
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
