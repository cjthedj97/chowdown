---
layout: page
permalink: /collections/meal-prep
title: Meal Prep Collection
---

<div class="container max-width-3 py3">
  <h1 class="center">Meal Prep Collection</h1>
  <p class="center">Batch-friendly recipes that reheat well for the week.</p>

  {% assign published_recipes = site.recipes | where_exp: "r", "r.status != 'draft' and r.status != 'planned'" %}
  {% assign prep = published_recipes | where_exp: "r", "r.tags contains 'mains' or r.tags contains 'crock' or r.tags contains 'breakfast' or r.tags contains 'soups' or r.tags contains 'soup'" %}

  <div class="recipes xs-px1 xs-mt2 recipe-grid">
    {% for post in prep %}
    <a class="block relative recipe-tile {% if post.image %}has-image{% else %}no-image{% endif %}" href="{{ post.url }}">
      <div class="image ratio bg-cover"
           {% if post.image and post.image contains 'http' %}
             style="background-image:url({{ post.image }});"
           {% elsif post.image %}
             style="background-image:url({{ '/images/' | append: post.image | relative_url }});"
           {% endif %}>
      </div>
      <h1 class="title p2 m0 absolute bold white bottom-0 left-0 recipe-tile-title">{{ post.title }}</h1>
    </a>
    {% endfor %}
  </div>
</div>
