(function () {
  var STORAGE_KEY = 'chowdown:timer-settings';
  var DEFAULT_SETTINGS = { soundId: 'vibrate' };

  var modal = document.getElementById('recipe-timer-modal');
  var openButton = document.getElementById('recipe-timer-open');
  var closeButtons = document.querySelectorAll('[data-timer-close]');
  var displayHours = document.getElementById('recipe-timer-hours');
  var displayMinutes = document.getElementById('recipe-timer-minutes');
  var displaySeconds = document.getElementById('recipe-timer-seconds');
  var status = document.getElementById('recipe-timer-status');
  var hoursInput = document.getElementById('recipe-timer-hours-input');
  var minutesInput = document.getElementById('recipe-timer-minutes-input');
  var secondsInput = document.getElementById('recipe-timer-seconds-input');
  var startButton = document.getElementById('recipe-timer-start');
  var pauseButton = document.getElementById('recipe-timer-pause');
  var resetButton = document.getElementById('recipe-timer-reset');
  var settingsToggle = document.getElementById('recipe-timer-settings-toggle');
  var settingsPanel = document.getElementById('recipe-timer-settings');
  var soundSelect = document.getElementById('recipe-timer-sound-select');
  var soundCatalog = loadSoundCatalog();
  var settings = loadSettings(soundCatalog);

  if (!modal || !openButton || !displayHours || !displayMinutes || !displaySeconds) {
    return;
  }

  var timerId = null;
  var remainingSeconds = 0;
  var running = false;
  var audioContext = null;
  var activeAudio = null;

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function toInt(value, fallback) {
    var parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function deriveSoundName(url, fallbackName) {
    var source = String(fallbackName || url || '').trim();
    if (!source) return 'Timer Sound';

    source = source.split('/').pop() || source;
    source = source.replace(/\.[a-z0-9]+$/i, '');

    return source || 'Timer Sound';
  }

  function getDefaultSoundId(catalog) {
    var list = Array.isArray(catalog) ? catalog : [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].type === 'audio') {
        return list[i].id;
      }
    }
    return (list[0] && list[0].id) || DEFAULT_SETTINGS.soundId;
  }

  function loadSettings(catalog) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { soundId: getDefaultSoundId(catalog) };

      var parsed = JSON.parse(raw);
      return {
        soundId: String(parsed.soundId || getDefaultSoundId(catalog))
      };
    } catch (e) {
      return { soundId: getDefaultSoundId(catalog) };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
    }
  }

  function loadSoundCatalog() {
    var list = [];
    var node = document.getElementById('recipe-timer-sounds');
    if (!node) {
      list.push({ id: 'vibrate', name: 'Vibrate', type: 'vibrate' });
      return list;
    }

    try {
      var repoSounds = JSON.parse(node.textContent || '[]');
      if (!Array.isArray(repoSounds)) return list;

      repoSounds.forEach(function (sound) {
        if (!sound || !sound.url) return;
        list.push({
          id: String(sound.id || '').trim() || sound.url,
          name: deriveSoundName(sound.url, sound.name),
          type: 'audio',
          url: String(sound.url).trim(),
          source: 'repo'
        });
      });
    } catch (e) {
    }

    list.push({ id: 'vibrate', name: 'Vibrate', type: 'vibrate' });

    return list;
  }

  function getSoundById(id) {
    for (var i = 0; i < soundCatalog.length; i += 1) {
      if (soundCatalog[i].id === id) {
        return soundCatalog[i];
      }
    }
    return soundCatalog[0] || { id: 'vibrate', name: 'Vibrate', type: 'vibrate' };
  }

  function ensureValidSelectedSound() {
    var exists = false;
    for (var i = 0; i < soundCatalog.length; i += 1) {
      if (soundCatalog[i].id === settings.soundId) {
        exists = true;
        break;
      }
    }

    if (!exists) {
      settings.soundId = getDefaultSoundId(soundCatalog);
      saveSettings();
    }
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function updateDisplay(seconds) {
    var safeSeconds = Math.max(0, seconds);
    var hours = Math.floor(safeSeconds / 3600);
    var minutes = Math.floor((safeSeconds % 3600) / 60);
    var secs = safeSeconds % 60;

    displayHours.textContent = pad(hours);
    displayMinutes.textContent = pad(minutes);
    displaySeconds.textContent = pad(secs);
  }

  function updateInputs(seconds) {
    var safeSeconds = Math.max(0, seconds);
    var hours = Math.floor(safeSeconds / 3600);
    var minutes = Math.floor((safeSeconds % 3600) / 60);
    var secs = safeSeconds % 60;

    hoursInput.value = hours ? String(hours) : '';
    minutesInput.value = minutes ? String(minutes) : '';
    secondsInput.value = secs ? String(secs) : '';
  }

  function readInputs() {
    var hours = clamp(toInt(hoursInput.value, 0), 0, 99);
    var minutes = clamp(toInt(minutesInput.value, 0), 0, 59);
    var seconds = clamp(toInt(secondsInput.value, 0), 0, 59);
    return hours * 3600 + minutes * 60 + seconds;
  }

  function updateFromInputs() {
    if (running) return;
    remainingSeconds = readInputs();
    updateDisplay(remainingSeconds);
  }

  function isModalOpen() {
    return !modal.classList.contains('is-hidden');
  }

  function parseIsoDuration(iso) {
    if (!iso) return 0;

    var datePart = String(iso).toUpperCase().split('T')[0] || '';
    var timePart = String(iso).toUpperCase().split('T')[1] || '';

    function readPart(source, unit) {
      var match = source.match(new RegExp('(\\d+(?:\\.\\d+)?)' + unit, 'i'));
      return match ? parseFloat(match[1]) : 0;
    }

    return Math.round(
      readPart(datePart, 'D') * 86400 +
      readPart(timePart, 'H') * 3600 +
      readPart(timePart, 'M') * 60 +
      readPart(timePart, 'S')
    );
  }

  function getRecipeDefaultSeconds() {
    var totalNode = document.querySelector('[id^="totalTime_"][data-iso8601]');
    var totalIso = totalNode ? totalNode.getAttribute('data-iso8601') : '';
    var fallbackMeta = document.querySelector('meta[itemprop="totalTime"]');

    if (!totalIso && fallbackMeta) {
      totalIso = fallbackMeta.getAttribute('content') || '';
    }

    if (totalIso) {
      return parseIsoDuration(totalIso);
    }

    var prepNode = document.querySelector('[id^="prepTime_"][data-iso8601]');
    var cookNode = document.querySelector('[id^="cookTime_"][data-iso8601]');
    var prepIso = prepNode ? prepNode.getAttribute('data-iso8601') : '';
    var cookIso = cookNode ? cookNode.getAttribute('data-iso8601') : '';

    return parseIsoDuration(prepIso) + parseIsoDuration(cookIso);
  }

  function seedFromRecipeTime() {
    var seconds = getRecipeDefaultSeconds();

    if (remainingSeconds === 0 && seconds > 0 && !hoursInput.value && !minutesInput.value && !secondsInput.value) {
      remainingSeconds = seconds;
      updateInputs(seconds);
      updateDisplay(seconds);
      setStatus('Loaded the recipe total time.');
    }
  }

  function ensureAudioContext() {
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    if (!audioContext) {
      audioContext = new Ctor();
    }
    if (audioContext.state === 'suspended' && audioContext.resume) {
      audioContext.resume().catch(function () {});
    }
    return audioContext;
  }

  function stopActiveAudio() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
  }

  function vibratePattern() {
    if (navigator.vibrate) {
      navigator.vibrate([150, 75, 150]);
    }
  }

  function playTonePattern(pattern) {
    var context = ensureAudioContext();
    if (!context) {
      vibratePattern();
      return;
    }

    var startTime = context.currentTime;
    var offset = 0;

    pattern.forEach(function (step) {
      var oscillator = context.createOscillator();
      var gainNode = context.createGain();
      var duration = step.duration || 0.18;
      var gap = step.gap || 0;
      var volume = typeof step.volume === 'number' ? step.volume : 0.2;

      oscillator.type = step.wave || 'sine';
      oscillator.frequency.value = step.frequency;
      gainNode.gain.value = 0;

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      gainNode.gain.setValueAtTime(0.0001, startTime + offset);
      gainNode.gain.exponentialRampToValueAtTime(volume, startTime + offset + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + offset + duration);

      oscillator.start(startTime + offset);
      oscillator.stop(startTime + offset + duration + 0.03);

      offset += duration + gap;
    });

    vibratePattern();
  }

  function playAudioUrl(url) {
    stopActiveAudio();
    activeAudio = new Audio(url);
    activeAudio.play().catch(function () {
      vibratePattern();
    });
  }

  function playSelectedSound() {
    var sound = getSoundById(settings.soundId);
    if (!sound) return;

    if (sound.type === 'audio' && sound.url) {
      playAudioUrl(sound.url);
      return;
    }

    vibratePattern();
  }

  function setInputsDisabled(disabled) {
    hoursInput.disabled = disabled;
    minutesInput.disabled = disabled;
    secondsInput.disabled = disabled;
  }

  function stopTimer(keepTime) {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
    running = false;
    setInputsDisabled(false);
    if (!keepTime) {
      remainingSeconds = 0;
      updateDisplay(0);
      updateInputs(0);
    }
  }

  function finishTimer() {
    stopTimer(true);
    remainingSeconds = 0;
    updateDisplay(0);
    setInputsDisabled(false);
    setStatus('Timer finished.');
    playSelectedSound();
  }

  function startTimer() {
    if (running) return;

    if (remainingSeconds <= 0) {
      remainingSeconds = readInputs();
    }

    if (remainingSeconds <= 0) {
      setStatus('Set a time before starting.');
      return;
    }

    ensureAudioContext();
    updateDisplay(remainingSeconds);
    setInputsDisabled(true);
    setStatus('Timer running.');
    running = true;

    timerId = window.setInterval(function () {
      remainingSeconds = Math.max(0, remainingSeconds - 1);
      updateDisplay(remainingSeconds);
      if (remainingSeconds === 0) {
        finishTimer();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!running) return;
    stopTimer(true);
    setStatus('Timer paused.');
  }

  function resetTimer() {
    stopTimer(false);
    setStatus('Timer reset.');
  }

  function renderSoundSelect() {
    if (!soundSelect) return;

    soundSelect.innerHTML = '';
    soundCatalog.forEach(function (sound) {
      var option = document.createElement('option');
      option.value = sound.id;
      option.textContent = sound.name;
      if (sound.id === settings.soundId) {
        option.selected = true;
      }
      soundSelect.appendChild(option);
    });
  }

  function openSettings() {
    if (!settingsPanel) return;
    settingsPanel.classList.toggle('is-hidden');
  }

  function showModal() {
    seedFromRecipeTime();
    modal.classList.remove('is-hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('recipe-timer-open');
    renderSoundSelect();
    window.setTimeout(function () {
      startButton.focus();
    }, 0);
  }

  function hideModal() {
    stopTimer(true);
    modal.classList.add('is-hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('recipe-timer-open');
    openButton.focus();
  }

  function handleCloseRequest(event) {
    if (event) {
      event.preventDefault();
    }
    hideModal();
  }

  openButton.addEventListener('click', showModal);

  Array.prototype.forEach.call(closeButtons, function (button) {
    button.addEventListener('click', handleCloseRequest);
  });

  modal.addEventListener('click', function (event) {
    if (event.target && event.target.hasAttribute('data-timer-close')) {
      handleCloseRequest(event);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isModalOpen()) {
      handleCloseRequest(event);
    }
  });

  hoursInput.addEventListener('input', updateFromInputs);
  minutesInput.addEventListener('input', updateFromInputs);
  secondsInput.addEventListener('input', updateFromInputs);

  startButton.addEventListener('click', startTimer);
  pauseButton.addEventListener('click', pauseTimer);
  resetButton.addEventListener('click', resetTimer);

  if (settingsToggle) {
    settingsToggle.addEventListener('click', openSettings);
  }

  if (soundSelect) {
    soundSelect.addEventListener('change', function () {
      settings.soundId = soundSelect.value;
      saveSettings();
      setStatus('Alert sound set to ' + getSoundById(settings.soundId).name + '.');
    });
  }

  ensureValidSelectedSound();
  updateDisplay(0);
  setStatus('Set a time and start the countdown.');
})();
