---
layout: null
title: Offline Page
permalink: /offline
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Page</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f4f4f4;
      --text: #333;
      --muted: #777;
      --surface: #fff;
      --accent: #d9534f;
      --shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f172a;
        --text: #e5e7eb;
        --muted: #9ca3af;
        --surface: #111827;
        --accent: #f87171;
        --shadow: 0 0 18px rgba(0, 0, 0, 0.35);
      }
    }

    body {
      font-family: 'Arial', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      text-align: center;
      margin: 100px auto;
    }

    h1 {
      color: var(--accent);
    }

    p {
      font-size: 18px;
      line-height: 1.6;
      color: var(--muted);
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: var(--surface);
      box-shadow: var(--shadow);
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Oops! You are offline</h1>
    <p>
      It seems like you're currently offline. Please check your internet connection and try again.
    </p>
  </div>
</body>
</html>
