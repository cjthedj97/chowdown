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
    <p><b>1.</b> First the Recipe needs to be converted into a format the website is able to use.</p>
    <p><b>2.</b> Please enter in all the information you have available in the boxes on the right-hand side of the screen.</p>
    <p><b>3.</b> Once done, click convert, and below you will see the converted recipe.</p>
    <p><b>3½.</b> If you see anything that is incorrect, now would be the time to correct and click the convert button again.</p>
    <p><b>4.</b> Now there are two options to share the recipe: Email or Copy.</p>
    <p>● Clicking the 'Send Email' button will open your default email client with the formatted recipe already filled in.</p>
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
        <input type="url" id="recipe-img-credit" placeholder="URL of source if found online">
      </div>

      <div>
        <input type="url" id="recipe-image-link" placeholder="URL of the recipe image">
      </div>

      <div>
        <input type="text" id="recipe-yield" placeholder="Recipe Yield/Servings">
      </div>

      <div>
        <label for="recipe-date-added">Date Added (for Recently Added)</label>
        <input type="date" id="recipe-date-added">
      </div>

      <div>
        <label for="recipe-status">Recipe Status</label>
        <select id="recipe-status">
          <option value="published" selected>published</option>
          <option value="planned">planned</option>
          <option value="draft">draft</option>
        </select>
      </div>

      <div>
        <input type="number" id="recipe-prep-hours" placeholder="Prep Time: Hours" min="0" max="24">
        <input type="number" id="recipe-prep-minutes" placeholder="Prep Time: Minutes" min="0" max="60">
      </div>

      <div>
        <input type="number" id="recipe-cook-hours" placeholder="Cook Time: Hours" min="0" max="24">
        <input type="number" id="recipe-cook-minutes" placeholder="Cook Time: Minutes" min="0" max="60">
      </div>

      <div>
        <textarea placeholder="Ingredients one on each line" id="recipe-ingredients"></textarea>
      </div>

      <div>
        <textarea placeholder="Directions one step per line" id="recipe-directions"></textarea>
      </div>

      <div>
        <textarea placeholder="Recipe notes (optional)" id="recipe-notes"></textarea>
      </div>

      <button type="submit">Convert</button>
      <button type="button" onclick="sendEmail()">Send Email</button>
      <button id="copy-button" type="button">Copy to clipboard</button>
      <button type="button" onclick="clearForm()">Clear</button>
    </form>
  </div>
</div>

<div class="bottom-column" id="bottom-column"></div>
<div id="convert-status" style="padding: 10px 20px;"></div>

<script>
  const form = document.querySelector('#recipe-form');
  const output = document.querySelector('.bottom-column');
  const copyButton = document.querySelector('#copy-button');
  const statusBox = document.querySelector('#convert-status');
  document.querySelector('#recipe-date-added').value = new Date().toISOString().slice(0, 10);

  function setStatus(message, type = 'ok') {
    const color = type === 'error' ? '#b91c1c' : '#166534';
    statusBox.innerHTML = `<p style="color:${color};margin:0;">${message}</p>`;
  }

  function yamlSafe(value) {
    return (value || '').replace(/"/g, '\\"');
  }

  function cleanListLine(line) {
    return line
      .replace(/^\s*[-*]\s+/, '')
      .replace(/^\s*\d+[\.)]\s+/, '')
      .trim();
  }

  function normalizeUnitsAndFractions(value) {
    return (value || '')
      .replace(/\bounces?\b/gi, 'oz')
      .replace(/\bpounds?\b/gi, 'lb')
      .replace(/1\/16/g, '1/16')
      .replace(/1\/8/g, '⅛')
      .replace(/1\/4/g, '¼')
      .replace(/1\/3/g, '⅓')
      .replace(/1\/2/g, '½')
      .replace(/2\/3/g, '⅔')
      .replace(/3\/4/g, '¾');
  }

  function parseList(text) {
    return text
      .split('\n')
      .map(cleanListLine)
      .filter(Boolean)
      .map(normalizeUnitsAndFractions);
  }

  function formatDuration(hoursRaw, minutesRaw) {
    const h = Number(hoursRaw || 0);
    const m = Number(minutesRaw || 0);
    const parts = [];
    if (h > 0) parts.push(`${h} hr${h > 1 ? 's' : ''}`);
    if (m > 0) parts.push(`${m} min${m > 1 ? 's' : ''}`);
    return parts.join(' ');
  }

  function totalMinutes(hoursRaw, minutesRaw) {
    const h = Number(hoursRaw || 0);
    const m = Number(minutesRaw || 0);
    return (h * 60) + m;
  }

  function formatTotalMinutes(mins) {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return formatDuration(h, m);
  }

  function yamlBlock(value) {
    return (value || '')
      .split('\n')
      .map(line => `  ${line.replace(/\t/g, '    ')}`)
      .join('\n');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.querySelector('#recipe-name').value.trim();
    const tagsRaw = document.querySelector('#recipe-tags').value.trim();
    const imgCredit = document.querySelector('#recipe-img-credit').value.trim();
    const imageLink = document.querySelector('#recipe-image-link').value.trim();
    const longTag = document.querySelector('#recipe-tag').value.trim();
    const ingredientsRaw = document.querySelector('#recipe-ingredients').value.trim();
    const directionsRaw = document.querySelector('#recipe-directions').value.trim();
    const yieldValue = document.querySelector('#recipe-yield').value.trim();
    const dateAdded = document.querySelector('#recipe-date-added').value.trim();
    const recipeStatus = document.querySelector('#recipe-status').value.trim();
    const prepHours = document.querySelector('#recipe-prep-hours').value.trim();
    const prepMinutes = document.querySelector('#recipe-prep-minutes').value.trim();
    const cookHours = document.querySelector('#recipe-cook-hours').value.trim();
    const cookMinutes = document.querySelector('#recipe-cook-minutes').value.trim();
    const notes = document.querySelector('#recipe-notes').value.trim();

    const ingredients = parseList(ingredientsRaw);
    const directions = parseList(directionsRaw);

    if (!name) {
      setStatus('Recipe name is required.', 'error');
      return;
    }
    if (!ingredients.length) {
      setStatus('Add at least one ingredient line.', 'error');
      return;
    }
    if (!directions.length) {
      setStatus('Add at least one direction step.', 'error');
      return;
    }

    const tags = [];
    tagsRaw.split(/[\s,]+/).map(t => t.trim()).filter(Boolean).forEach(t => tags.push(t));
    if (longTag) tags.push(longTag);

    const prepTime = formatDuration(prepHours, prepMinutes);
    const cookTime = formatDuration(cookHours, cookMinutes);
    const totalTime = formatTotalMinutes(totalMinutes(prepHours, prepMinutes) + totalMinutes(cookHours, cookMinutes));

    let markdown = `---\nlayout: recipe\ntitle: "${yamlSafe(name)}"\n`;

    if (imageLink) markdown += `image: ${imageLink}\n`;
    if (imgCredit) markdown += `imagecredit: ${imgCredit}\n`;
    if (tags.length) markdown += `tags: ${tags.join(' ')}\n`;
    if (dateAdded) markdown += `date_added: ${dateAdded}\n`;
    if (recipeStatus) markdown += `status: ${recipeStatus}\n`;
    if (yieldValue) markdown += `servings: ${yamlSafe(yieldValue)}\n`;
    if (prepTime) markdown += `prep_time: "${prepTime}"\n`;
    if (cookTime) markdown += `cook_time: "${cookTime}"\n`;
    if (totalTime) markdown += `total_time: "${totalTime}"\n`;
    if (notes) markdown += `notes: |\n${yamlBlock(notes)}\n`;

    markdown += `\ningredients:\n${ingredients.map(item => `- ${item}`).join('\n')}\n\n`;
    markdown += `directions:\n${directions.map(item => `- ${item}`).join('\n')}\n---`;

    output.textContent = markdown;
    setStatus('Conversion complete. Review output, then copy or email.');
  });

  copyButton.addEventListener('click', async () => {
    const content = output.textContent.trim();
    if (!content) {
      setStatus('Nothing to copy yet. Convert a recipe first.', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      setStatus('Converted recipe copied to clipboard.');
    } catch (error) {
      setStatus('Clipboard copy failed. Try selecting and copying manually.', 'error');
    }
  });

  function sendEmail() {
    const outputContent = document.querySelector('.bottom-column').textContent.trim();
    if (!outputContent) {
      setStatus('Nothing to email yet. Convert a recipe first.', 'error');
      return;
    }
    location.href = `mailto:recipes@saathoff.us?subject=Recipe Submission&body=${encodeURIComponent(outputContent)}`;
  }

  function clearForm() {
    document.querySelector('#recipe-name').value = '';
    document.querySelector('#recipe-tags').value = '';
    document.querySelector('#recipe-img-credit').value = '';
    document.querySelector('#recipe-image-link').value = '';
    document.querySelector('#recipe-tag').value = '';
    document.querySelector('#recipe-ingredients').value = '';
    document.querySelector('#recipe-directions').value = '';
    document.querySelector('#recipe-notes').value = '';
    document.querySelector('#recipe-prep-hours').value = '';
    document.querySelector('#recipe-prep-minutes').value = '';
    document.querySelector('#recipe-cook-hours').value = '';
    document.querySelector('#recipe-cook-minutes').value = '';
    document.querySelector('#recipe-yield').value = '';
    document.querySelector('#recipe-date-added').value = '';
    document.querySelector('#recipe-status').value = 'published';

    document.querySelector('.bottom-column').textContent = '';
    statusBox.innerHTML = '';
  }
</script>
</body>
