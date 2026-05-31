---
layout: default
permalink: /all
---

<div class="container max-width-4 xs-px1 xs-mt3">
  <h1 class="center mb2">All Recipes</h1>
  <p class="center mb3">Browse the full published recipe catalog.</p>

  <div class="recipes xs-px1 recipe-grid">
    <div>
      {% assign published_recipes = site.recipes | where_exp: "item", "item.status != 'draft' and item.status != 'planned'" %}
      {% assign sorted = published_recipes | sort:"date" %}
      {% for post in sorted %}
      <div class="recipe-grid-item">
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
      </div>
      {% endfor %}
    </div>
  </div>
</div>
