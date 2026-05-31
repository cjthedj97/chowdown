---
layout: default
permalink: /

---

<div class="container max-width-4 xs-px1 xs-mt3 home-shell">
  <section class="home-hero center mb3">
    <p class="home-kicker">Cook smarter, eat better</p>
    <h1 class="home-title">Find your next favorite recipe</h1>
    <p class="home-subtitle">Fresh additions, quick filters, and family-tested meals all in one place.</p>
  </section>

  <section class="search container max-width-3 home-search-card">
		<div id="search-container">
			<h3 class="center mb2 blue section-title">Recipe Search</h3>
		  <p class="center search-subtitle">Search by title, ingredient, or use a tag filter.</p>
		<input type="text" id="search-input" placeholder="Search titles or ingredients...">
		<div id="tag-filters" class="center mt2 chip-wrap">
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter is-active" data-tag="all" type="button">All</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="copycat" type="button">Copycat</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="mains" type="button">Mains</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="dessert" type="button">Dessert</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="meal-prep" type="button">Meal Prep</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="breakfast" type="button">Breakfast</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="sauce" type="button">Sauce</button>
		</div>
		</div>
  </section>

  <div class="clearfix home-results-wrap is-hidden" id="search-results-wrap">
    <h3 class="center mb2 blue section-title">Search Results</h3>
    <div class="recipes xs-px1 xs-mt2 center" id="results-container"></div>
  </div>

  <section class="home-section" id="recently-added-section">
    <h3 class="center mb2 blue section-title">Recently Added</h3>
    <div class="recipes xs-px1">
      <div class="clearfix">
        {% assign published_recipes = site.recipes | where_exp: "item", "item.status != 'draft' and item.status != 'planned'" %}
        {% assign dated_recipes = published_recipes | where_exp: "item", "item.date_added" | sort: "date_added" | reverse %}
        {% for post in dated_recipes limit:6 %}
          <div class="sm-col sm-col-6 md-col-6 lg-col-4 xs-px1 xs-mb2">
            <a class="block relative recipe-tile" href="{{ post.url }}">
              <div class="image ratio bg-cover"
                  {% if post.image and post.image contains 'http' %}
                     style="background-image:url({{ post.image }});"
                   {% else %}
                      style="background-image:url({{ '/images/' | append: post.image | relative_url }});"
                   {% endif %}>
              </div>
              <h1 class="title p2 m0 absolute bold white bottom-0 left-0 recipe-tile-title">{{ post.title }}</h1>
            </a>
          </div>
        {% endfor %}
      </div>
      {% if dated_recipes.size == 0 %}
        <p class="center">No recipes tagged with <code>date_added</code> yet.</p>
      {% endif %}
    </div>
  </section>

<!-- Script pointing to search-script.js -->
<script src="{{ "/js/simple-jekyll-search.min.js" | relative_url }}" type="text/javascript"></script>

<!-- Configuration -->
<script>
SimpleJekyllSearch({
  searchInput: document.getElementById('search-input'),
  resultsContainer: document.getElementById('results-container'),
  json: '/search.json',
  searchResultTemplate: '<div class="sm-col sm-col-6 md-col-6 lg-col-4 xs-px1 xs-mb2 left-align result-card" data-tags="{tags}"><a class="block relative recipe-tile" href="{url}"><div class="image ratio bg-cover" style="background-image:url({image});"></div><h1 class="title p2 m0 absolute bold white bottom-0 left-0 recipe-tile-title">{title}</h1></a></div>'
})
</script>

<script>
	var activeTagFilter = 'all';

	function normalizeTagText(value) {
		return (value || '').toString().toLowerCase().trim();
	}

	function applyTagFilter() {
		var cards = document.querySelectorAll('#results-container .result-card');
		for (var i = 0; i < cards.length; i++) {
			var card = cards[i];
			var tagBlob = normalizeTagText(card.getAttribute('data-tags'));
			if (activeTagFilter === 'all') {
				card.style.display = '';
			} else if (tagBlob.indexOf(activeTagFilter) !== -1) {
				card.style.display = '';
			} else {
				card.style.display = 'none';
			}
		}
	}

  function setActiveChip(chip) {
		var chips = document.querySelectorAll('.tag-filter');
		for (var i = 0; i < chips.length; i++) {
			chips[i].classList.remove('is-active', 'btn-primary');
			chips[i].classList.add('btn-outline-primary');
		}
		chip.classList.add('is-active', 'btn-primary');
		chip.classList.remove('btn-outline-primary');
	}

	function updateHomepageSections() {
		var query = ($('#search-input').val() || '').toString().trim();
		var recentSection = document.getElementById('recently-added-section');
		var resultsWrap = document.getElementById('search-results-wrap');

		if (!recentSection || !resultsWrap) return;

		if (query.length > 0) {
			recentSection.classList.add('is-hidden');
			resultsWrap.classList.remove('is-hidden');
		} else {
			recentSection.classList.remove('is-hidden');
			resultsWrap.classList.add('is-hidden');
		}
	}

	$( document ).ready(function() {
		$('.tag-filter').on('click', function() {
			activeTagFilter = normalizeTagText($(this).data('tag'));
			setActiveChip(this);
			setTimeout(applyTagFilter, 50);
		});

    $('#search-input').on('input', function() {
			updateHomepageSections();
			setTimeout(applyTagFilter, 50);
		});

		updateHomepageSections();
		setTimeout(applyTagFilter, 150);
	});
	
</script>
