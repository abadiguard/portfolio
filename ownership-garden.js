(function () {
  const sequence = document.querySelector('.ownership-sequence');
  if (!sequence) return;
  sequence.classList.add('is-enhanced');
  const frame = sequence.querySelector('.frame');
  const gardenStrip = frame.querySelector('.garden-strip');
  const ground = frame.querySelector('.garden-ground path');
  const landscape = gardenStrip.querySelector('.garden-landscape');
  const thorn = landscape.querySelector('.garden-thorn');
  const uprootMarks = frame.querySelector('.uproot-marks');
  const sowing = frame.querySelector('.sowing');
  const firstCopy = frame.querySelector('.first-copy');
  const secondCopy = frame.querySelector('.second-copy');
  const thirdCopy = frame.querySelector('.third-copy');
  const sprout = sowing.querySelector('.sprout');
  const sproutStroke = sprout.querySelector('.stem');
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
  let acceptedScrollY = window.scrollY;
  let lastInputTime = -Infinity;
  let lastInputWasForward = false;

  function measureScrollRange() {
    const frameHeight = frame.offsetHeight;
    const viewportHeight = document.documentElement.clientHeight;
    const ownershipSection = sequence.closest('.own');
    const nextSectionGap = Number.parseFloat(getComputedStyle(ownershipSection).paddingBottom) || 0;
    const frameTop = viewportHeight - frameHeight - nextSectionGap;
    const distance = sequence.offsetHeight - frameHeight;
    const startDelay = Math.min(160, Math.max(0, distance * 0.14));
    const start = window.scrollY + sequence.getBoundingClientRect().top - frameTop + startDelay;
    return { frameTop, start, openingVisibleAt: start - startDelay, end: start + distance - startDelay };
  }

  function draw(resetToOpening = false) {
    if (returningFromSkip) return;
    const { frameTop, start, end } = measureScrollRange();
    frame.style.setProperty('--frame-top', frameTop + 'px');
    const overall = resetToOpening || acceptedScrollY <= Math.ceil(start) ? 0 : clamp((acceptedScrollY - start) / Math.max(1, end - start));
    const terrainProgress = overall < sowingStarts
      ? Math.min(overall, thornCentered)
      : overall - (sowingStarts - thornCentered) - Math.max(0, Math.min(overall, 0.68) - sproutFinished);
    const terrainTravel = reducedMotion.matches ? 0 : terrainProgress * 420;
    const terrain = Array.from({ length: 21 }, (_, index) => {
      const x = -32 + index * 12;
      const edgeTaper = Math.sin(Math.PI * index / 20);
      const sample = x + terrainTravel;
      const relief = 1.6 * Math.sin(sample / 21) + 0.65 * Math.sin(sample / 9 + 1);
      return { x, y: 149 + edgeTaper * relief };
    });
    let groundPath = 'M-32 149';
    for (let index = 1; index < terrain.length - 1; index++) {
      const point = terrain[index];
      const next = terrain[index + 1];
      groundPath += ` Q${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`;
    }
    ground.setAttribute('d', groundPath + ' Q208 149 208 149');
    const progress = clamp(overall / sowingStarts);
    const flowerStart = Math.ceil(start + sproutFinished * (end - start));
    const flowerProgress = resetToOpening ? 0 : clamp((acceptedScrollY - flowerStart) / Math.max(1, end - flowerStart));
    const activeCopy = flowerProgress > 0 ? 2 : overall >= sowingStarts ? 1 : 0;
    [firstCopy, secondCopy, thirdCopy].forEach((copy, index) => {
      copy.hidden = index !== activeCopy;
      copy.setAttribute('aria-hidden', String(index !== activeCopy));
    });
    sowing.style.opacity = activeCopy !== 0 ? '1' : '0';
    const sowProgress = clamp((overall - sowingStarts) / (sproutFinished - sowingStarts));
    const showFirstTitle = !resetToOpening && (segmentRunning || acceptedScrollY > Math.ceil(start));
    const openingIdle = !segmentRunning && !showFirstTitle;
    sequence.classList.toggle('is-opening-idle', openingIdle);
    sequence.classList.toggle('is-opening-visible', openingIdle && openingInView);
    firstCopy.querySelector("h3").toggleAttribute("data-copy-hidden", !showFirstTitle);
    const showThornCopy = overall >= thornCentered;
    firstCopy.querySelector('div.d').toggleAttribute('data-copy-hidden', !showThornCopy);
    const packetStop = Math.ceil(start + packetFinished * (end - start));
    const showProductDirection = acceptedScrollY > packetStop;
    secondCopy.querySelector('h3').toggleAttribute('data-copy-hidden', showProductDirection);
    secondCopy.querySelector('div.d').toggleAttribute('data-copy-hidden', !showProductDirection);
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
    if (animations.length > 0) {
      for (const animation of animations) {
        animation.currentTime = sowingTime;
      }
    } else {
      sowing.style.setProperty('--seek', String(-sowingTime / 1000) + 's');
    }
    drawFlower(reducedMotion.matches && flowerProgress > 0 ? 1 : flowerProgress);
    const pan = reducedMotion.matches ? 0 : 600 * clamp(progress / thornPanEnd);
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
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([entry]) => {
      openingInView = entry.isIntersecting;
      scheduleDraw();
    }).observe(gardenStrip);
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

  function limitTravel(from, to) {
    if (from === to || reducedMotion.matches) return to;

    const now = performance.now();
    const freshGesture = now - lastInputTime >= 180 || (to > from) !== lastInputWasForward;
    lastInputTime = now;
    lastInputWasForward = to > from;
    if (elevatorRunning) return from;
    const { start, end, openingVisibleAt } = measureScrollRange();
    const openingStop = Math.ceil(start);
    if (to < from) {
      if (to >= end) return null;
      if (!segmentRunning && !returningFromSkip && from <= openingStop) {
        if (from >= Math.floor(start) && waitingForGesture && !freshGesture) return from;
        waitingForGesture = false;
        return null;
      }
      cancelAnimationFrame(segmentFrame);
      segmentRunning = false;
      returningFromSkip = false;
      waitingForGesture = true;
      sequence.classList.toggle('is-skipping', false);
      return Math.floor(start);
    }
    if (segmentRunning) return from;
    const openingIsVisible = from >= Math.floor(openingVisibleAt);
    if (!openingIsVisible) {
      if (to < Math.floor(openingVisibleAt)) return null;
      waitingForGesture = true;
      return openingStop;
    }
    const stopFor = progress => Math.ceil(start + progress * (end - start));
    // Release native scrolling at the last frame, allowing for pixel rounding.
    if (from >= end - 1) return null;
    if (waitingForGesture && !freshGesture) return from;

    const next = segments.find(segment => from < stopFor(segment.end));
    if (next) {
      const segmentStart = Math.max(from, openingStop);
      playSegment(segmentStart, next);
      return segmentStart;
    }
    return null;
  }

  function scrollInstantly(top) {
    window.scrollTo({ top, behavior: 'instant' });
    acceptedScrollY = window.scrollY;
  }

  function playSegment(from, segment) {
    const segmentIndex = segments.indexOf(segment);
    const target = segment.end;
    const isOpeningSegment = segmentIndex === 0;
    const openingTitleTime = isOpeningSegment ? 880 : 0;
    const thornCopyTime = isOpeningSegment && !reducedMotion.matches ? 980 : 0;
    const duration = segment.duration;
    const { start, end } = measureScrollRange();
    const initialProgress = clamp((from - start) / Math.max(1, end - start));
    const startedAt = performance.now();
    segmentRunning = true;
    const hasTitleTransition = segment.thornExit && initialProgress < sowingStarts;
    const exitDuration = 1150;
    const titleFadeEnd = 780;

    function advance(now) {
      const elapsed = reducedMotion.matches ? duration : Math.max(0, now - startedAt - openingTitleTime);
      const time = clamp(elapsed / duration);
      const range = measureScrollRange();
      let progress = initialProgress + (target - initialProgress) * time;
      if (hasTitleTransition) {
        const packetEntry = 0.08;
        if (elapsed < exitDuration) {
          progress = initialProgress + (sowingStarts - initialProgress) * clamp(elapsed / exitDuration);
        } else {
          const sowTime = elapsed - exitDuration;
          // When the title finishes fading in, the packet reaches its entry keyframe.
          const sowProgress = sowTime < titleFadeEnd
            ? packetEntry * clamp(sowTime / titleFadeEnd)
            : packetEntry + (seedBurialKeyframe - packetEntry) * clamp((sowTime - titleFadeEnd) / (segment.duration - exitDuration - titleFadeEnd));
          progress = sowingStarts + (sproutFinished - sowingStarts) * sowProgress;
        }
      }
      const position = range.start + (time === 1 ? target : progress) * (range.end - range.start);
      scrollInstantly(time === 1 || (hasTitleTransition && elapsed >= exitDuration && progress === sowingStarts) ? Math.ceil(position) : Math.max(Math.ceil(range.start), Math.floor(position)));
      draw();

      if (elapsed < duration + thornCopyTime) {
        segmentFrame = requestAnimationFrame(advance);
      } else {
        const followingSegment = segments[segmentIndex + 1];
        const stillScrolling = lastInputWasForward && now - lastInputTime < 180;
        if (stillScrolling && followingSegment && !reducedMotion.matches) {
          playSegment(acceptedScrollY, followingSegment);
          return;
        }
        segmentRunning = false;
        waitingForGesture = Boolean(followingSegment);
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

  function onScroll() {
    const actual = window.scrollY;
    if (actual !== acceptedScrollY) {
      const limited = limitTravel(acceptedScrollY, actual);
      if (limited !== null && limited !== actual) scrollInstantly(limited);
      else acceptedScrollY = actual;
    }
    scheduleDraw();
  }

  function moveElevator(target, onComplete) {
    cancelAnimationFrame(segmentFrame);
    segmentRunning = false;
    waitingForGesture = false;
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
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', scheduleDraw);
  reducedMotion.addEventListener('change', scheduleDraw);
  draw();
})();
