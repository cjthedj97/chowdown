# Chowdown

A simple, plaintext recipe database for hackers.

Be aware my version of chowdown has diverged from the orignal name sake by quite a bit as I have changed and modifided things.

[https://recipes.saathoff.us](https://recipes.saathoff.us)

# Writing a Recipe

The recipes are stored in the collection "Recipes" (the folder /_recipes).

They are written in Markdown and contain a few special sections:

- The frontmatter, which contains:
 - Title, Image, and Layout (which is "recipe")
 - Ingredients (a list of things in the dish)
 - Directions (a list of steps for the dish)
- Body content (for intros, stories, written detail)


Below is an example of most of the options you can use

```
---
layout: recipe
title: "Recipe Title Here"
image: image-name.jpg  # Replace with the image file or URL to one
imagecredit: URL to image credit  # Optional: link to source of the image
tags: tag1 tag2 tag3  # List of tags or keywords related to the recipe
servings: 4  # Optional: Number of servings
prep_time: "10 mins"  # Optional: Preparation time
cook_time: "30 mins"  # Optional: Cooking time
total_time: "40 mins"  # Optional: Total time

ingredients:
- Ingredient 1
- Ingredient 2, with quantity and preparation details if needed
- Ingredient 3, etc.

directions:
- Step 1: Describe the first step here
- Step 2: Continue with detailed steps
- Step 3: Additional steps if needed
- Step 4: Final steps
---

Pleace any additional notes here, will be shown at the top of the recipe page 
```

If you need help with Markdown, here's a [handy cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet).

# Writing a component recipe

A component recipe is a special recipe made up of other recipes. To make a new component recipe:

- place your smaller, single recipes into the /_components folder
- make a new recipe like normal in the /_recipes folders
- in the frontmatter of this new recipe, include your recipes from the /_components folder (instead of the usual Ingredeints list)
