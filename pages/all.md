---
layout: default
permalink: /all
---

<div class="home"> 

  <div class="recipes xs-px1 xs-mt2">
    <div class="clearfix">
    {% assign sorted = site.recipes | sort:"date" %}
    {% for post in sorted %}

      <div class="sm-col sm-col-6 md-col-6 lg-col-4 xs-px1 xs-mb2">
        <a class="block relative bg-blue" href="{{ post.url | prepend: site.baseurl }}">
          <div class="image ratio bg-cover" 
               {% if post.image and post.image contains 'http' %}
                  style="background-image:url({{ post.image }});"
               {% else %}
                  style="background-image:url({{ site.baseurl }}/images/{{ post.image }});"
               {% endif %}>
          </div>
          <h1 class="title p2 m0 absolute bold white bottom-0 left-0">{{ post.title }}</h1>
        </a>
      </div>

    {% endfor %}
    </div>
  </div>
</div>
