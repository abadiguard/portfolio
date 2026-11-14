(function () {
  const sequence = document.querySelector('.ownership-sequence');
  if (!sequence) return;
  sequence.classList.add('is-enhanced');
  const frame = sequence.querySelector('.frame');
  const stepNav = frame.querySelector('.ownership-steps');
  const stepButtons = Array.from(stepNav?.querySelectorAll?.('button') ?? []);
  const gardenStrip = frame.querySelector('.garden-strip');
  const ground = frame.querySelector('.garden-ground path');
  const landscape = gardenStrip.querySelector('.garden-landscape');
  const thorn = landscape.querySelector('.garden-thorn');
  const uprootMarks = frame.querySelector('.uproot-marks');
  const sowing = frame.querySelector('.sowing');
  const firstCopy = frame.querySelector('.first-copy');
  const secondCopy = frame.querySelector('.second-copy');
  const finalCopy = frame.querySelector('.final-copy');
  const sprout = sowing.querySelector('.sprout');
  const sproutStroke = sprout.querySelector('.stem');
  const sproutReveal = sowing.querySelector('.sprout-reveal');
  const flowerGrowth = sowing.querySelector('.flower-growth');
  const flowerStalk = flowerGrowth.querySelector('.flower-stalk');
  const flowerHead = flowerGrowth.querySelector('.flower-head');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => value * value * (3 - 2 * value);

  const thornPanEnd = 0.61 * (2 / 3);
  const thornCentered = 0.33 * thornPanEnd;
  const sowingStarts = 0.33;
  const sproutFinished = 0.64;
  const seedBurialKeyframe = 0.59;
  const packetFinished = sowingStarts + (sproutFinished - sowingStarts) * seedBurialKeyframe;
  const segments = [
    { end: thornCentered, duration: 1700 },
    { end: packetFinished, duration: 3538, thornExit: true },
    { end: sproutFinished, duration: 1292 },
    { end: 1, duration: 2100 }
  ];
  let segmentRunning = false;
  let segmentFrame = 0;
  let elevatorRunning = false;
  let returningFromSkip = false;
  let waitingForGesture = false;
  let completedSegment = -1;
  let finalStop = null;
  let playingStep = null;
  let lateSeedTime = 0;
  let settlingScene = false;
  let acceptedScrollY = window.scrollY;
  let lastInputTime = -Infinity;
  let lastInputWasForward = false;
  let lastInputWasTouch = false;
  let touchAdvanceQueued = false;
  let touchOwnsScroll = false;

  function measureScrollRange() {
    const frameHeight = frame.offsetHeight;
    // Mobile browser bars can change the visible area independently of the layout.
    const visibleViewport = window.visualViewport;
    const viewportHeight = visibleViewport?.scale === 1
      ? visibleViewport.height + visibleViewport.offsetTop
      : document.documentElement.clientHeight;
    const ownershipSection = sequence.closest('.own');
    const nextSectionGap = Number.parseFloat(getComputedStyle(ownershipSection).paddingBottom) || 0;
    const frameTop = Math.ceil(viewportHeight - frameHeight - nextSectionGap);
    const distance = sequence.offsetHeight - frameHeight;
    const startDelay = Math.min(160, Math.max(0, distance * 0.14));
    const start = window.scrollY + sequence.getBoundingClientRect().top - frameTop + startDelay;
    return { frameTop, start, openingVisibleAt: start - startDelay, end: start + distance - startDelay };
  }

  function draw(resetToOpening = false) {
    if (returningFromSkip) return;
    const { frameTop, start, end, openingVisibleAt } = measureScrollRange();
    if (!segmentRunning && completedSegment === segments.length - 1 &&
        finalStop !== null && acceptedScrollY === finalStop && window.scrollY === finalStop) {
      if (Math.floor(end) !== finalStop) scrollInstantly(Math.floor(end));
      finalStop = acceptedScrollY;
    }
    sequence.classList.toggle('owns-touch-scroll', !reducedMotion.matches &&
      acceptedScrollY >= Math.floor(openingVisibleAt) && acceptedScrollY < end - 1);
    frame.style.setProperty('--frame-top', frameTop + 'px');
    const overall = resetToOpening || acceptedScrollY <= Math.ceil(start) ? 0 : clamp((acceptedScrollY - start) / Math.max(1, end - start));
    const terrainProgress = overall < sowingStarts
      ? Math.min(overall, thornCentered)
      : overall - (sowingStarts - thornCentered) - Math.max(0, Math.min(overall, 0.68) - sproutFinished);
    const terrainTravel = reducedMotion.matches ? 0 : terrainProgress * 420;
    const terrain = Array.from({ length: 21 }, (_, index) => {
      const x = -8 + index * 9.6;
      const edgeTaper = Math.sin(Math.PI * index / 20);
      const sample = x + terrainTravel;
      const relief = 1.6 * Math.sin(sample / 21) + 0.65 * Math.sin(sample / 9 + 1);
      return { x, y: 149 + edgeTaper * relief };
    });
    let groundPath = 'M-8 149';
    for (let index = 1; index < terrain.length - 1; index++) {
      const point = terrain[index];
      const next = terrain[index + 1];
      groundPath += ` Q${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`;
    }
    ground.setAttribute('d', groundPath + ' Q184 149 184 149');
    const progress = clamp(overall / sowingStarts);
    const flowerStart = Math.ceil(start + sproutFinished * (end - start));
    const flowerProgress = resetToOpening ? 0 : completedSegment === segments.length - 1 ? 1 : clamp((acceptedScrollY - flowerStart) / Math.max(1, end - flowerStart));
    const sowProgress = clamp((overall - sowingStarts) / (sproutFinished - sowingStarts));
    const packetEntering = sowProgress >= 0.08 || completedSegment >= 1;
    const step = resetToOpening ? 0 : playingStep ?? Math.min(3, completedSegment + 1);
    const activeCopy = step === 1 ? firstCopy
      : step === 2 && packetEntering ? secondCopy
      : step === 3 && sowProgress > 0.61 ? finalCopy
      : null;
    const descriptionVisible = step === 1 ? completedSegment >= 0 || settlingScene
      : step === 2 ? completedSegment >= 1 || settlingScene
      : step === 3 && completedSegment >= 2;
    [firstCopy, secondCopy, finalCopy].forEach(copy => {
      copy.hidden = copy !== activeCopy;
      copy.setAttribute('aria-hidden', String(copy.hidden));
      const description = copy.querySelector('.stage-description');
      const descriptionHidden = copy.hidden || !descriptionVisible;
      description?.toggleAttribute('data-copy-hidden', descriptionHidden);
      description?.setAttribute('aria-hidden', String(descriptionHidden));
    });
    sowing.style.opacity = overall >= sowingStarts ? '1' : '0';
    const openingIdle = !segmentRunning && overall === 0;
    sequence.classList.toggle('is-opening-idle', openingIdle);
    sequence.classList.toggle('is-story-visible', openingInView || overall > 0);
    const atFinalStop = completedSegment === segments.length - 1 && acceptedScrollY === finalStop;
    sequence.classList.toggle('is-guide-suspended', (acceptedScrollY >= end && !atFinalStop) || returningFromSkip);
    sequence.classList.toggle('is-guide-complete', activeCopy === finalCopy &&
      completedSegment === segments.length - 1);
    stepButtons.forEach((button, index) => {
      if (index === Math.max(0, step - 1)) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const scan = clamp(progress / thornPanEnd);
    const impactAt = 0.68;
    const compressionTime = 0.06;
    const releaseAt = 0.77;
    const sweepSpeed = 900;
    const contactPan = impactAt * sweepSpeed;
    const stopPan = contactPan + sweepSpeed * compressionTime / 2;
    const compression = clamp((scan - impactAt) / compressionTime);
    const rebound = clamp((scan - releaseAt) / (1 - releaseAt));
    const impactPan = contactPan + sweepSpeed * compressionTime
      * (compression - compression ** 2 / 2);
    const pan = reducedMotion.matches ? (scan === 1 ? 600 : 0)
      : scan < impactAt ? sweepSpeed * scan
      : scan < releaseAt ? impactPan
      : stopPan + (600 - stopPan) * smooth(rebound);
    const lateSeedDrop = completedSegment >= 1 ? 1 : smooth(clamp((lateSeedTime - 1000) / 360));
    sowing.style.setProperty('--late-seed-drop', String(lateSeedDrop * 16) + 'px');
    const leafProgress = reducedMotion.matches ? 0 : clamp((sowProgress - 0.87) / 0.13);
    const sway = Math.sin(leafProgress * Math.PI * 2) * Math.sin(leafProgress * Math.PI);
    const flowerIsGrown = flowerProgress >= 0.76 || (reducedMotion.matches && flowerProgress > 0);
    drawLeaves(sway, -sway, flowerIsGrown);
    animateFinalLeaves = flowerIsGrown && !reducedMotion.matches;
    if (animateFinalLeaves && flowerInView && !leafFramePending) {
      leafFramePending = true;
      requestAnimationFrame(swayFinalLeaves);
    }
    const sowingTime = 3600 * sowProgress;
    const animations = sowing.getAnimations?.({ subtree: true }) ?? [];
    if (animations.length) {
      for (const animation of animations) animation.currentTime = sowingTime;
    } else {
      sowing.style.setProperty('--seek', String(-sowingTime / 1000) + 's');
    }
    // Move the SVG clip directly so growth does not depend on CSS transforms on clip paths.
    const growth = clamp((sowProgress - 0.61) / 0.26);
    const revealOffset = 42 * (1 - growth) ** 2;
    sproutReveal?.setAttribute('y', String(-40 + revealOffset));
    drawFlower(reducedMotion.matches && flowerProgress > 0 ? 1 : flowerProgress);
    landscape.setAttribute('transform', 'translate(' + pan + ' 0)');
    gardenStrip.style.visibility = overall < sowingStarts ? 'visible' : 'hidden';

    const exitProgress = clamp((overall - thornCentered) / (sowingStarts - thornCentered));
    const motionProgress = reducedMotion.matches ? 0 : 0.75 + 0.25 * exitProgress;
    const pull = smooth(clamp((motionProgress - 0.75) / 0.09));
    const toss = clamp((motionProgress - 0.84) / 0.13);
    const throwDistance = 110 + frame.clientWidth * 80 / gardenStrip.clientWidth;
    const arc = toss * Math.PI / 2;
    const x = throwDistance * (1 - Math.cos(arc));
    const y = -44 * pull - 48 * Math.sin(arc);
    const angle = 10 * pull + 36 * smooth(toss);
    const burst = clamp((motionProgress - 0.78) / 0.19);
    const spread = 1 - (1 - burst) ** 2;
    const marksIn = smooth(clamp(burst / 0.15));
    const marksOut = smooth(clamp((burst - 0.71) / 0.29));
    const stretch = smooth(clamp(burst / 0.43));
    const shrink = smooth(clamp((burst - 0.67) / 0.33));
    const lengthScale = (0.35 + 2.25 * stretch) * (1 - 0.93 * shrink);
    const particles = [
      [-1, 5, 19, 34, 4], [-1, 8, 26, 23, 3], [-1, 4, 12, 43, 2],
      [1, 6, 18, 16, 4], [1, 8, 27, 8, 3], [1, 3, 12, 22, 2]
    ];
    const marks = particles.map(([side, offset, reach, lift, length]) => {
      const startX = 88 + side * (offset + reach * spread);
      const startY = 139 - lift * spread + 19 * burst ** 2;
      const markLength = length * lengthScale;
      return `M${startX} ${startY} l${side * markLength} ${-markLength * lift / reach}`;
    });
    uprootMarks.firstElementChild.setAttribute('d', marks.join(' '));
    uprootMarks.style.opacity = String(marksIn * (1 - marksOut));
    thorn.setAttribute('transform', 'translate(' + x + ' ' + y + ') rotate(' + angle + ' 88 149)');
  }

  let openingInView = typeof IntersectionObserver !== 'function';
  let openingReadyAt = 0;
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([entry]) => {
      const visible = entry.intersectionRatio >= 0.25;
      if (visible && !openingInView) openingReadyAt = performance.now() + 2000;
      openingInView = visible;
      scheduleDraw();
    }, { threshold: 0.25 }).observe(frame.querySelector('.art'));
  }

  let animateFinalLeaves = false;
  let flowerInView = typeof IntersectionObserver !== 'function';
  let leafFramePending = false;
  let leafSwayStartedAt = null;
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([entry]) => {
      flowerInView = entry.isIntersecting;
      scheduleDraw();
    }).observe(sowing);
  }

  function drawLeaves(left, right, showVeins) {
    sproutStroke.setAttribute('d', `M0 0 Q-3 -11 0 -22 Q-13 -21 ${-16 + 1.2 * left}
      -34 Q-5 -33 0 -22 Q5 -36 ${16 + 1.4 * right} -37 Q13 -24 0 -22` +
      (showVeins ? ` M-1 -23 Q-7 -27 ${-14 + left} -32 M1 -23 Q8 -30 ${14 + right} -35` : ''));
  }

  function swayFinalLeaves(now) {
    if (!animateFinalLeaves || !flowerInView || reducedMotion.matches) {
      leafFramePending = false;
      leafSwayStartedAt = null;
      return;
    }
    leafSwayStartedAt ??= now;
    const phase = (now - leafSwayStartedAt) * Math.PI * 2 / 3400;
    drawLeaves(0.65 * Math.sin(phase), -0.7 * Math.sin(phase * 0.85), true);
    requestAnimationFrame(swayFinalLeaves);
  }

  function drawFlower(progress) {
    flowerGrowth.setAttribute('visibility', progress > 0 ? 'visible' : 'hidden');
    const stem = smooth(clamp(progress / 0.64));
    const x = -2 * stem;
    const y = -22 - 20.7 * stem;
    flowerStalk.setAttribute('d', `M0 -22 Q${3 * stem} ${-22 - 10 * stem} ${x} ${y}`);
    const bloom = smooth(clamp((progress - 0.24) / 0.52));
    const nod = clamp((progress - 0.76) / 0.24);
    const angle = 7 * Math.sin(nod * Math.PI * 2) * Math.sin(nod * Math.PI);
    flowerHead.setAttribute('transform', `translate(${x} ${y}) rotate(${angle}) scale(${bloom})`);
  }

  let pending = false;
  function scheduleDraw() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      draw();
    });
  }

  function limitTravel(from, to, input = {}) {
    if (from === to || reducedMotion.matches) return to;

    const now = performance.now();
    const freshGesture = input.touch
      ? input.fresh
      : now - lastInputTime >= 180 || (to > from) !== lastInputWasForward;
    lastInputWasTouch = Boolean(input.touch);
    lastInputTime = now;
    lastInputWasForward = to > from;
    if (elevatorRunning) return from;
    const { start, end, openingVisibleAt } = measureScrollRange();
    const openingStop = Math.ceil(start);
    if (to < from) {
      touchAdvanceQueued = false;
      if (from >= end || returningFromSkip) {
        sequence.classList.toggle('is-guide-suspended', true);
      }
      if (to >= end) return null;
      if (from >= end || returningFromSkip) {
        returningFromSkip = true;
        sequence.classList.toggle('is-story-visible', false);
        moveElevator(openingStop, () => {
          returningFromSkip = false;
          waitingForGesture = true;
          sequence.classList.toggle('is-skipping', false);
          restartOpeningReveal();
          scheduleDraw();
        });
        return from;
      }
      if (!segmentRunning && !returningFromSkip && completedSegment < 0 && playingStep === null) {
        waitingForGesture = false;
        return null;
      }
      cancelAnimationFrame(segmentFrame);
      segmentRunning = false;
      completedSegment = -1;
      playingStep = null;
      lateSeedTime = 0;
      returningFromSkip = false;
      waitingForGesture = true;
      sequence.classList.toggle('is-skipping', false);
      restartOpeningReveal();
      return openingStop;
    }
    if (segmentRunning) {
      // A distinct swipe can request the next segment while this one finishes.
      if (input.touch && freshGesture) touchAdvanceQueued = true;
      return from;
    }
    const visibleAt = Math.floor(openingVisibleAt);
    if (from < visibleAt) {
      if (to < visibleAt) return null;
      waitingForGesture = true;
      return openingStop;
    }
    const stopFor = progress => Math.ceil(start + progress * (end - start));
    // Release native scrolling at the last frame, allowing for pixel rounding.
    if (completedSegment === segments.length - 1 || (completedSegment < 0 && from >= end - 1) || returningFromSkip) return null;
    if (waitingForGesture && !freshGesture) return from;

    const next = completedSegment >= 0
      ? segments[completedSegment + 1]
      : segments.find(segment => from < stopFor(segment.end));
    if (next) {
      const segmentStart = completedSegment >= 0 ? stopFor(segments[completedSegment].end) : Math.max(from, openingStop);
      playSegment(segmentStart, next);
      return segmentStart;
    }
    return null;
  }

  stepNav?.addEventListener('click', event => {
    const button = event.target.closest('button');
    const index = stepButtons.indexOf(button);
    if (index < 0) return;
    const step = index + 1;

    cancelAnimationFrame(segmentFrame);
    segmentRunning = false;
    elevatorRunning = false;
    returningFromSkip = false;
    waitingForGesture = true;
    lateSeedTime = 0;
    touchAdvanceQueued = false;
    playingStep = null;
    completedSegment = Math.max(-1, step - 2);
    sequence.classList.toggle('is-skipping', false);

    const { start, end } = measureScrollRange();
    const previous = segments[step - 2]?.end ?? 0;
    scrollInstantly(Math.ceil(start + previous * (end - start)));
    openingReadyAt = 0;
    playSegment(acceptedScrollY, segments[index], previous);
    draw();
  });

  function scrollInstantly(top) {
    window.scrollTo({ top, behavior: 'instant' });
    acceptedScrollY = window.scrollY;
  }

  function playSegment(from, segment, replayStart) {
    const segmentIndex = segments.indexOf(segment);
    const target = segment.end;
    playingStep = Math.min(3, segmentIndex + 1);
    const isOpeningSegment = segmentIndex === 0;
    // Let the title fade in before moving away from the opening flower.
    const openingTitleTime = isOpeningSegment && !reducedMotion.matches
      ? Math.max(1100, openingReadyAt - performance.now()) : 0;
    const duration = segment.duration;
    const { start, end } = measureScrollRange();
    const initialProgress = replayStart ?? clamp((from - start) / Math.max(1, end - start));
    const startedAt = performance.now();
    segmentRunning = true;
    settlingScene = false;
    // Hold the scene through the description fade before advancing.
    const settleDuration = reducedMotion.matches ? 0 : isOpeningSegment ? 1450 : segment.thornExit ? 1360 : 0;
    const hasTitleTransition = segment.thornExit && initialProgress < sowingStarts;
    const exitDuration = 1150;
    const packetEntryTime = 300;

    function advance(now) {
      const elapsed = reducedMotion.matches ? duration : Math.max(0, now - startedAt - openingTitleTime);
      const time = clamp(elapsed / duration);
      settlingScene = elapsed >= duration;
      if (segment.thornExit) lateSeedTime = Math.max(0, elapsed - duration);
      const range = measureScrollRange();
      let progress = initialProgress + (target - initialProgress) * time;
      if (hasTitleTransition) {
        const packetEntry = 0.08;
        if (elapsed < exitDuration) {
          progress = initialProgress + (sowingStarts - initialProgress) * clamp(elapsed / exitDuration);
        } else {
          const sowTime = elapsed - exitDuration;
          // Give the packet a beat to enter after the thorn exits.
          const sowProgress = sowTime < packetEntryTime
            ? packetEntry * clamp(sowTime / packetEntryTime)
            : packetEntry + (seedBurialKeyframe - packetEntry) * clamp((sowTime - packetEntryTime) / (segment.duration - exitDuration - packetEntryTime));
          progress = sowingStarts + (sproutFinished - sowingStarts) * sowProgress;
        }
      }
      const position = range.start + (time === 1 ? target : progress) * (range.end - range.start);
      scrollInstantly(time === 1 && target === 1 ? Math.floor(position) : time === 1 || (hasTitleTransition && elapsed >= exitDuration && progress === sowingStarts) ? Math.ceil(position) : Math.max(Math.ceil(range.start), Math.floor(position)));
      draw();

      if (elapsed < duration + settleDuration) {
        segmentFrame = requestAnimationFrame(advance);
      } else {
        settlingScene = false;
        completedSegment = segmentIndex;
        if (segmentIndex === segments.length - 1) finalStop = acceptedScrollY;
        playingStep = null;
        const followingSegment = segments[segmentIndex + 1];
        const advanceRequested = touchAdvanceQueued;
        touchAdvanceQueued = false;
        if (followingSegment && (segmentIndex === 2 || (advanceRequested && !reducedMotion.matches))) {
          playSegment(acceptedScrollY, followingSegment, target);
          return;
        }
        segmentRunning = false;
        waitingForGesture = Boolean(followingSegment);
        draw();
      }
    }

    segmentFrame = requestAnimationFrame(advance);
  }

  function limitWheel(event) {
    if (event.defaultPrevented || !event.cancelable || event.ctrlKey ||
        reducedMotion.matches || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    const units = event.deltaMode;
    const delta = event.deltaY * (units === 1 ? 16 : units === 2 ? document.documentElement.clientHeight : 1);
    if (!delta) return;
    const from = acceptedScrollY;
    const to = from + delta;
    const limited = limitTravel(from, to);
    if (limited === null) return;

    event.preventDefault();
    scrollInstantly(limited);
    scheduleDraw();
  }

  let touchY = null;
  let touchX = null;
  let touchFresh = false;
  let touchDirection = 0;
  let touchLeavingOpening = false;

  function touchInput() {
    const input = { touch: true, fresh: touchFresh };
    touchFresh = false;
    return input;
  }

  function onTouchEnd() {
    touchY = null;
    touchFresh = false;
    touchOwnsScroll = false;
  }

  function onTouchStart(event) {
    const touch = event.touches.length === 1 ? event.touches[0] : null;
    touchY = touch?.clientY ?? null;
    touchX = touch?.clientX ?? null;
    touchFresh = Boolean(touch);
    touchDirection = 0;
    touchLeavingOpening = false;
    const { openingVisibleAt, end } = measureScrollRange();
    touchOwnsScroll = Boolean(touch) && !reducedMotion.matches &&
      acceptedScrollY >= Math.floor(openingVisibleAt) && acceptedScrollY < end - 1;
  }

  function onTouchMove(event) {
    if (event.defaultPrevented || event.touches.length !== 1 ||
        touchY === null || reducedMotion.matches) return;

    const touch = event.touches[0];
    const delta = touchY - touch.clientY;
    if (Math.abs(delta) < 6 || Math.abs(touchX - touch.clientX) > Math.abs(delta)) return;
    touchY = touch.clientY;
    touchX = touch.clientX;
    const direction = Math.sign(delta);
    // Finger recoil at the end of a swipe is not a new upward gesture.
    if (touchDirection && direction !== touchDirection) return;
    touchDirection = direction;

    const from = acceptedScrollY;
    const input = touchInput();
    const limited = touchLeavingOpening ? null : limitTravel(from, from + delta, input);
    if (limited === null && !touchOwnsScroll) return;
    if (delta < 0 && limited === null) touchLeavingOpening = true;
    if (event.cancelable) event.preventDefault();
    scrollInstantly(limited ?? from + delta);
    scheduleDraw();
  }

  function onScroll() {
    const actual = window.scrollY;
    if (actual !== acceptedScrollY && (touchOwnsScroll || (segmentRunning && lastInputWasTouch))) {
      // Ignore native momentum or viewport corrections while touch controls this scene.
      scrollInstantly(acceptedScrollY);
      return;
    }
    if (actual !== acceptedScrollY) {
      const limited = limitTravel(acceptedScrollY, actual, touchY !== null ? touchInput() : undefined);
      if (limited !== null && limited !== actual) scrollInstantly(limited);
      else acceptedScrollY = actual;
    }
    scheduleDraw();
  }

  function restartOpeningReveal() {
    sequence.classList.toggle('is-story-visible', false);
    sequence.classList.toggle('is-guide-suspended', false);
    frame.getBoundingClientRect();
    openingInView = true;
    openingReadyAt = performance.now() + 2000;
  }

  function moveElevator(target, onComplete) {
    touchAdvanceQueued = false;
    cancelAnimationFrame(segmentFrame);
    segmentRunning = false;
    waitingForGesture = false;
    completedSegment = -1;
    playingStep = null;
    lateSeedTime = 0;
    const origin = window.scrollY;
    if (reducedMotion.matches) {
      scrollInstantly(target);
      onComplete?.();
      scheduleDraw();
      return;
    }

    elevatorRunning = true;
    const startedAt = performance.now();
    function advanceElevator(now) {
      const progress = clamp((now - startedAt) / 700);
      scrollInstantly(origin + (target - origin) * smooth(progress));
      draw();
      if (progress < 1) {
        segmentFrame = requestAnimationFrame(advanceElevator);
      } else {
        elevatorRunning = false;
        onComplete?.();
      }
    }
    segmentFrame = requestAnimationFrame(advanceElevator);
  }

  frame.querySelector('.ownership-skip')?.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = document.getElementById('work');
    if (!destination) return;

    event.preventDefault();
    returningFromSkip = true;
    sequence.classList.toggle('is-guide-suspended', true);
    animateFinalLeaves = false;
    sequence.classList.toggle("is-skipping", true);
    moveElevator(window.scrollY + destination.getBoundingClientRect().top, () => {
      destination.focus({ preventScroll: true });
    });
  });

  // Handle the sticky logo before its normal scroll handler runs.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!event.target.closest?.('.scroll-logo-link')) return;

    event.preventDefault();
    event.stopPropagation();
    cancelAnimationFrame(segmentFrame);
    segmentRunning = false;
    returningFromSkip = false;
    sequence.classList.toggle('is-skipping', false);
    draw(true);
    returningFromSkip = true;
    sequence.classList.toggle('is-skipping', true);
    moveElevator(0, () => {
      returningFromSkip = false;
      sequence.classList.toggle('is-skipping', false);
      scheduleDraw();
    });
  }, true);

  addEventListener('wheel', limitWheel, { passive: false, capture: true });
  addEventListener('touchstart', onTouchStart, { passive: true });
  addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
  addEventListener('touchend', onTouchEnd, { passive: true });
  addEventListener('touchcancel', onTouchEnd, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', scheduleDraw);
  window.visualViewport?.addEventListener('resize', scheduleDraw);
  reducedMotion.addEventListener('change', scheduleDraw);
  draw();
})();
