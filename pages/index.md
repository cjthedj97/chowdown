---
layout: default
permalink: /

---

<div class="container max-width-3 xs-px1 xs-mt2">
  <h3 class="center mb3 blue">Recently Added</h3>
  <div class="recipes xs-px1">
    <div class="clearfix">
      {% assign published_recipes = site.recipes | where_exp: "item", "item.status != 'draft' and item.status != 'planned'" %}
      {% assign dated_recipes = published_recipes | where_exp: "item", "item.date_added" | sort: "date_added" | reverse %}
      {% for post in dated_recipes limit:6 %}
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
    {% if dated_recipes.size == 0 %}
      <p class="center">No recipes tagged with <code>date_added</code> yet.</p>
    {% endif %}
  </div>
</div>

  <div class="search container max-width-2">
		<div id="search-container">
			<h3 class="center mb3 blue">Recipe Search</h3>
		<input type="text" id="search-input" placeholder="search titles or ingredients...">
		<div id="tag-filters" class="center mt2">
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter is-active" data-tag="all" type="button">All</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="copycat" type="button">Copycat</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="mains" type="button">Mains</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="dessert" type="button">Dessert</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="meal-prep" type="button">Meal Prep</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="breakfast" type="button">Breakfast</button>
		  <button class="btn btn-sm btn-outline-primary m1 tag-filter" data-tag="sauce" type="button">Sauce</button>
		</div>
		</div>
</div>

<div class="clearfix">
<div class="recipes xs-px1 xs-mt2 center" id="results-container">

</div>
</div>

<!-- Script pointing to search-script.js -->
<script src="{{site.baseurl}}/js/simple-jekyll-search.min.js" type="text/javascript"></script>

<!-- Configuration -->
<script>
SimpleJekyllSearch({
  searchInput: document.getElementById('search-input'),
  resultsContainer: document.getElementById('results-container'),
  json: '{{site.baseurl}}/search.json',
  searchResultTemplate: '<div class="sm-col sm-col-6 md-col-6 lg-col-4 xs-px1 xs-mb2 left-align result-card" data-tags="{tags}"><a class="block relative bg-blue" href="{url}"><div class="image ratio bg-cover" style="background-image:url({image});"></div><h1 class="title p2 m0 absolute bold white bottom-0 left-0">{title}</h1></a></div>'
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

	$( document ).ready(function() {
		$('.tag-filter').on('click', function() {
			activeTagFilter = normalizeTagText($(this).data('tag'));
			setActiveChip(this);
			setTimeout(applyTagFilter, 50);
		});

    $('#search-input').on('input', function() {
     	currentHeight = $('#search-container').outerHeight();
      $('.search').addClass('used').css('height', currentHeight);
			setTimeout(applyTagFilter, 50);
	});

		setTimeout(applyTagFilter, 150);
	});
	
</script>
