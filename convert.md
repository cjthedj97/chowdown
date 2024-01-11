---
layout: post
title: Recipe Converter
permalink: /convert
---

<head>
	<style>
		body {
			margin: 0;
			padding: 0;
		}

		.top-columns {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			padding: 20px;
		}

		.left-column, .right-column {
			width: 50%;
			background-color: #fff;
			padding: 5px;
			box-sizing: border-box;
		}

    input, textarea {
        width: 100%;
    }

		.bottom-column {
			width: 100%;
			background-color: #f6f8fa;
			padding: 20px;
			box-sizing: border-box;
			white-space: pre;
			line-height: 1.5;
			border-radius: 4px;
			overflow-x: auto;
		}
        
        @media screen and (max-width: 768px) {
            .top-columns {
                flex-direction: column;
                align-items: center;
            }
            
            .left-column, .right-column {
                width: 100%;
            }
            }


	</style>
</head>
<body>
<div class="top-columns">
	<div class="left-column">
      <p><b>1.</b> First the Recipe need to to be converted into a format the website is able to use.</p>
      <p><b>2.</b> Please enter in all the information you have available in the boxes on the right-hand side of the screen.</p>
      <p><b>3.</b> Once Done click convert, below you will see the concerted recipe.</p>
      <p><b>3½.</b> If you see anything that is incorrect now would be the time to correct and click the convert button again.</p>
      <p><b>4.</b> Now there are two options to share the recipe Email or Copy.</p>
      <p>● Clicking the 'Send Email' button will open your default email client with the formatted recipe already filled in. </p>
      <p>● Clicking the 'Copy' button will copy the recipe to your device's clipboard for easy sharing.</p>
     </div>

	<div class="right-column">
        <form id="recipe-form">
            <div>
              <input type="text" id="recipe-name" placeholder="Recipe Name">
            </div>
      
            <div>
              <input type="text" id="recipe-tags" placeholder="Tag Tag1 Tag2">
            </div>
            
            <div>
              <input type="text" id="recipe-tag" placeholder="One Really long tag">
            </div>

            <div>
              <input type="url" id="recipe-img-credit" placeholder="URL of souce if found online">
            </div>
      
            <div>
              <input type="text" id="recipe-yield" placeholder="Recipe Yield/Servings">
            </div>

            <div>
              <input type="number" id="recipe-prep-hours" placeholder="Prep Time: Hours" min="1" max="24">
              <input type="number" id="recipe-prep-minutes" placeholder="Prep Time: Minutes" min="1" max="60">
            </div>

            <div>
              <input type="number" id="recipe-cook-hours" placeholder="Cook Time: Hours" min="1" max="24">
              <input type="number" id="recipe-cook-minutes" placeholder="Cook Time: Minutes" min="1" max="60">
            </div>

            <div>
              <textarea placeholder="Ingredients one on each line" id="recipe-ingredients"></textarea>
            </div>
      
            <div>
              <textarea placeholder="Directions one step per line" id="recipe-directions" ></textarea>
            </div>
      
            <div>
              <textarea placeholder="Notes" id="recipe-notes"></textarea>
            </div>
      
            <button type="submit">Convert</button>
            <button onclick="location.href='mailto:recipes@saathoff.us?subject=Recipe Submission&body=' + encodeURIComponent(document.getElementById('bottom-column').innerHTML)">Send Email</button>
            <button id="copy-button">Copy to clipboard</button>
            <button type="button" onclick="clearForm()">Clear</button>

          </form>

	</div>

</div>
	
<div class="bottom-column" id="bottom-column"></div>

<script>
  // ... (existing code)

  function clearForm() {
    // Reset all input fields
    document.querySelector('#recipe-name').value = '';
    document.querySelector('#recipe-tags').value = '';
    document.querySelector('#recipe-img-credit').value = '';
    document.querySelector('#recipe-tag').value = '';
    document.querySelector('#recipe-ingredients').value = '';
    document.querySelector('#recipe-directions').value = '';
    document.querySelector('#recipe-notes').value = '';
    document.querySelector('#recipe-prep-hours').value = '';
    document.querySelector('#recipe-prep-minutes').value = '';
    document.querySelector('#recipe-cook-hours').value = '';
    document.querySelector('#recipe-cook-minutes').value = '';
    document.querySelector('#recipe-yield').value = '';

    // Clear the output
    document.querySelector('.bottom-column').innerHTML = '';
  }
</script>

<script>
const form = document.querySelector('#recipe-form');
const output = document.querySelector('.bottom-column');
const copyButton = document.querySelector('#copy-button');

form.addEventListener('submit', (event) => {
  event.preventDefault(); // prevent the form from submitting normally

  const name = document.querySelector('#recipe-name').value.trim();
  const tags = document.querySelector('#recipe-tags').value.trim();
  const imgCredit = document.querySelector('#recipe-img-credit').value.trim();
  const tag = document.querySelector('#recipe-tag').value.trim();
  const ingredients = document.querySelector('#recipe-ingredients').value.trim();
  const directions = document.querySelector('#recipe-directions').value.trim();
  const yieldValue = document.querySelector('#recipe-yield').value.trim();
  const prepHours = document.querySelector('#recipe-prep-hours').value.trim();
  const prepMinutes = document.querySelector('#recipe-prep-minutes').value.trim();
  const cookHours = document.querySelector('#recipe-cook-hours').value.trim();
  const cookMinutes = document.querySelector('#recipe-cook-minutes').value.trim();


// ingredients Formatting Find and Replace
  const ingredientsWithLB = ingredients.replace(/ounce/gi, 'oz');
  const ingredientsWithOz = ingredientsWithLB.replace(/pound/gi, 'lb');
  const ingredientsFraction14 = ingredientsWithOz.replace(/1\/4/g, '¼');
  const ingredientsFraction12 = ingredientsFraction14.replace(/1\/2/g, '½');
  const ingredientsFraction34 = ingredientsFraction12.replace(/3\/4/g, '¾');
  const ingredientsFraction13 = ingredientsFraction34.replace(/1\/3/g, '⅓');
  const ingredientsFraction23 = ingredientsFraction13.replace(/2\/3/g, '⅔');
  const ingredientsFraction18 = ingredientsFraction23.replace(/1\/8/g, '⅛');
  const ingredientsFraction116 = ingredientsFraction18.replace(/1\/16/g, '⅛');

// directions Formatting Find and Replace
  const directionsWithLB = directions.replace(/ounce/gi, 'oz');
  const directionsWithOz = directionsWithLB.replace(/pound/gi, 'lb');
  const directionsFraction14 = directionsWithOz.replace(/1\/4/g, '¼');
  const directionsFraction12 = directionsFraction14.replace(/1\/2/g, '½');
  const directionsFraction34 = directionsFraction12.replace(/3\/4/g, '¾');
  const directionsFraction13 = directionsFraction34.replace(/1\/3/g, '⅓');
  const directionsFraction23 = directionsFraction13.replace(/2\/3/g, '⅔');
  const directionsFraction18 = directionsFraction23.replace(/1\/8/g, '⅛');
  const directionsFraction116 = directionsFraction18.replace(/1\/16/g, '⅛');

  const notes = document.querySelector('#recipe-notes').value.trim();

  const ingredientsMarkdown = ingredientsFraction116.split('\n')
    .map(ingredient => `- ${ingredient.trim()}`)
    .filter(ingredient => !/^-[\s]*$/.test(ingredient))
    .join('\n');

  const directionsMarkdown = directionsFraction116.split('\n')
    .map(instruction => `- ${instruction.trim()}`)
    .filter(instruction => !/^-[\s]*$/.test(instruction))
    .join('\n');
	
let markdown = `---
layout: recipe
title: "${name}"
`

if (tags !== '') {
  markdown += `
tags:${tags.split(' ').map(tag => tag.trim()).join(', ')}
`;
}

if (imgCredit !== '') {
  markdown += `imagecredit: ${imgCredit}
`;
}

if (tag !== '') {
  markdown += `tag: ${tag}
`;
}


if (prepHours !== '' || prepMinutes !== '') {
  const prepTimeFormatted = `PT${prepHours !== '' ? prepHours + 'h' : ''}${prepMinutes !== '' ? prepMinutes + 'm' : ''}`;
  markdown += `preptime: ${prepTimeFormatted}
`;
}

if (cookHours !== '' || cookMinutes !== '') {
  const cookTimeFormatted = `PT${cookHours !== '' ? cookHours + 'h' : ''}${cookMinutes !== '' ? cookMinutes + 'm' : ''}`;
  markdown += `cooktime: ${cookTimeFormatted}
`;
}

markdown += `
ingredients:
${ingredientsMarkdown}

directions:
${directionsMarkdown}
---`

if (notes !== '') {
  markdown += `

${notes}`;
}

markdown += `

`;

output.innerHTML = `<pre><code>${markdown}</code></pre>`;

});

copyButton.addEventListener('click', () => {
const range = document.createRange();
range.selectNode(output);
window.getSelection().removeAllRanges();
window.getSelection().addRange(range);
document.execCommand('copy');
window.getSelection().removeAllRanges();
});

</script>

</body>
