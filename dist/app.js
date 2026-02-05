(() => {
  // node_modules/lenis/dist/lenis.mjs
  var version = "1.3.17";
  function clamp(min, input, max) {
    return Math.max(min, Math.min(input, max));
  }
  function lerp(x, y, t2) {
    return (1 - t2) * x + t2 * y;
  }
  function damp(x, y, lambda, deltaTime) {
    return lerp(x, y, 1 - Math.exp(-lambda * deltaTime));
  }
  function modulo(n2, d2) {
    return (n2 % d2 + d2) % d2;
  }
  var Animate = class {
    isRunning = false;
    value = 0;
    from = 0;
    to = 0;
    currentTime = 0;
    // These are instanciated in the fromTo method
    lerp;
    duration;
    easing;
    onUpdate;
    /**
     * Advance the animation by the given delta time
     *
     * @param deltaTime - The time in seconds to advance the animation
     */
    advance(deltaTime) {
      if (!this.isRunning) return;
      let completed = false;
      if (this.duration && this.easing) {
        this.currentTime += deltaTime;
        const linearProgress = clamp(0, this.currentTime / this.duration, 1);
        completed = linearProgress >= 1;
        const easedProgress = completed ? 1 : this.easing(linearProgress);
        this.value = this.from + (this.to - this.from) * easedProgress;
      } else if (this.lerp) {
        this.value = damp(this.value, this.to, this.lerp * 60, deltaTime);
        if (Math.round(this.value) === this.to) {
          this.value = this.to;
          completed = true;
        }
      } else {
        this.value = this.to;
        completed = true;
      }
      if (completed) {
        this.stop();
      }
      this.onUpdate?.(this.value, completed);
    }
    /** Stop the animation */
    stop() {
      this.isRunning = false;
    }
    /**
     * Set up the animation from a starting value to an ending value
     * with optional parameters for lerping, duration, easing, and onUpdate callback
     *
     * @param from - The starting value
     * @param to - The ending value
     * @param options - Options for the animation
     */
    fromTo(from, to, { lerp: lerp2, duration, easing, onStart, onUpdate }) {
      this.from = this.value = from;
      this.to = to;
      this.lerp = lerp2;
      this.duration = duration;
      this.easing = easing;
      this.currentTime = 0;
      this.isRunning = true;
      onStart?.();
      this.onUpdate = onUpdate;
    }
  };
  function debounce(callback, delay) {
    let timer;
    return function(...args) {
      let context3 = this;
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = void 0;
        callback.apply(context3, args);
      }, delay);
    };
  }
  var Dimensions = class {
    constructor(wrapper, content, { autoResize = true, debounce: debounceValue = 250 } = {}) {
      this.wrapper = wrapper;
      this.content = content;
      if (autoResize) {
        this.debouncedResize = debounce(this.resize, debounceValue);
        if (this.wrapper instanceof Window) {
          window.addEventListener("resize", this.debouncedResize, false);
        } else {
          this.wrapperResizeObserver = new ResizeObserver(this.debouncedResize);
          this.wrapperResizeObserver.observe(this.wrapper);
        }
        this.contentResizeObserver = new ResizeObserver(this.debouncedResize);
        this.contentResizeObserver.observe(this.content);
      }
      this.resize();
    }
    width = 0;
    height = 0;
    scrollHeight = 0;
    scrollWidth = 0;
    // These are instanciated in the constructor as they need information from the options
    debouncedResize;
    wrapperResizeObserver;
    contentResizeObserver;
    destroy() {
      this.wrapperResizeObserver?.disconnect();
      this.contentResizeObserver?.disconnect();
      if (this.wrapper === window && this.debouncedResize) {
        window.removeEventListener("resize", this.debouncedResize, false);
      }
    }
    resize = () => {
      this.onWrapperResize();
      this.onContentResize();
    };
    onWrapperResize = () => {
      if (this.wrapper instanceof Window) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
      } else {
        this.width = this.wrapper.clientWidth;
        this.height = this.wrapper.clientHeight;
      }
    };
    onContentResize = () => {
      if (this.wrapper instanceof Window) {
        this.scrollHeight = this.content.scrollHeight;
        this.scrollWidth = this.content.scrollWidth;
      } else {
        this.scrollHeight = this.wrapper.scrollHeight;
        this.scrollWidth = this.wrapper.scrollWidth;
      }
    };
    get limit() {
      return {
        x: this.scrollWidth - this.width,
        y: this.scrollHeight - this.height
      };
    }
  };
  var Emitter = class {
    events = {};
    /**
     * Emit an event with the given data
     * @param event Event name
     * @param args Data to pass to the event handlers
     */
    emit(event, ...args) {
      let callbacks = this.events[event] || [];
      for (let i2 = 0, length = callbacks.length; i2 < length; i2++) {
        callbacks[i2]?.(...args);
      }
    }
    /**
     * Add a callback to the event
     * @param event Event name
     * @param cb Callback function
     * @returns Unsubscribe function
     */
    on(event, cb) {
      this.events[event]?.push(cb) || (this.events[event] = [cb]);
      return () => {
        this.events[event] = this.events[event]?.filter((i2) => cb !== i2);
      };
    }
    /**
     * Remove a callback from the event
     * @param event Event name
     * @param callback Callback function
     */
    off(event, callback) {
      this.events[event] = this.events[event]?.filter((i2) => callback !== i2);
    }
    /**
     * Remove all event listeners and clean up
     */
    destroy() {
      this.events = {};
    }
  };
  var LINE_HEIGHT = 100 / 6;
  var listenerOptions = { passive: false };
  var VirtualScroll = class {
    constructor(element, options = { wheelMultiplier: 1, touchMultiplier: 1 }) {
      this.element = element;
      this.options = options;
      window.addEventListener("resize", this.onWindowResize, false);
      this.onWindowResize();
      this.element.addEventListener("wheel", this.onWheel, listenerOptions);
      this.element.addEventListener(
        "touchstart",
        this.onTouchStart,
        listenerOptions
      );
      this.element.addEventListener(
        "touchmove",
        this.onTouchMove,
        listenerOptions
      );
      this.element.addEventListener("touchend", this.onTouchEnd, listenerOptions);
    }
    touchStart = {
      x: 0,
      y: 0
    };
    lastDelta = {
      x: 0,
      y: 0
    };
    window = {
      width: 0,
      height: 0
    };
    emitter = new Emitter();
    /**
     * Add an event listener for the given event and callback
     *
     * @param event Event name
     * @param callback Callback function
     */
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    /** Remove all event listeners and clean up */
    destroy() {
      this.emitter.destroy();
      window.removeEventListener("resize", this.onWindowResize, false);
      this.element.removeEventListener("wheel", this.onWheel, listenerOptions);
      this.element.removeEventListener(
        "touchstart",
        this.onTouchStart,
        listenerOptions
      );
      this.element.removeEventListener(
        "touchmove",
        this.onTouchMove,
        listenerOptions
      );
      this.element.removeEventListener(
        "touchend",
        this.onTouchEnd,
        listenerOptions
      );
    }
    /**
     * Event handler for 'touchstart' event
     *
     * @param event Touch event
     */
    onTouchStart = (event) => {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
      this.touchStart.x = clientX;
      this.touchStart.y = clientY;
      this.lastDelta = {
        x: 0,
        y: 0
      };
      this.emitter.emit("scroll", {
        deltaX: 0,
        deltaY: 0,
        event
      });
    };
    /** Event handler for 'touchmove' event */
    onTouchMove = (event) => {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event;
      const deltaX = -(clientX - this.touchStart.x) * this.options.touchMultiplier;
      const deltaY = -(clientY - this.touchStart.y) * this.options.touchMultiplier;
      this.touchStart.x = clientX;
      this.touchStart.y = clientY;
      this.lastDelta = {
        x: deltaX,
        y: deltaY
      };
      this.emitter.emit("scroll", {
        deltaX,
        deltaY,
        event
      });
    };
    onTouchEnd = (event) => {
      this.emitter.emit("scroll", {
        deltaX: this.lastDelta.x,
        deltaY: this.lastDelta.y,
        event
      });
    };
    /** Event handler for 'wheel' event */
    onWheel = (event) => {
      let { deltaX, deltaY, deltaMode } = event;
      const multiplierX = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.width : 1;
      const multiplierY = deltaMode === 1 ? LINE_HEIGHT : deltaMode === 2 ? this.window.height : 1;
      deltaX *= multiplierX;
      deltaY *= multiplierY;
      deltaX *= this.options.wheelMultiplier;
      deltaY *= this.options.wheelMultiplier;
      this.emitter.emit("scroll", { deltaX, deltaY, event });
    };
    onWindowResize = () => {
      this.window = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };
  };
  var defaultEasing = (t2) => Math.min(1, 1.001 - Math.pow(2, -10 * t2));
  var Lenis = class {
    _isScrolling = false;
    // true when scroll is animating
    _isStopped = false;
    // true if user should not be able to scroll - enable/disable programmatically
    _isLocked = false;
    // same as isStopped but enabled/disabled when scroll reaches target
    _preventNextNativeScrollEvent = false;
    _resetVelocityTimeout = null;
    _rafId = null;
    /**
     * Whether or not the user is touching the screen
     */
    isTouching;
    /**
     * The time in ms since the lenis instance was created
     */
    time = 0;
    /**
     * User data that will be forwarded through the scroll event
     *
     * @example
     * lenis.scrollTo(100, {
     *   userData: {
     *     foo: 'bar'
     *   }
     * })
     */
    userData = {};
    /**
     * The last velocity of the scroll
     */
    lastVelocity = 0;
    /**
     * The current velocity of the scroll
     */
    velocity = 0;
    /**
     * The direction of the scroll
     */
    direction = 0;
    /**
     * The options passed to the lenis instance
     */
    options;
    /**
     * The target scroll value
     */
    targetScroll;
    /**
     * The animated scroll value
     */
    animatedScroll;
    // These are instanciated here as they don't need information from the options
    animate = new Animate();
    emitter = new Emitter();
    // These are instanciated in the constructor as they need information from the options
    dimensions;
    // This is not private because it's used in the Snap class
    virtualScroll;
    constructor({
      wrapper = window,
      content = document.documentElement,
      eventsTarget = wrapper,
      smoothWheel = true,
      syncTouch = false,
      syncTouchLerp = 0.075,
      touchInertiaExponent = 1.7,
      duration,
      // in seconds
      easing,
      lerp: lerp2 = 0.1,
      infinite = false,
      orientation = "vertical",
      // vertical, horizontal
      gestureOrientation = orientation === "horizontal" ? "both" : "vertical",
      // vertical, horizontal, both
      touchMultiplier = 1,
      wheelMultiplier = 1,
      autoResize = true,
      prevent,
      virtualScroll,
      overscroll = true,
      autoRaf = false,
      anchors = false,
      autoToggle = false,
      // https://caniuse.com/?search=transition-behavior
      allowNestedScroll = false,
      // @ts-ignore: this will be deprecated in the future
      __experimental__naiveDimensions = false,
      naiveDimensions = __experimental__naiveDimensions,
      stopInertiaOnNavigate = false
    } = {}) {
      window.lenisVersion = version;
      if (!wrapper || wrapper === document.documentElement) {
        wrapper = window;
      }
      if (typeof duration === "number" && typeof easing !== "function") {
        easing = defaultEasing;
      } else if (typeof easing === "function" && typeof duration !== "number") {
        duration = 1;
      }
      this.options = {
        wrapper,
        content,
        eventsTarget,
        smoothWheel,
        syncTouch,
        syncTouchLerp,
        touchInertiaExponent,
        duration,
        easing,
        lerp: lerp2,
        infinite,
        gestureOrientation,
        orientation,
        touchMultiplier,
        wheelMultiplier,
        autoResize,
        prevent,
        virtualScroll,
        overscroll,
        autoRaf,
        anchors,
        autoToggle,
        allowNestedScroll,
        naiveDimensions,
        stopInertiaOnNavigate
      };
      this.dimensions = new Dimensions(wrapper, content, { autoResize });
      this.updateClassName();
      this.targetScroll = this.animatedScroll = this.actualScroll;
      this.options.wrapper.addEventListener("scroll", this.onNativeScroll, false);
      this.options.wrapper.addEventListener("scrollend", this.onScrollEnd, {
        capture: true
      });
      if (this.options.anchors || this.options.stopInertiaOnNavigate) {
        this.options.wrapper.addEventListener(
          "click",
          this.onClick,
          false
        );
      }
      this.options.wrapper.addEventListener(
        "pointerdown",
        this.onPointerDown,
        false
      );
      this.virtualScroll = new VirtualScroll(eventsTarget, {
        touchMultiplier,
        wheelMultiplier
      });
      this.virtualScroll.on("scroll", this.onVirtualScroll);
      if (this.options.autoToggle) {
        this.checkOverflow();
        this.rootElement.addEventListener("transitionend", this.onTransitionEnd, {
          passive: true
        });
      }
      if (this.options.autoRaf) {
        this._rafId = requestAnimationFrame(this.raf);
      }
    }
    /**
     * Destroy the lenis instance, remove all event listeners and clean up the class name
     */
    destroy() {
      this.emitter.destroy();
      this.options.wrapper.removeEventListener(
        "scroll",
        this.onNativeScroll,
        false
      );
      this.options.wrapper.removeEventListener("scrollend", this.onScrollEnd, {
        capture: true
      });
      this.options.wrapper.removeEventListener(
        "pointerdown",
        this.onPointerDown,
        false
      );
      if (this.options.anchors || this.options.stopInertiaOnNavigate) {
        this.options.wrapper.removeEventListener(
          "click",
          this.onClick,
          false
        );
      }
      this.virtualScroll.destroy();
      this.dimensions.destroy();
      this.cleanUpClassName();
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
      }
    }
    on(event, callback) {
      return this.emitter.on(event, callback);
    }
    off(event, callback) {
      return this.emitter.off(event, callback);
    }
    onScrollEnd = (e2) => {
      if (!(e2 instanceof CustomEvent)) {
        if (this.isScrolling === "smooth" || this.isScrolling === false) {
          e2.stopPropagation();
        }
      }
    };
    dispatchScrollendEvent = () => {
      this.options.wrapper.dispatchEvent(
        new CustomEvent("scrollend", {
          bubbles: this.options.wrapper === window,
          // cancelable: false,
          detail: {
            lenisScrollEnd: true
          }
        })
      );
    };
    get overflow() {
      const property = this.isHorizontal ? "overflow-x" : "overflow-y";
      return getComputedStyle(this.rootElement)[property];
    }
    checkOverflow() {
      if (["hidden", "clip"].includes(this.overflow)) {
        this.internalStop();
      } else {
        this.internalStart();
      }
    }
    onTransitionEnd = (event) => {
      if (event.propertyName.includes("overflow")) {
        this.checkOverflow();
      }
    };
    setScroll(scroll) {
      if (this.isHorizontal) {
        this.options.wrapper.scrollTo({ left: scroll, behavior: "instant" });
      } else {
        this.options.wrapper.scrollTo({ top: scroll, behavior: "instant" });
      }
    }
    onClick = (event) => {
      const path = event.composedPath();
      const anchorElements = path.filter(
        (node) => node instanceof HTMLAnchorElement && node.getAttribute("href")
      );
      if (this.options.anchors) {
        const anchor = anchorElements.find(
          (node) => node.getAttribute("href")?.includes("#")
        );
        if (anchor) {
          const href = anchor.getAttribute("href");
          if (href) {
            const options = typeof this.options.anchors === "object" && this.options.anchors ? this.options.anchors : void 0;
            const target = `#${href.split("#")[1]}`;
            this.scrollTo(target, options);
          }
        }
      }
      if (this.options.stopInertiaOnNavigate) {
        const internalLink = anchorElements.find(
          (node) => node.host === window.location.host
        );
        if (internalLink) {
          this.reset();
        }
      }
    };
    onPointerDown = (event) => {
      if (event.button === 1) {
        this.reset();
      }
    };
    onVirtualScroll = (data) => {
      if (typeof this.options.virtualScroll === "function" && this.options.virtualScroll(data) === false)
        return;
      const { deltaX, deltaY, event } = data;
      this.emitter.emit("virtual-scroll", { deltaX, deltaY, event });
      if (event.ctrlKey) return;
      if (event.lenisStopPropagation) return;
      const isTouch = event.type.includes("touch");
      const isWheel = event.type.includes("wheel");
      this.isTouching = event.type === "touchstart" || event.type === "touchmove";
      const isClickOrTap = deltaX === 0 && deltaY === 0;
      const isTapToStop = this.options.syncTouch && isTouch && event.type === "touchstart" && isClickOrTap && !this.isStopped && !this.isLocked;
      if (isTapToStop) {
        this.reset();
        return;
      }
      const isUnknownGesture = this.options.gestureOrientation === "vertical" && deltaY === 0 || this.options.gestureOrientation === "horizontal" && deltaX === 0;
      if (isClickOrTap || isUnknownGesture) {
        return;
      }
      let composedPath = event.composedPath();
      composedPath = composedPath.slice(0, composedPath.indexOf(this.rootElement));
      const prevent = this.options.prevent;
      if (!!composedPath.find(
        (node) => node instanceof HTMLElement && (typeof prevent === "function" && prevent?.(node) || node.hasAttribute?.("data-lenis-prevent") || isTouch && node.hasAttribute?.("data-lenis-prevent-touch") || isWheel && node.hasAttribute?.("data-lenis-prevent-wheel") || this.options.allowNestedScroll && this.checkNestedScroll(node, { deltaX, deltaY }))
      ))
        return;
      if (this.isStopped || this.isLocked) {
        if (event.cancelable) {
          event.preventDefault();
        }
        return;
      }
      const isSmooth = this.options.syncTouch && isTouch || this.options.smoothWheel && isWheel;
      if (!isSmooth) {
        this.isScrolling = "native";
        this.animate.stop();
        event.lenisStopPropagation = true;
        return;
      }
      let delta = deltaY;
      if (this.options.gestureOrientation === "both") {
        delta = Math.abs(deltaY) > Math.abs(deltaX) ? deltaY : deltaX;
      } else if (this.options.gestureOrientation === "horizontal") {
        delta = deltaX;
      }
      if (!this.options.overscroll || this.options.infinite || this.options.wrapper !== window && this.limit > 0 && (this.animatedScroll > 0 && this.animatedScroll < this.limit || this.animatedScroll === 0 && deltaY > 0 || this.animatedScroll === this.limit && deltaY < 0)) {
        event.lenisStopPropagation = true;
      }
      if (event.cancelable) {
        event.preventDefault();
      }
      const isSyncTouch = isTouch && this.options.syncTouch;
      const isTouchEnd = isTouch && event.type === "touchend";
      const hasTouchInertia = isTouchEnd;
      if (hasTouchInertia) {
        delta = Math.sign(this.velocity) * Math.pow(Math.abs(this.velocity), this.options.touchInertiaExponent);
      }
      this.scrollTo(this.targetScroll + delta, {
        programmatic: false,
        ...isSyncTouch ? {
          lerp: hasTouchInertia ? this.options.syncTouchLerp : 1
        } : {
          lerp: this.options.lerp,
          duration: this.options.duration,
          easing: this.options.easing
        }
      });
    };
    /**
     * Force lenis to recalculate the dimensions
     */
    resize() {
      this.dimensions.resize();
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.emit();
    }
    emit() {
      this.emitter.emit("scroll", this);
    }
    onNativeScroll = () => {
      if (this._resetVelocityTimeout !== null) {
        clearTimeout(this._resetVelocityTimeout);
        this._resetVelocityTimeout = null;
      }
      if (this._preventNextNativeScrollEvent) {
        this._preventNextNativeScrollEvent = false;
        return;
      }
      if (this.isScrolling === false || this.isScrolling === "native") {
        const lastScroll = this.animatedScroll;
        this.animatedScroll = this.targetScroll = this.actualScroll;
        this.lastVelocity = this.velocity;
        this.velocity = this.animatedScroll - lastScroll;
        this.direction = Math.sign(
          this.animatedScroll - lastScroll
        );
        if (!this.isStopped) {
          this.isScrolling = "native";
        }
        this.emit();
        if (this.velocity !== 0) {
          this._resetVelocityTimeout = setTimeout(() => {
            this.lastVelocity = this.velocity;
            this.velocity = 0;
            this.isScrolling = false;
            this.emit();
          }, 400);
        }
      }
    };
    reset() {
      this.isLocked = false;
      this.isScrolling = false;
      this.animatedScroll = this.targetScroll = this.actualScroll;
      this.lastVelocity = this.velocity = 0;
      this.animate.stop();
    }
    /**
     * Start lenis scroll after it has been stopped
     */
    start() {
      if (!this.isStopped) return;
      if (this.options.autoToggle) {
        this.rootElement.style.removeProperty("overflow");
        return;
      }
      this.internalStart();
    }
    internalStart() {
      if (!this.isStopped) return;
      this.reset();
      this.isStopped = false;
      this.emit();
    }
    /**
     * Stop lenis scroll
     */
    stop() {
      if (this.isStopped) return;
      if (this.options.autoToggle) {
        this.rootElement.style.setProperty("overflow", "clip");
        return;
      }
      this.internalStop();
    }
    internalStop() {
      if (this.isStopped) return;
      this.reset();
      this.isStopped = true;
      this.emit();
    }
    /**
     * RequestAnimationFrame for lenis
     *
     * @param time The time in ms from an external clock like `requestAnimationFrame` or Tempus
     */
    raf = (time) => {
      const deltaTime = time - (this.time || time);
      this.time = time;
      this.animate.advance(deltaTime * 1e-3);
      if (this.options.autoRaf) {
        this._rafId = requestAnimationFrame(this.raf);
      }
    };
    /**
     * Scroll to a target value
     *
     * @param target The target value to scroll to
     * @param options The options for the scroll
     *
     * @example
     * lenis.scrollTo(100, {
     *   offset: 100,
     *   duration: 1,
     *   easing: (t) => 1 - Math.cos((t * Math.PI) / 2),
     *   lerp: 0.1,
     *   onStart: () => {
     *     console.log('onStart')
     *   },
     *   onComplete: () => {
     *     console.log('onComplete')
     *   },
     * })
     */
    scrollTo(target, {
      offset = 0,
      immediate = false,
      lock = false,
      programmatic = true,
      // called from outside of the class
      lerp: lerp2 = programmatic ? this.options.lerp : void 0,
      duration = programmatic ? this.options.duration : void 0,
      easing = programmatic ? this.options.easing : void 0,
      onStart,
      onComplete,
      force = false,
      // scroll even if stopped
      userData
    } = {}) {
      if ((this.isStopped || this.isLocked) && !force) return;
      if (typeof target === "string" && ["top", "left", "start", "#"].includes(target)) {
        target = 0;
      } else if (typeof target === "string" && ["bottom", "right", "end"].includes(target)) {
        target = this.limit;
      } else {
        let node;
        if (typeof target === "string") {
          node = document.querySelector(target);
          if (!node) {
            if (target === "#top") {
              target = 0;
            } else {
              console.warn("Lenis: Target not found", target);
            }
          }
        } else if (target instanceof HTMLElement && target?.nodeType) {
          node = target;
        }
        if (node) {
          if (this.options.wrapper !== window) {
            const wrapperRect = this.rootElement.getBoundingClientRect();
            offset -= this.isHorizontal ? wrapperRect.left : wrapperRect.top;
          }
          const rect = node.getBoundingClientRect();
          target = (this.isHorizontal ? rect.left : rect.top) + this.animatedScroll;
        }
      }
      if (typeof target !== "number") return;
      target += offset;
      target = Math.round(target);
      if (this.options.infinite) {
        if (programmatic) {
          this.targetScroll = this.animatedScroll = this.scroll;
          const distance = target - this.animatedScroll;
          if (distance > this.limit / 2) {
            target = target - this.limit;
          } else if (distance < -this.limit / 2) {
            target = target + this.limit;
          }
        }
      } else {
        target = clamp(0, target, this.limit);
      }
      if (target === this.targetScroll) {
        onStart?.(this);
        onComplete?.(this);
        return;
      }
      this.userData = userData ?? {};
      if (immediate) {
        this.animatedScroll = this.targetScroll = target;
        this.setScroll(this.scroll);
        this.reset();
        this.preventNextNativeScrollEvent();
        this.emit();
        onComplete?.(this);
        this.userData = {};
        requestAnimationFrame(() => {
          this.dispatchScrollendEvent();
        });
        return;
      }
      if (!programmatic) {
        this.targetScroll = target;
      }
      if (typeof duration === "number" && typeof easing !== "function") {
        easing = defaultEasing;
      } else if (typeof easing === "function" && typeof duration !== "number") {
        duration = 1;
      }
      this.animate.fromTo(this.animatedScroll, target, {
        duration,
        easing,
        lerp: lerp2,
        onStart: () => {
          if (lock) this.isLocked = true;
          this.isScrolling = "smooth";
          onStart?.(this);
        },
        onUpdate: (value, completed) => {
          this.isScrolling = "smooth";
          this.lastVelocity = this.velocity;
          this.velocity = value - this.animatedScroll;
          this.direction = Math.sign(this.velocity);
          this.animatedScroll = value;
          this.setScroll(this.scroll);
          if (programmatic) {
            this.targetScroll = value;
          }
          if (!completed) this.emit();
          if (completed) {
            this.reset();
            this.emit();
            onComplete?.(this);
            this.userData = {};
            requestAnimationFrame(() => {
              this.dispatchScrollendEvent();
            });
            this.preventNextNativeScrollEvent();
          }
        }
      });
    }
    preventNextNativeScrollEvent() {
      this._preventNextNativeScrollEvent = true;
      requestAnimationFrame(() => {
        this._preventNextNativeScrollEvent = false;
      });
    }
    checkNestedScroll(node, { deltaX, deltaY }) {
      const time = Date.now();
      const cache = node._lenis ??= {};
      let hasOverflowX, hasOverflowY, isScrollableX, isScrollableY, scrollWidth, scrollHeight, clientWidth, clientHeight;
      const gestureOrientation = this.options.gestureOrientation;
      if (time - (cache.time ?? 0) > 2e3) {
        cache.time = Date.now();
        const computedStyle = window.getComputedStyle(node);
        cache.computedStyle = computedStyle;
        const overflowXString = computedStyle.overflowX;
        const overflowYString = computedStyle.overflowY;
        hasOverflowX = ["auto", "overlay", "scroll"].includes(overflowXString);
        hasOverflowY = ["auto", "overlay", "scroll"].includes(overflowYString);
        cache.hasOverflowX = hasOverflowX;
        cache.hasOverflowY = hasOverflowY;
        if (!hasOverflowX && !hasOverflowY) return false;
        if (gestureOrientation === "vertical" && !hasOverflowY) return false;
        if (gestureOrientation === "horizontal" && !hasOverflowX) return false;
        scrollWidth = node.scrollWidth;
        scrollHeight = node.scrollHeight;
        clientWidth = node.clientWidth;
        clientHeight = node.clientHeight;
        isScrollableX = scrollWidth > clientWidth;
        isScrollableY = scrollHeight > clientHeight;
        cache.isScrollableX = isScrollableX;
        cache.isScrollableY = isScrollableY;
        cache.scrollWidth = scrollWidth;
        cache.scrollHeight = scrollHeight;
        cache.clientWidth = clientWidth;
        cache.clientHeight = clientHeight;
      } else {
        isScrollableX = cache.isScrollableX;
        isScrollableY = cache.isScrollableY;
        hasOverflowX = cache.hasOverflowX;
        hasOverflowY = cache.hasOverflowY;
        scrollWidth = cache.scrollWidth;
        scrollHeight = cache.scrollHeight;
        clientWidth = cache.clientWidth;
        clientHeight = cache.clientHeight;
      }
      if (!hasOverflowX && !hasOverflowY || !isScrollableX && !isScrollableY) {
        return false;
      }
      if (gestureOrientation === "vertical" && (!hasOverflowY || !isScrollableY))
        return false;
      if (gestureOrientation === "horizontal" && (!hasOverflowX || !isScrollableX))
        return false;
      let orientation;
      if (gestureOrientation === "horizontal") {
        orientation = "x";
      } else if (gestureOrientation === "vertical") {
        orientation = "y";
      } else {
        const isScrollingX = deltaX !== 0;
        const isScrollingY = deltaY !== 0;
        if (isScrollingX && hasOverflowX && isScrollableX) {
          orientation = "x";
        }
        if (isScrollingY && hasOverflowY && isScrollableY) {
          orientation = "y";
        }
      }
      if (!orientation) return false;
      let scroll, maxScroll, delta, hasOverflow, isScrollable;
      if (orientation === "x") {
        scroll = node.scrollLeft;
        maxScroll = scrollWidth - clientWidth;
        delta = deltaX;
        hasOverflow = hasOverflowX;
        isScrollable = isScrollableX;
      } else if (orientation === "y") {
        scroll = node.scrollTop;
        maxScroll = scrollHeight - clientHeight;
        delta = deltaY;
        hasOverflow = hasOverflowY;
        isScrollable = isScrollableY;
      } else {
        return false;
      }
      const willScroll = delta > 0 ? scroll < maxScroll : scroll > 0;
      return willScroll && hasOverflow && isScrollable;
    }
    /**
     * The root element on which lenis is instanced
     */
    get rootElement() {
      return this.options.wrapper === window ? document.documentElement : this.options.wrapper;
    }
    /**
     * The limit which is the maximum scroll value
     */
    get limit() {
      if (this.options.naiveDimensions) {
        if (this.isHorizontal) {
          return this.rootElement.scrollWidth - this.rootElement.clientWidth;
        } else {
          return this.rootElement.scrollHeight - this.rootElement.clientHeight;
        }
      } else {
        return this.dimensions.limit[this.isHorizontal ? "x" : "y"];
      }
    }
    /**
     * Whether or not the scroll is horizontal
     */
    get isHorizontal() {
      return this.options.orientation === "horizontal";
    }
    /**
     * The actual scroll value
     */
    get actualScroll() {
      const wrapper = this.options.wrapper;
      return this.isHorizontal ? wrapper.scrollX ?? wrapper.scrollLeft : wrapper.scrollY ?? wrapper.scrollTop;
    }
    /**
     * The current scroll value
     */
    get scroll() {
      return this.options.infinite ? modulo(this.animatedScroll, this.limit) : this.animatedScroll;
    }
    /**
     * The progress of the scroll relative to the limit
     */
    get progress() {
      return this.limit === 0 ? 1 : this.scroll / this.limit;
    }
    /**
     * Current scroll state
     */
    get isScrolling() {
      return this._isScrolling;
    }
    set isScrolling(value) {
      if (this._isScrolling !== value) {
        this._isScrolling = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is stopped
     */
    get isStopped() {
      return this._isStopped;
    }
    set isStopped(value) {
      if (this._isStopped !== value) {
        this._isStopped = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is locked
     */
    get isLocked() {
      return this._isLocked;
    }
    set isLocked(value) {
      if (this._isLocked !== value) {
        this._isLocked = value;
        this.updateClassName();
      }
    }
    /**
     * Check if lenis is smooth scrolling
     */
    get isSmooth() {
      return this.isScrolling === "smooth";
    }
    /**
     * The class name applied to the wrapper element
     */
    get className() {
      let className = "lenis";
      if (this.options.autoToggle) className += " lenis-autoToggle";
      if (this.isStopped) className += " lenis-stopped";
      if (this.isLocked) className += " lenis-locked";
      if (this.isScrolling) className += " lenis-scrolling";
      if (this.isScrolling === "smooth") className += " lenis-smooth";
      return className;
    }
    updateClassName() {
      this.cleanUpClassName();
      this.rootElement.className = `${this.rootElement.className} ${this.className}`.trim();
    }
    cleanUpClassName() {
      this.rootElement.className = this.rootElement.className.replace(/lenis(-\w+)?/g, "").trim();
    }
  };

  // node_modules/gsap/gsap-core.js
  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
  var _config = {
    autoSleep: 120,
    force3D: "auto",
    nullTargetWarn: 1,
    units: {
      lineHeight: ""
    }
  };
  var _defaults = {
    duration: 0.5,
    overwrite: false,
    delay: 0
  };
  var _suppressOverwrites;
  var _reverting;
  var _context;
  var _bigNum = 1e8;
  var _tinyNum = 1 / _bigNum;
  var _2PI = Math.PI * 2;
  var _HALF_PI = _2PI / 4;
  var _gsID = 0;
  var _sqrt = Math.sqrt;
  var _cos = Math.cos;
  var _sin = Math.sin;
  var _isString = function _isString2(value) {
    return typeof value === "string";
  };
  var _isFunction = function _isFunction2(value) {
    return typeof value === "function";
  };
  var _isNumber = function _isNumber2(value) {
    return typeof value === "number";
  };
  var _isUndefined = function _isUndefined2(value) {
    return typeof value === "undefined";
  };
  var _isObject = function _isObject2(value) {
    return typeof value === "object";
  };
  var _isNotFalse = function _isNotFalse2(value) {
    return value !== false;
  };
  var _windowExists = function _windowExists2() {
    return typeof window !== "undefined";
  };
  var _isFuncOrString = function _isFuncOrString2(value) {
    return _isFunction(value) || _isString(value);
  };
  var _isTypedArray = typeof ArrayBuffer === "function" && ArrayBuffer.isView || function() {
  };
  var _isArray = Array.isArray;
  var _strictNumExp = /(?:-?\.?\d|\.)+/gi;
  var _numExp = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g;
  var _numWithUnitExp = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g;
  var _complexStringNumExp = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi;
  var _relExp = /[+-]=-?[.\d]+/;
  var _delimitedValueExp = /[^,'"\[\]\s]+/gi;
  var _unitExp = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i;
  var _globalTimeline;
  var _win;
  var _coreInitted;
  var _doc;
  var _globals = {};
  var _installScope = {};
  var _coreReady;
  var _install = function _install2(scope) {
    return (_installScope = _merge(scope, _globals)) && gsap;
  };
  var _missingPlugin = function _missingPlugin2(property, value) {
    return console.warn("Invalid property", property, "set to", value, "Missing plugin? gsap.registerPlugin()");
  };
  var _warn = function _warn2(message, suppress) {
    return !suppress && console.warn(message);
  };
  var _addGlobal = function _addGlobal2(name, obj) {
    return name && (_globals[name] = obj) && _installScope && (_installScope[name] = obj) || _globals;
  };
  var _emptyFunc = function _emptyFunc2() {
    return 0;
  };
  var _startAtRevertConfig = {
    suppressEvents: true,
    isStart: true,
    kill: false
  };
  var _revertConfigNoKill = {
    suppressEvents: true,
    kill: false
  };
  var _revertConfig = {
    suppressEvents: true
  };
  var _reservedProps = {};
  var _lazyTweens = [];
  var _lazyLookup = {};
  var _lastRenderedFrame;
  var _plugins = {};
  var _effects = {};
  var _nextGCFrame = 30;
  var _harnessPlugins = [];
  var _callbackNames = "";
  var _harness = function _harness2(targets) {
    var target = targets[0], harnessPlugin, i2;
    _isObject(target) || _isFunction(target) || (targets = [targets]);
    if (!(harnessPlugin = (target._gsap || {}).harness)) {
      i2 = _harnessPlugins.length;
      while (i2-- && !_harnessPlugins[i2].targetTest(target)) {
      }
      harnessPlugin = _harnessPlugins[i2];
    }
    i2 = targets.length;
    while (i2--) {
      targets[i2] && (targets[i2]._gsap || (targets[i2]._gsap = new GSCache(targets[i2], harnessPlugin))) || targets.splice(i2, 1);
    }
    return targets;
  };
  var _getCache = function _getCache2(target) {
    return target._gsap || _harness(toArray(target))[0]._gsap;
  };
  var _getProperty = function _getProperty2(target, property, v) {
    return (v = target[property]) && _isFunction(v) ? target[property]() : _isUndefined(v) && target.getAttribute && target.getAttribute(property) || v;
  };
  var _forEachName = function _forEachName2(names, func) {
    return (names = names.split(",")).forEach(func) || names;
  };
  var _round = function _round2(value) {
    return Math.round(value * 1e5) / 1e5 || 0;
  };
  var _roundPrecise = function _roundPrecise2(value) {
    return Math.round(value * 1e7) / 1e7 || 0;
  };
  var _parseRelative = function _parseRelative2(start, value) {
    var operator = value.charAt(0), end = parseFloat(value.substr(2));
    start = parseFloat(start);
    return operator === "+" ? start + end : operator === "-" ? start - end : operator === "*" ? start * end : start / end;
  };
  var _arrayContainsAny = function _arrayContainsAny2(toSearch, toFind) {
    var l2 = toFind.length, i2 = 0;
    for (; toSearch.indexOf(toFind[i2]) < 0 && ++i2 < l2; ) {
    }
    return i2 < l2;
  };
  var _lazyRender = function _lazyRender2() {
    var l2 = _lazyTweens.length, a2 = _lazyTweens.slice(0), i2, tween;
    _lazyLookup = {};
    _lazyTweens.length = 0;
    for (i2 = 0; i2 < l2; i2++) {
      tween = a2[i2];
      tween && tween._lazy && (tween.render(tween._lazy[0], tween._lazy[1], true)._lazy = 0);
    }
  };
  var _isRevertWorthy = function _isRevertWorthy2(animation) {
    return !!(animation._initted || animation._startAt || animation.add);
  };
  var _lazySafeRender = function _lazySafeRender2(animation, time, suppressEvents, force) {
    _lazyTweens.length && !_reverting && _lazyRender();
    animation.render(time, suppressEvents, force || !!(_reverting && time < 0 && _isRevertWorthy(animation)));
    _lazyTweens.length && !_reverting && _lazyRender();
  };
  var _numericIfPossible = function _numericIfPossible2(value) {
    var n2 = parseFloat(value);
    return (n2 || n2 === 0) && (value + "").match(_delimitedValueExp).length < 2 ? n2 : _isString(value) ? value.trim() : value;
  };
  var _passThrough = function _passThrough2(p2) {
    return p2;
  };
  var _setDefaults = function _setDefaults2(obj, defaults2) {
    for (var p2 in defaults2) {
      p2 in obj || (obj[p2] = defaults2[p2]);
    }
    return obj;
  };
  var _setKeyframeDefaults = function _setKeyframeDefaults2(excludeDuration) {
    return function(obj, defaults2) {
      for (var p2 in defaults2) {
        p2 in obj || p2 === "duration" && excludeDuration || p2 === "ease" || (obj[p2] = defaults2[p2]);
      }
    };
  };
  var _merge = function _merge2(base, toMerge) {
    for (var p2 in toMerge) {
      base[p2] = toMerge[p2];
    }
    return base;
  };
  var _mergeDeep = function _mergeDeep2(base, toMerge) {
    for (var p2 in toMerge) {
      p2 !== "__proto__" && p2 !== "constructor" && p2 !== "prototype" && (base[p2] = _isObject(toMerge[p2]) ? _mergeDeep2(base[p2] || (base[p2] = {}), toMerge[p2]) : toMerge[p2]);
    }
    return base;
  };
  var _copyExcluding = function _copyExcluding2(obj, excluding) {
    var copy = {}, p2;
    for (p2 in obj) {
      p2 in excluding || (copy[p2] = obj[p2]);
    }
    return copy;
  };
  var _inheritDefaults = function _inheritDefaults2(vars) {
    var parent = vars.parent || _globalTimeline, func = vars.keyframes ? _setKeyframeDefaults(_isArray(vars.keyframes)) : _setDefaults;
    if (_isNotFalse(vars.inherit)) {
      while (parent) {
        func(vars, parent.vars.defaults);
        parent = parent.parent || parent._dp;
      }
    }
    return vars;
  };
  var _arraysMatch = function _arraysMatch2(a1, a2) {
    var i2 = a1.length, match = i2 === a2.length;
    while (match && i2-- && a1[i2] === a2[i2]) {
    }
    return i2 < 0;
  };
  var _addLinkedListItem = function _addLinkedListItem2(parent, child, firstProp, lastProp, sortBy) {
    if (firstProp === void 0) {
      firstProp = "_first";
    }
    if (lastProp === void 0) {
      lastProp = "_last";
    }
    var prev = parent[lastProp], t2;
    if (sortBy) {
      t2 = child[sortBy];
      while (prev && prev[sortBy] > t2) {
        prev = prev._prev;
      }
    }
    if (prev) {
      child._next = prev._next;
      prev._next = child;
    } else {
      child._next = parent[firstProp];
      parent[firstProp] = child;
    }
    if (child._next) {
      child._next._prev = child;
    } else {
      parent[lastProp] = child;
    }
    child._prev = prev;
    child.parent = child._dp = parent;
    return child;
  };
  var _removeLinkedListItem = function _removeLinkedListItem2(parent, child, firstProp, lastProp) {
    if (firstProp === void 0) {
      firstProp = "_first";
    }
    if (lastProp === void 0) {
      lastProp = "_last";
    }
    var prev = child._prev, next = child._next;
    if (prev) {
      prev._next = next;
    } else if (parent[firstProp] === child) {
      parent[firstProp] = next;
    }
    if (next) {
      next._prev = prev;
    } else if (parent[lastProp] === child) {
      parent[lastProp] = prev;
    }
    child._next = child._prev = child.parent = null;
  };
  var _removeFromParent = function _removeFromParent2(child, onlyIfParentHasAutoRemove) {
    child.parent && (!onlyIfParentHasAutoRemove || child.parent.autoRemoveChildren) && child.parent.remove && child.parent.remove(child);
    child._act = 0;
  };
  var _uncache = function _uncache2(animation, child) {
    if (animation && (!child || child._end > animation._dur || child._start < 0)) {
      var a2 = animation;
      while (a2) {
        a2._dirty = 1;
        a2 = a2.parent;
      }
    }
    return animation;
  };
  var _recacheAncestors = function _recacheAncestors2(animation) {
    var parent = animation.parent;
    while (parent && parent.parent) {
      parent._dirty = 1;
      parent.totalDuration();
      parent = parent.parent;
    }
    return animation;
  };
  var _rewindStartAt = function _rewindStartAt2(tween, totalTime, suppressEvents, force) {
    return tween._startAt && (_reverting ? tween._startAt.revert(_revertConfigNoKill) : tween.vars.immediateRender && !tween.vars.autoRevert || tween._startAt.render(totalTime, true, force));
  };
  var _hasNoPausedAncestors = function _hasNoPausedAncestors2(animation) {
    return !animation || animation._ts && _hasNoPausedAncestors2(animation.parent);
  };
  var _elapsedCycleDuration = function _elapsedCycleDuration2(animation) {
    return animation._repeat ? _animationCycle(animation._tTime, animation = animation.duration() + animation._rDelay) * animation : 0;
  };
  var _animationCycle = function _animationCycle2(tTime, cycleDuration) {
    var whole = Math.floor(tTime = _roundPrecise(tTime / cycleDuration));
    return tTime && whole === tTime ? whole - 1 : whole;
  };
  var _parentToChildTotalTime = function _parentToChildTotalTime2(parentTime, child) {
    return (parentTime - child._start) * child._ts + (child._ts >= 0 ? 0 : child._dirty ? child.totalDuration() : child._tDur);
  };
  var _setEnd = function _setEnd2(animation) {
    return animation._end = _roundPrecise(animation._start + (animation._tDur / Math.abs(animation._ts || animation._rts || _tinyNum) || 0));
  };
  var _alignPlayhead = function _alignPlayhead2(animation, totalTime) {
    var parent = animation._dp;
    if (parent && parent.smoothChildTiming && animation._ts) {
      animation._start = _roundPrecise(parent._time - (animation._ts > 0 ? totalTime / animation._ts : ((animation._dirty ? animation.totalDuration() : animation._tDur) - totalTime) / -animation._ts));
      _setEnd(animation);
      parent._dirty || _uncache(parent, animation);
    }
    return animation;
  };
  var _postAddChecks = function _postAddChecks2(timeline2, child) {
    var t2;
    if (child._time || !child._dur && child._initted || child._start < timeline2._time && (child._dur || !child.add)) {
      t2 = _parentToChildTotalTime(timeline2.rawTime(), child);
      if (!child._dur || _clamp(0, child.totalDuration(), t2) - child._tTime > _tinyNum) {
        child.render(t2, true);
      }
    }
    if (_uncache(timeline2, child)._dp && timeline2._initted && timeline2._time >= timeline2._dur && timeline2._ts) {
      if (timeline2._dur < timeline2.duration()) {
        t2 = timeline2;
        while (t2._dp) {
          t2.rawTime() >= 0 && t2.totalTime(t2._tTime);
          t2 = t2._dp;
        }
      }
      timeline2._zTime = -_tinyNum;
    }
  };
  var _addToTimeline = function _addToTimeline2(timeline2, child, position, skipChecks) {
    child.parent && _removeFromParent(child);
    child._start = _roundPrecise((_isNumber(position) ? position : position || timeline2 !== _globalTimeline ? _parsePosition(timeline2, position, child) : timeline2._time) + child._delay);
    child._end = _roundPrecise(child._start + (child.totalDuration() / Math.abs(child.timeScale()) || 0));
    _addLinkedListItem(timeline2, child, "_first", "_last", timeline2._sort ? "_start" : 0);
    _isFromOrFromStart(child) || (timeline2._recent = child);
    skipChecks || _postAddChecks(timeline2, child);
    timeline2._ts < 0 && _alignPlayhead(timeline2, timeline2._tTime);
    return timeline2;
  };
  var _scrollTrigger = function _scrollTrigger2(animation, trigger) {
    return (_globals.ScrollTrigger || _missingPlugin("scrollTrigger", trigger)) && _globals.ScrollTrigger.create(trigger, animation);
  };
  var _attemptInitTween = function _attemptInitTween2(tween, time, force, suppressEvents, tTime) {
    _initTween(tween, time, tTime);
    if (!tween._initted) {
      return 1;
    }
    if (!force && tween._pt && !_reverting && (tween._dur && tween.vars.lazy !== false || !tween._dur && tween.vars.lazy) && _lastRenderedFrame !== _ticker.frame) {
      _lazyTweens.push(tween);
      tween._lazy = [tTime, suppressEvents];
      return 1;
    }
  };
  var _parentPlayheadIsBeforeStart = function _parentPlayheadIsBeforeStart2(_ref) {
    var parent = _ref.parent;
    return parent && parent._ts && parent._initted && !parent._lock && (parent.rawTime() < 0 || _parentPlayheadIsBeforeStart2(parent));
  };
  var _isFromOrFromStart = function _isFromOrFromStart2(_ref2) {
    var data = _ref2.data;
    return data === "isFromStart" || data === "isStart";
  };
  var _renderZeroDurationTween = function _renderZeroDurationTween2(tween, totalTime, suppressEvents, force) {
    var prevRatio = tween.ratio, ratio = totalTime < 0 || !totalTime && (!tween._start && _parentPlayheadIsBeforeStart(tween) && !(!tween._initted && _isFromOrFromStart(tween)) || (tween._ts < 0 || tween._dp._ts < 0) && !_isFromOrFromStart(tween)) ? 0 : 1, repeatDelay = tween._rDelay, tTime = 0, pt, iteration, prevIteration;
    if (repeatDelay && tween._repeat) {
      tTime = _clamp(0, tween._tDur, totalTime);
      iteration = _animationCycle(tTime, repeatDelay);
      tween._yoyo && iteration & 1 && (ratio = 1 - ratio);
      if (iteration !== _animationCycle(tween._tTime, repeatDelay)) {
        prevRatio = 1 - ratio;
        tween.vars.repeatRefresh && tween._initted && tween.invalidate();
      }
    }
    if (ratio !== prevRatio || _reverting || force || tween._zTime === _tinyNum || !totalTime && tween._zTime) {
      if (!tween._initted && _attemptInitTween(tween, totalTime, force, suppressEvents, tTime)) {
        return;
      }
      prevIteration = tween._zTime;
      tween._zTime = totalTime || (suppressEvents ? _tinyNum : 0);
      suppressEvents || (suppressEvents = totalTime && !prevIteration);
      tween.ratio = ratio;
      tween._from && (ratio = 1 - ratio);
      tween._time = 0;
      tween._tTime = tTime;
      pt = tween._pt;
      while (pt) {
        pt.r(ratio, pt.d);
        pt = pt._next;
      }
      totalTime < 0 && _rewindStartAt(tween, totalTime, suppressEvents, true);
      tween._onUpdate && !suppressEvents && _callback(tween, "onUpdate");
      tTime && tween._repeat && !suppressEvents && tween.parent && _callback(tween, "onRepeat");
      if ((totalTime >= tween._tDur || totalTime < 0) && tween.ratio === ratio) {
        ratio && _removeFromParent(tween, 1);
        if (!suppressEvents && !_reverting) {
          _callback(tween, ratio ? "onComplete" : "onReverseComplete", true);
          tween._prom && tween._prom();
        }
      }
    } else if (!tween._zTime) {
      tween._zTime = totalTime;
    }
  };
  var _findNextPauseTween = function _findNextPauseTween2(animation, prevTime, time) {
    var child;
    if (time > prevTime) {
      child = animation._first;
      while (child && child._start <= time) {
        if (child.data === "isPause" && child._start > prevTime) {
          return child;
        }
        child = child._next;
      }
    } else {
      child = animation._last;
      while (child && child._start >= time) {
        if (child.data === "isPause" && child._start < prevTime) {
          return child;
        }
        child = child._prev;
      }
    }
  };
  var _setDuration = function _setDuration2(animation, duration, skipUncache, leavePlayhead) {
    var repeat = animation._repeat, dur = _roundPrecise(duration) || 0, totalProgress = animation._tTime / animation._tDur;
    totalProgress && !leavePlayhead && (animation._time *= dur / animation._dur);
    animation._dur = dur;
    animation._tDur = !repeat ? dur : repeat < 0 ? 1e10 : _roundPrecise(dur * (repeat + 1) + animation._rDelay * repeat);
    totalProgress > 0 && !leavePlayhead && _alignPlayhead(animation, animation._tTime = animation._tDur * totalProgress);
    animation.parent && _setEnd(animation);
    skipUncache || _uncache(animation.parent, animation);
    return animation;
  };
  var _onUpdateTotalDuration = function _onUpdateTotalDuration2(animation) {
    return animation instanceof Timeline ? _uncache(animation) : _setDuration(animation, animation._dur);
  };
  var _zeroPosition = {
    _start: 0,
    endTime: _emptyFunc,
    totalDuration: _emptyFunc
  };
  var _parsePosition = function _parsePosition2(animation, position, percentAnimation) {
    var labels = animation.labels, recent = animation._recent || _zeroPosition, clippedDuration = animation.duration() >= _bigNum ? recent.endTime(false) : animation._dur, i2, offset, isPercent;
    if (_isString(position) && (isNaN(position) || position in labels)) {
      offset = position.charAt(0);
      isPercent = position.substr(-1) === "%";
      i2 = position.indexOf("=");
      if (offset === "<" || offset === ">") {
        i2 >= 0 && (position = position.replace(/=/, ""));
        return (offset === "<" ? recent._start : recent.endTime(recent._repeat >= 0)) + (parseFloat(position.substr(1)) || 0) * (isPercent ? (i2 < 0 ? recent : percentAnimation).totalDuration() / 100 : 1);
      }
      if (i2 < 0) {
        position in labels || (labels[position] = clippedDuration);
        return labels[position];
      }
      offset = parseFloat(position.charAt(i2 - 1) + position.substr(i2 + 1));
      if (isPercent && percentAnimation) {
        offset = offset / 100 * (_isArray(percentAnimation) ? percentAnimation[0] : percentAnimation).totalDuration();
      }
      return i2 > 1 ? _parsePosition2(animation, position.substr(0, i2 - 1), percentAnimation) + offset : clippedDuration + offset;
    }
    return position == null ? clippedDuration : +position;
  };
  var _createTweenType = function _createTweenType2(type, params, timeline2) {
    var isLegacy = _isNumber(params[1]), varsIndex = (isLegacy ? 2 : 1) + (type < 2 ? 0 : 1), vars = params[varsIndex], irVars, parent;
    isLegacy && (vars.duration = params[1]);
    vars.parent = timeline2;
    if (type) {
      irVars = vars;
      parent = timeline2;
      while (parent && !("immediateRender" in irVars)) {
        irVars = parent.vars.defaults || {};
        parent = _isNotFalse(parent.vars.inherit) && parent.parent;
      }
      vars.immediateRender = _isNotFalse(irVars.immediateRender);
      type < 2 ? vars.runBackwards = 1 : vars.startAt = params[varsIndex - 1];
    }
    return new Tween(params[0], vars, params[varsIndex + 1]);
  };
  var _conditionalReturn = function _conditionalReturn2(value, func) {
    return value || value === 0 ? func(value) : func;
  };
  var _clamp = function _clamp2(min, max, value) {
    return value < min ? min : value > max ? max : value;
  };
  var getUnit = function getUnit2(value, v) {
    return !_isString(value) || !(v = _unitExp.exec(value)) ? "" : v[1];
  };
  var clamp2 = function clamp3(min, max, value) {
    return _conditionalReturn(value, function(v) {
      return _clamp(min, max, v);
    });
  };
  var _slice = [].slice;
  var _isArrayLike = function _isArrayLike2(value, nonEmpty) {
    return value && _isObject(value) && "length" in value && (!nonEmpty && !value.length || value.length - 1 in value && _isObject(value[0])) && !value.nodeType && value !== _win;
  };
  var _flatten = function _flatten2(ar, leaveStrings, accumulator) {
    if (accumulator === void 0) {
      accumulator = [];
    }
    return ar.forEach(function(value) {
      var _accumulator;
      return _isString(value) && !leaveStrings || _isArrayLike(value, 1) ? (_accumulator = accumulator).push.apply(_accumulator, toArray(value)) : accumulator.push(value);
    }) || accumulator;
  };
  var toArray = function toArray2(value, scope, leaveStrings) {
    return _context && !scope && _context.selector ? _context.selector(value) : _isString(value) && !leaveStrings && (_coreInitted || !_wake()) ? _slice.call((scope || _doc).querySelectorAll(value), 0) : _isArray(value) ? _flatten(value, leaveStrings) : _isArrayLike(value) ? _slice.call(value, 0) : value ? [value] : [];
  };
  var selector = function selector2(value) {
    value = toArray(value)[0] || _warn("Invalid scope") || {};
    return function(v) {
      var el = value.current || value.nativeElement || value;
      return toArray(v, el.querySelectorAll ? el : el === value ? _warn("Invalid scope") || _doc.createElement("div") : value);
    };
  };
  var shuffle = function shuffle2(a2) {
    return a2.sort(function() {
      return 0.5 - Math.random();
    });
  };
  var distribute = function distribute2(v) {
    if (_isFunction(v)) {
      return v;
    }
    var vars = _isObject(v) ? v : {
      each: v
    }, ease = _parseEase(vars.ease), from = vars.from || 0, base = parseFloat(vars.base) || 0, cache = {}, isDecimal = from > 0 && from < 1, ratios = isNaN(from) || isDecimal, axis = vars.axis, ratioX = from, ratioY = from;
    if (_isString(from)) {
      ratioX = ratioY = {
        center: 0.5,
        edges: 0.5,
        end: 1
      }[from] || 0;
    } else if (!isDecimal && ratios) {
      ratioX = from[0];
      ratioY = from[1];
    }
    return function(i2, target, a2) {
      var l2 = (a2 || vars).length, distances = cache[l2], originX, originY, x, y, d2, j, max, min, wrapAt;
      if (!distances) {
        wrapAt = vars.grid === "auto" ? 0 : (vars.grid || [1, _bigNum])[1];
        if (!wrapAt) {
          max = -_bigNum;
          while (max < (max = a2[wrapAt++].getBoundingClientRect().left) && wrapAt < l2) {
          }
          wrapAt < l2 && wrapAt--;
        }
        distances = cache[l2] = [];
        originX = ratios ? Math.min(wrapAt, l2) * ratioX - 0.5 : from % wrapAt;
        originY = wrapAt === _bigNum ? 0 : ratios ? l2 * ratioY / wrapAt - 0.5 : from / wrapAt | 0;
        max = 0;
        min = _bigNum;
        for (j = 0; j < l2; j++) {
          x = j % wrapAt - originX;
          y = originY - (j / wrapAt | 0);
          distances[j] = d2 = !axis ? _sqrt(x * x + y * y) : Math.abs(axis === "y" ? y : x);
          d2 > max && (max = d2);
          d2 < min && (min = d2);
        }
        from === "random" && shuffle(distances);
        distances.max = max - min;
        distances.min = min;
        distances.v = l2 = (parseFloat(vars.amount) || parseFloat(vars.each) * (wrapAt > l2 ? l2 - 1 : !axis ? Math.max(wrapAt, l2 / wrapAt) : axis === "y" ? l2 / wrapAt : wrapAt) || 0) * (from === "edges" ? -1 : 1);
        distances.b = l2 < 0 ? base - l2 : base;
        distances.u = getUnit(vars.amount || vars.each) || 0;
        ease = ease && l2 < 0 ? _invertEase(ease) : ease;
      }
      l2 = (distances[i2] - distances.min) / distances.max || 0;
      return _roundPrecise(distances.b + (ease ? ease(l2) : l2) * distances.v) + distances.u;
    };
  };
  var _roundModifier = function _roundModifier2(v) {
    var p2 = Math.pow(10, ((v + "").split(".")[1] || "").length);
    return function(raw) {
      var n2 = _roundPrecise(Math.round(parseFloat(raw) / v) * v * p2);
      return (n2 - n2 % 1) / p2 + (_isNumber(raw) ? 0 : getUnit(raw));
    };
  };
  var snap = function snap2(snapTo, value) {
    var isArray = _isArray(snapTo), radius, is2D;
    if (!isArray && _isObject(snapTo)) {
      radius = isArray = snapTo.radius || _bigNum;
      if (snapTo.values) {
        snapTo = toArray(snapTo.values);
        if (is2D = !_isNumber(snapTo[0])) {
          radius *= radius;
        }
      } else {
        snapTo = _roundModifier(snapTo.increment);
      }
    }
    return _conditionalReturn(value, !isArray ? _roundModifier(snapTo) : _isFunction(snapTo) ? function(raw) {
      is2D = snapTo(raw);
      return Math.abs(is2D - raw) <= radius ? is2D : raw;
    } : function(raw) {
      var x = parseFloat(is2D ? raw.x : raw), y = parseFloat(is2D ? raw.y : 0), min = _bigNum, closest = 0, i2 = snapTo.length, dx, dy;
      while (i2--) {
        if (is2D) {
          dx = snapTo[i2].x - x;
          dy = snapTo[i2].y - y;
          dx = dx * dx + dy * dy;
        } else {
          dx = Math.abs(snapTo[i2] - x);
        }
        if (dx < min) {
          min = dx;
          closest = i2;
        }
      }
      closest = !radius || min <= radius ? snapTo[closest] : raw;
      return is2D || closest === raw || _isNumber(raw) ? closest : closest + getUnit(raw);
    });
  };
  var random = function random2(min, max, roundingIncrement, returnFunction) {
    return _conditionalReturn(_isArray(min) ? !max : roundingIncrement === true ? !!(roundingIncrement = 0) : !returnFunction, function() {
      return _isArray(min) ? min[~~(Math.random() * min.length)] : (roundingIncrement = roundingIncrement || 1e-5) && (returnFunction = roundingIncrement < 1 ? Math.pow(10, (roundingIncrement + "").length - 2) : 1) && Math.floor(Math.round((min - roundingIncrement / 2 + Math.random() * (max - min + roundingIncrement * 0.99)) / roundingIncrement) * roundingIncrement * returnFunction) / returnFunction;
    });
  };
  var pipe = function pipe2() {
    for (var _len = arguments.length, functions = new Array(_len), _key = 0; _key < _len; _key++) {
      functions[_key] = arguments[_key];
    }
    return function(value) {
      return functions.reduce(function(v, f2) {
        return f2(v);
      }, value);
    };
  };
  var unitize = function unitize2(func, unit) {
    return function(value) {
      return func(parseFloat(value)) + (unit || getUnit(value));
    };
  };
  var normalize = function normalize2(min, max, value) {
    return mapRange(min, max, 0, 1, value);
  };
  var _wrapArray = function _wrapArray2(a2, wrapper, value) {
    return _conditionalReturn(value, function(index) {
      return a2[~~wrapper(index)];
    });
  };
  var wrap = function wrap2(min, max, value) {
    var range = max - min;
    return _isArray(min) ? _wrapArray(min, wrap2(0, min.length), max) : _conditionalReturn(value, function(value2) {
      return (range + (value2 - min) % range) % range + min;
    });
  };
  var wrapYoyo = function wrapYoyo2(min, max, value) {
    var range = max - min, total = range * 2;
    return _isArray(min) ? _wrapArray(min, wrapYoyo2(0, min.length - 1), max) : _conditionalReturn(value, function(value2) {
      value2 = (total + (value2 - min) % total) % total || 0;
      return min + (value2 > range ? total - value2 : value2);
    });
  };
  var _replaceRandom = function _replaceRandom2(value) {
    var prev = 0, s2 = "", i2, nums, end, isArray;
    while (~(i2 = value.indexOf("random(", prev))) {
      end = value.indexOf(")", i2);
      isArray = value.charAt(i2 + 7) === "[";
      nums = value.substr(i2 + 7, end - i2 - 7).match(isArray ? _delimitedValueExp : _strictNumExp);
      s2 += value.substr(prev, i2 - prev) + random(isArray ? nums : +nums[0], isArray ? 0 : +nums[1], +nums[2] || 1e-5);
      prev = end + 1;
    }
    return s2 + value.substr(prev, value.length - prev);
  };
  var mapRange = function mapRange2(inMin, inMax, outMin, outMax, value) {
    var inRange = inMax - inMin, outRange = outMax - outMin;
    return _conditionalReturn(value, function(value2) {
      return outMin + ((value2 - inMin) / inRange * outRange || 0);
    });
  };
  var interpolate = function interpolate2(start, end, progress, mutate) {
    var func = isNaN(start + end) ? 0 : function(p3) {
      return (1 - p3) * start + p3 * end;
    };
    if (!func) {
      var isString = _isString(start), master = {}, p2, i2, interpolators, l2, il;
      progress === true && (mutate = 1) && (progress = null);
      if (isString) {
        start = {
          p: start
        };
        end = {
          p: end
        };
      } else if (_isArray(start) && !_isArray(end)) {
        interpolators = [];
        l2 = start.length;
        il = l2 - 2;
        for (i2 = 1; i2 < l2; i2++) {
          interpolators.push(interpolate2(start[i2 - 1], start[i2]));
        }
        l2--;
        func = function func2(p3) {
          p3 *= l2;
          var i3 = Math.min(il, ~~p3);
          return interpolators[i3](p3 - i3);
        };
        progress = end;
      } else if (!mutate) {
        start = _merge(_isArray(start) ? [] : {}, start);
      }
      if (!interpolators) {
        for (p2 in end) {
          _addPropTween.call(master, start, p2, "get", end[p2]);
        }
        func = function func2(p3) {
          return _renderPropTweens(p3, master) || (isString ? start.p : start);
        };
      }
    }
    return _conditionalReturn(progress, func);
  };
  var _getLabelInDirection = function _getLabelInDirection2(timeline2, fromTime, backward) {
    var labels = timeline2.labels, min = _bigNum, p2, distance, label;
    for (p2 in labels) {
      distance = labels[p2] - fromTime;
      if (distance < 0 === !!backward && distance && min > (distance = Math.abs(distance))) {
        label = p2;
        min = distance;
      }
    }
    return label;
  };
  var _callback = function _callback2(animation, type, executeLazyFirst) {
    var v = animation.vars, callback = v[type], prevContext = _context, context3 = animation._ctx, params, scope, result;
    if (!callback) {
      return;
    }
    params = v[type + "Params"];
    scope = v.callbackScope || animation;
    executeLazyFirst && _lazyTweens.length && _lazyRender();
    context3 && (_context = context3);
    result = params ? callback.apply(scope, params) : callback.call(scope);
    _context = prevContext;
    return result;
  };
  var _interrupt = function _interrupt2(animation) {
    _removeFromParent(animation);
    animation.scrollTrigger && animation.scrollTrigger.kill(!!_reverting);
    animation.progress() < 1 && _callback(animation, "onInterrupt");
    return animation;
  };
  var _quickTween;
  var _registerPluginQueue = [];
  var _createPlugin = function _createPlugin2(config3) {
    if (!config3) return;
    config3 = !config3.name && config3["default"] || config3;
    if (_windowExists() || config3.headless) {
      var name = config3.name, isFunc = _isFunction(config3), Plugin = name && !isFunc && config3.init ? function() {
        this._props = [];
      } : config3, instanceDefaults = {
        init: _emptyFunc,
        render: _renderPropTweens,
        add: _addPropTween,
        kill: _killPropTweensOf,
        modifier: _addPluginModifier,
        rawVars: 0
      }, statics = {
        targetTest: 0,
        get: 0,
        getSetter: _getSetter,
        aliases: {},
        register: 0
      };
      _wake();
      if (config3 !== Plugin) {
        if (_plugins[name]) {
          return;
        }
        _setDefaults(Plugin, _setDefaults(_copyExcluding(config3, instanceDefaults), statics));
        _merge(Plugin.prototype, _merge(instanceDefaults, _copyExcluding(config3, statics)));
        _plugins[Plugin.prop = name] = Plugin;
        if (config3.targetTest) {
          _harnessPlugins.push(Plugin);
          _reservedProps[name] = 1;
        }
        name = (name === "css" ? "CSS" : name.charAt(0).toUpperCase() + name.substr(1)) + "Plugin";
      }
      _addGlobal(name, Plugin);
      config3.register && config3.register(gsap, Plugin, PropTween);
    } else {
      _registerPluginQueue.push(config3);
    }
  };
  var _255 = 255;
  var _colorLookup = {
    aqua: [0, _255, _255],
    lime: [0, _255, 0],
    silver: [192, 192, 192],
    black: [0, 0, 0],
    maroon: [128, 0, 0],
    teal: [0, 128, 128],
    blue: [0, 0, _255],
    navy: [0, 0, 128],
    white: [_255, _255, _255],
    olive: [128, 128, 0],
    yellow: [_255, _255, 0],
    orange: [_255, 165, 0],
    gray: [128, 128, 128],
    purple: [128, 0, 128],
    green: [0, 128, 0],
    red: [_255, 0, 0],
    pink: [_255, 192, 203],
    cyan: [0, _255, _255],
    transparent: [_255, _255, _255, 0]
  };
  var _hue = function _hue2(h2, m1, m2) {
    h2 += h2 < 0 ? 1 : h2 > 1 ? -1 : 0;
    return (h2 * 6 < 1 ? m1 + (m2 - m1) * h2 * 6 : h2 < 0.5 ? m2 : h2 * 3 < 2 ? m1 + (m2 - m1) * (2 / 3 - h2) * 6 : m1) * _255 + 0.5 | 0;
  };
  var splitColor = function splitColor2(v, toHSL, forceAlpha) {
    var a2 = !v ? _colorLookup.black : _isNumber(v) ? [v >> 16, v >> 8 & _255, v & _255] : 0, r2, g3, b, h2, s2, l2, max, min, d2, wasHSL;
    if (!a2) {
      if (v.substr(-1) === ",") {
        v = v.substr(0, v.length - 1);
      }
      if (_colorLookup[v]) {
        a2 = _colorLookup[v];
      } else if (v.charAt(0) === "#") {
        if (v.length < 6) {
          r2 = v.charAt(1);
          g3 = v.charAt(2);
          b = v.charAt(3);
          v = "#" + r2 + r2 + g3 + g3 + b + b + (v.length === 5 ? v.charAt(4) + v.charAt(4) : "");
        }
        if (v.length === 9) {
          a2 = parseInt(v.substr(1, 6), 16);
          return [a2 >> 16, a2 >> 8 & _255, a2 & _255, parseInt(v.substr(7), 16) / 255];
        }
        v = parseInt(v.substr(1), 16);
        a2 = [v >> 16, v >> 8 & _255, v & _255];
      } else if (v.substr(0, 3) === "hsl") {
        a2 = wasHSL = v.match(_strictNumExp);
        if (!toHSL) {
          h2 = +a2[0] % 360 / 360;
          s2 = +a2[1] / 100;
          l2 = +a2[2] / 100;
          g3 = l2 <= 0.5 ? l2 * (s2 + 1) : l2 + s2 - l2 * s2;
          r2 = l2 * 2 - g3;
          a2.length > 3 && (a2[3] *= 1);
          a2[0] = _hue(h2 + 1 / 3, r2, g3);
          a2[1] = _hue(h2, r2, g3);
          a2[2] = _hue(h2 - 1 / 3, r2, g3);
        } else if (~v.indexOf("=")) {
          a2 = v.match(_numExp);
          forceAlpha && a2.length < 4 && (a2[3] = 1);
          return a2;
        }
      } else {
        a2 = v.match(_strictNumExp) || _colorLookup.transparent;
      }
      a2 = a2.map(Number);
    }
    if (toHSL && !wasHSL) {
      r2 = a2[0] / _255;
      g3 = a2[1] / _255;
      b = a2[2] / _255;
      max = Math.max(r2, g3, b);
      min = Math.min(r2, g3, b);
      l2 = (max + min) / 2;
      if (max === min) {
        h2 = s2 = 0;
      } else {
        d2 = max - min;
        s2 = l2 > 0.5 ? d2 / (2 - max - min) : d2 / (max + min);
        h2 = max === r2 ? (g3 - b) / d2 + (g3 < b ? 6 : 0) : max === g3 ? (b - r2) / d2 + 2 : (r2 - g3) / d2 + 4;
        h2 *= 60;
      }
      a2[0] = ~~(h2 + 0.5);
      a2[1] = ~~(s2 * 100 + 0.5);
      a2[2] = ~~(l2 * 100 + 0.5);
    }
    forceAlpha && a2.length < 4 && (a2[3] = 1);
    return a2;
  };
  var _colorOrderData = function _colorOrderData2(v) {
    var values = [], c2 = [], i2 = -1;
    v.split(_colorExp).forEach(function(v2) {
      var a2 = v2.match(_numWithUnitExp) || [];
      values.push.apply(values, a2);
      c2.push(i2 += a2.length + 1);
    });
    values.c = c2;
    return values;
  };
  var _formatColors = function _formatColors2(s2, toHSL, orderMatchData) {
    var result = "", colors = (s2 + result).match(_colorExp), type = toHSL ? "hsla(" : "rgba(", i2 = 0, c2, shell, d2, l2;
    if (!colors) {
      return s2;
    }
    colors = colors.map(function(color) {
      return (color = splitColor(color, toHSL, 1)) && type + (toHSL ? color[0] + "," + color[1] + "%," + color[2] + "%," + color[3] : color.join(",")) + ")";
    });
    if (orderMatchData) {
      d2 = _colorOrderData(s2);
      c2 = orderMatchData.c;
      if (c2.join(result) !== d2.c.join(result)) {
        shell = s2.replace(_colorExp, "1").split(_numWithUnitExp);
        l2 = shell.length - 1;
        for (; i2 < l2; i2++) {
          result += shell[i2] + (~c2.indexOf(i2) ? colors.shift() || type + "0,0,0,0)" : (d2.length ? d2 : colors.length ? colors : orderMatchData).shift());
        }
      }
    }
    if (!shell) {
      shell = s2.split(_colorExp);
      l2 = shell.length - 1;
      for (; i2 < l2; i2++) {
        result += shell[i2] + colors[i2];
      }
    }
    return result + shell[l2];
  };
  var _colorExp = function() {
    var s2 = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b", p2;
    for (p2 in _colorLookup) {
      s2 += "|" + p2 + "\\b";
    }
    return new RegExp(s2 + ")", "gi");
  }();
  var _hslExp = /hsl[a]?\(/;
  var _colorStringFilter = function _colorStringFilter2(a2) {
    var combined = a2.join(" "), toHSL;
    _colorExp.lastIndex = 0;
    if (_colorExp.test(combined)) {
      toHSL = _hslExp.test(combined);
      a2[1] = _formatColors(a2[1], toHSL);
      a2[0] = _formatColors(a2[0], toHSL, _colorOrderData(a2[1]));
      return true;
    }
  };
  var _tickerActive;
  var _ticker = function() {
    var _getTime3 = Date.now, _lagThreshold = 500, _adjustedLag = 33, _startTime = _getTime3(), _lastUpdate = _startTime, _gap = 1e3 / 240, _nextTime = _gap, _listeners3 = [], _id, _req, _raf, _self, _delta, _i2, _tick = function _tick2(v) {
      var elapsed = _getTime3() - _lastUpdate, manual = v === true, overlap, dispatch, time, frame;
      (elapsed > _lagThreshold || elapsed < 0) && (_startTime += elapsed - _adjustedLag);
      _lastUpdate += elapsed;
      time = _lastUpdate - _startTime;
      overlap = time - _nextTime;
      if (overlap > 0 || manual) {
        frame = ++_self.frame;
        _delta = time - _self.time * 1e3;
        _self.time = time = time / 1e3;
        _nextTime += overlap + (overlap >= _gap ? 4 : _gap - overlap);
        dispatch = 1;
      }
      manual || (_id = _req(_tick2));
      if (dispatch) {
        for (_i2 = 0; _i2 < _listeners3.length; _i2++) {
          _listeners3[_i2](time, _delta, frame, v);
        }
      }
    };
    _self = {
      time: 0,
      frame: 0,
      tick: function tick() {
        _tick(true);
      },
      deltaRatio: function deltaRatio(fps) {
        return _delta / (1e3 / (fps || 60));
      },
      wake: function wake() {
        if (_coreReady) {
          if (!_coreInitted && _windowExists()) {
            _win = _coreInitted = window;
            _doc = _win.document || {};
            _globals.gsap = gsap;
            (_win.gsapVersions || (_win.gsapVersions = [])).push(gsap.version);
            _install(_installScope || _win.GreenSockGlobals || !_win.gsap && _win || {});
            _registerPluginQueue.forEach(_createPlugin);
          }
          _raf = typeof requestAnimationFrame !== "undefined" && requestAnimationFrame;
          _id && _self.sleep();
          _req = _raf || function(f2) {
            return setTimeout(f2, _nextTime - _self.time * 1e3 + 1 | 0);
          };
          _tickerActive = 1;
          _tick(2);
        }
      },
      sleep: function sleep() {
        (_raf ? cancelAnimationFrame : clearTimeout)(_id);
        _tickerActive = 0;
        _req = _emptyFunc;
      },
      lagSmoothing: function lagSmoothing(threshold, adjustedLag) {
        _lagThreshold = threshold || Infinity;
        _adjustedLag = Math.min(adjustedLag || 33, _lagThreshold);
      },
      fps: function fps(_fps) {
        _gap = 1e3 / (_fps || 240);
        _nextTime = _self.time * 1e3 + _gap;
      },
      add: function add(callback, once, prioritize) {
        var func = once ? function(t2, d2, f2, v) {
          callback(t2, d2, f2, v);
          _self.remove(func);
        } : callback;
        _self.remove(callback);
        _listeners3[prioritize ? "unshift" : "push"](func);
        _wake();
        return func;
      },
      remove: function remove(callback, i2) {
        ~(i2 = _listeners3.indexOf(callback)) && _listeners3.splice(i2, 1) && _i2 >= i2 && _i2--;
      },
      _listeners: _listeners3
    };
    return _self;
  }();
  var _wake = function _wake2() {
    return !_tickerActive && _ticker.wake();
  };
  var _easeMap = {};
  var _customEaseExp = /^[\d.\-M][\d.\-,\s]/;
  var _quotesExp = /["']/g;
  var _parseObjectInString = function _parseObjectInString2(value) {
    var obj = {}, split = value.substr(1, value.length - 3).split(":"), key = split[0], i2 = 1, l2 = split.length, index, val, parsedVal;
    for (; i2 < l2; i2++) {
      val = split[i2];
      index = i2 !== l2 - 1 ? val.lastIndexOf(",") : val.length;
      parsedVal = val.substr(0, index);
      obj[key] = isNaN(parsedVal) ? parsedVal.replace(_quotesExp, "").trim() : +parsedVal;
      key = val.substr(index + 1).trim();
    }
    return obj;
  };
  var _valueInParentheses = function _valueInParentheses2(value) {
    var open = value.indexOf("(") + 1, close = value.indexOf(")"), nested = value.indexOf("(", open);
    return value.substring(open, ~nested && nested < close ? value.indexOf(")", close + 1) : close);
  };
  var _configEaseFromString = function _configEaseFromString2(name) {
    var split = (name + "").split("("), ease = _easeMap[split[0]];
    return ease && split.length > 1 && ease.config ? ease.config.apply(null, ~name.indexOf("{") ? [_parseObjectInString(split[1])] : _valueInParentheses(name).split(",").map(_numericIfPossible)) : _easeMap._CE && _customEaseExp.test(name) ? _easeMap._CE("", name) : ease;
  };
  var _invertEase = function _invertEase2(ease) {
    return function(p2) {
      return 1 - ease(1 - p2);
    };
  };
  var _propagateYoyoEase = function _propagateYoyoEase2(timeline2, isYoyo) {
    var child = timeline2._first, ease;
    while (child) {
      if (child instanceof Timeline) {
        _propagateYoyoEase2(child, isYoyo);
      } else if (child.vars.yoyoEase && (!child._yoyo || !child._repeat) && child._yoyo !== isYoyo) {
        if (child.timeline) {
          _propagateYoyoEase2(child.timeline, isYoyo);
        } else {
          ease = child._ease;
          child._ease = child._yEase;
          child._yEase = ease;
          child._yoyo = isYoyo;
        }
      }
      child = child._next;
    }
  };
  var _parseEase = function _parseEase2(ease, defaultEase) {
    return !ease ? defaultEase : (_isFunction(ease) ? ease : _easeMap[ease] || _configEaseFromString(ease)) || defaultEase;
  };
  var _insertEase = function _insertEase2(names, easeIn, easeOut, easeInOut) {
    if (easeOut === void 0) {
      easeOut = function easeOut2(p2) {
        return 1 - easeIn(1 - p2);
      };
    }
    if (easeInOut === void 0) {
      easeInOut = function easeInOut2(p2) {
        return p2 < 0.5 ? easeIn(p2 * 2) / 2 : 1 - easeIn((1 - p2) * 2) / 2;
      };
    }
    var ease = {
      easeIn,
      easeOut,
      easeInOut
    }, lowercaseName;
    _forEachName(names, function(name) {
      _easeMap[name] = _globals[name] = ease;
      _easeMap[lowercaseName = name.toLowerCase()] = easeOut;
      for (var p2 in ease) {
        _easeMap[lowercaseName + (p2 === "easeIn" ? ".in" : p2 === "easeOut" ? ".out" : ".inOut")] = _easeMap[name + "." + p2] = ease[p2];
      }
    });
    return ease;
  };
  var _easeInOutFromOut = function _easeInOutFromOut2(easeOut) {
    return function(p2) {
      return p2 < 0.5 ? (1 - easeOut(1 - p2 * 2)) / 2 : 0.5 + easeOut((p2 - 0.5) * 2) / 2;
    };
  };
  var _configElastic = function _configElastic2(type, amplitude, period) {
    var p1 = amplitude >= 1 ? amplitude : 1, p2 = (period || (type ? 0.3 : 0.45)) / (amplitude < 1 ? amplitude : 1), p3 = p2 / _2PI * (Math.asin(1 / p1) || 0), easeOut = function easeOut2(p4) {
      return p4 === 1 ? 1 : p1 * Math.pow(2, -10 * p4) * _sin((p4 - p3) * p2) + 1;
    }, ease = type === "out" ? easeOut : type === "in" ? function(p4) {
      return 1 - easeOut(1 - p4);
    } : _easeInOutFromOut(easeOut);
    p2 = _2PI / p2;
    ease.config = function(amplitude2, period2) {
      return _configElastic2(type, amplitude2, period2);
    };
    return ease;
  };
  var _configBack = function _configBack2(type, overshoot) {
    if (overshoot === void 0) {
      overshoot = 1.70158;
    }
    var easeOut = function easeOut2(p2) {
      return p2 ? --p2 * p2 * ((overshoot + 1) * p2 + overshoot) + 1 : 0;
    }, ease = type === "out" ? easeOut : type === "in" ? function(p2) {
      return 1 - easeOut(1 - p2);
    } : _easeInOutFromOut(easeOut);
    ease.config = function(overshoot2) {
      return _configBack2(type, overshoot2);
    };
    return ease;
  };
  _forEachName("Linear,Quad,Cubic,Quart,Quint,Strong", function(name, i2) {
    var power = i2 < 5 ? i2 + 1 : i2;
    _insertEase(name + ",Power" + (power - 1), i2 ? function(p2) {
      return Math.pow(p2, power);
    } : function(p2) {
      return p2;
    }, function(p2) {
      return 1 - Math.pow(1 - p2, power);
    }, function(p2) {
      return p2 < 0.5 ? Math.pow(p2 * 2, power) / 2 : 1 - Math.pow((1 - p2) * 2, power) / 2;
    });
  });
  _easeMap.Linear.easeNone = _easeMap.none = _easeMap.Linear.easeIn;
  _insertEase("Elastic", _configElastic("in"), _configElastic("out"), _configElastic());
  (function(n2, c2) {
    var n1 = 1 / c2, n22 = 2 * n1, n3 = 2.5 * n1, easeOut = function easeOut2(p2) {
      return p2 < n1 ? n2 * p2 * p2 : p2 < n22 ? n2 * Math.pow(p2 - 1.5 / c2, 2) + 0.75 : p2 < n3 ? n2 * (p2 -= 2.25 / c2) * p2 + 0.9375 : n2 * Math.pow(p2 - 2.625 / c2, 2) + 0.984375;
    };
    _insertEase("Bounce", function(p2) {
      return 1 - easeOut(1 - p2);
    }, easeOut);
  })(7.5625, 2.75);
  _insertEase("Expo", function(p2) {
    return Math.pow(2, 10 * (p2 - 1)) * p2 + p2 * p2 * p2 * p2 * p2 * p2 * (1 - p2);
  });
  _insertEase("Circ", function(p2) {
    return -(_sqrt(1 - p2 * p2) - 1);
  });
  _insertEase("Sine", function(p2) {
    return p2 === 1 ? 1 : -_cos(p2 * _HALF_PI) + 1;
  });
  _insertEase("Back", _configBack("in"), _configBack("out"), _configBack());
  _easeMap.SteppedEase = _easeMap.steps = _globals.SteppedEase = {
    config: function config(steps, immediateStart) {
      if (steps === void 0) {
        steps = 1;
      }
      var p1 = 1 / steps, p2 = steps + (immediateStart ? 0 : 1), p3 = immediateStart ? 1 : 0, max = 1 - _tinyNum;
      return function(p4) {
        return ((p2 * _clamp(0, max, p4) | 0) + p3) * p1;
      };
    }
  };
  _defaults.ease = _easeMap["quad.out"];
  _forEachName("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt", function(name) {
    return _callbackNames += name + "," + name + "Params,";
  });
  var GSCache = function GSCache2(target, harness) {
    this.id = _gsID++;
    target._gsap = this;
    this.target = target;
    this.harness = harness;
    this.get = harness ? harness.get : _getProperty;
    this.set = harness ? harness.getSetter : _getSetter;
  };
  var Animation = /* @__PURE__ */ function() {
    function Animation2(vars) {
      this.vars = vars;
      this._delay = +vars.delay || 0;
      if (this._repeat = vars.repeat === Infinity ? -2 : vars.repeat || 0) {
        this._rDelay = vars.repeatDelay || 0;
        this._yoyo = !!vars.yoyo || !!vars.yoyoEase;
      }
      this._ts = 1;
      _setDuration(this, +vars.duration, 1, 1);
      this.data = vars.data;
      if (_context) {
        this._ctx = _context;
        _context.data.push(this);
      }
      _tickerActive || _ticker.wake();
    }
    var _proto = Animation2.prototype;
    _proto.delay = function delay(value) {
      if (value || value === 0) {
        this.parent && this.parent.smoothChildTiming && this.startTime(this._start + value - this._delay);
        this._delay = value;
        return this;
      }
      return this._delay;
    };
    _proto.duration = function duration(value) {
      return arguments.length ? this.totalDuration(this._repeat > 0 ? value + (value + this._rDelay) * this._repeat : value) : this.totalDuration() && this._dur;
    };
    _proto.totalDuration = function totalDuration(value) {
      if (!arguments.length) {
        return this._tDur;
      }
      this._dirty = 0;
      return _setDuration(this, this._repeat < 0 ? value : (value - this._repeat * this._rDelay) / (this._repeat + 1));
    };
    _proto.totalTime = function totalTime(_totalTime, suppressEvents) {
      _wake();
      if (!arguments.length) {
        return this._tTime;
      }
      var parent = this._dp;
      if (parent && parent.smoothChildTiming && this._ts) {
        _alignPlayhead(this, _totalTime);
        !parent._dp || parent.parent || _postAddChecks(parent, this);
        while (parent && parent.parent) {
          if (parent.parent._time !== parent._start + (parent._ts >= 0 ? parent._tTime / parent._ts : (parent.totalDuration() - parent._tTime) / -parent._ts)) {
            parent.totalTime(parent._tTime, true);
          }
          parent = parent.parent;
        }
        if (!this.parent && this._dp.autoRemoveChildren && (this._ts > 0 && _totalTime < this._tDur || this._ts < 0 && _totalTime > 0 || !this._tDur && !_totalTime)) {
          _addToTimeline(this._dp, this, this._start - this._delay);
        }
      }
      if (this._tTime !== _totalTime || !this._dur && !suppressEvents || this._initted && Math.abs(this._zTime) === _tinyNum || !_totalTime && !this._initted && (this.add || this._ptLookup)) {
        this._ts || (this._pTime = _totalTime);
        _lazySafeRender(this, _totalTime, suppressEvents);
      }
      return this;
    };
    _proto.time = function time(value, suppressEvents) {
      return arguments.length ? this.totalTime(Math.min(this.totalDuration(), value + _elapsedCycleDuration(this)) % (this._dur + this._rDelay) || (value ? this._dur : 0), suppressEvents) : this._time;
    };
    _proto.totalProgress = function totalProgress(value, suppressEvents) {
      return arguments.length ? this.totalTime(this.totalDuration() * value, suppressEvents) : this.totalDuration() ? Math.min(1, this._tTime / this._tDur) : this.rawTime() >= 0 && this._initted ? 1 : 0;
    };
    _proto.progress = function progress(value, suppressEvents) {
      return arguments.length ? this.totalTime(this.duration() * (this._yoyo && !(this.iteration() & 1) ? 1 - value : value) + _elapsedCycleDuration(this), suppressEvents) : this.duration() ? Math.min(1, this._time / this._dur) : this.rawTime() > 0 ? 1 : 0;
    };
    _proto.iteration = function iteration(value, suppressEvents) {
      var cycleDuration = this.duration() + this._rDelay;
      return arguments.length ? this.totalTime(this._time + (value - 1) * cycleDuration, suppressEvents) : this._repeat ? _animationCycle(this._tTime, cycleDuration) + 1 : 1;
    };
    _proto.timeScale = function timeScale(value, suppressEvents) {
      if (!arguments.length) {
        return this._rts === -_tinyNum ? 0 : this._rts;
      }
      if (this._rts === value) {
        return this;
      }
      var tTime = this.parent && this._ts ? _parentToChildTotalTime(this.parent._time, this) : this._tTime;
      this._rts = +value || 0;
      this._ts = this._ps || value === -_tinyNum ? 0 : this._rts;
      this.totalTime(_clamp(-Math.abs(this._delay), this.totalDuration(), tTime), suppressEvents !== false);
      _setEnd(this);
      return _recacheAncestors(this);
    };
    _proto.paused = function paused(value) {
      if (!arguments.length) {
        return this._ps;
      }
      if (this._ps !== value) {
        this._ps = value;
        if (value) {
          this._pTime = this._tTime || Math.max(-this._delay, this.rawTime());
          this._ts = this._act = 0;
        } else {
          _wake();
          this._ts = this._rts;
          this.totalTime(this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime, this.progress() === 1 && Math.abs(this._zTime) !== _tinyNum && (this._tTime -= _tinyNum));
        }
      }
      return this;
    };
    _proto.startTime = function startTime(value) {
      if (arguments.length) {
        this._start = value;
        var parent = this.parent || this._dp;
        parent && (parent._sort || !this.parent) && _addToTimeline(parent, this, value - this._delay);
        return this;
      }
      return this._start;
    };
    _proto.endTime = function endTime(includeRepeats) {
      return this._start + (_isNotFalse(includeRepeats) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1);
    };
    _proto.rawTime = function rawTime(wrapRepeats) {
      var parent = this.parent || this._dp;
      return !parent ? this._tTime : wrapRepeats && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : !this._ts ? this._tTime : _parentToChildTotalTime(parent.rawTime(wrapRepeats), this);
    };
    _proto.revert = function revert(config3) {
      if (config3 === void 0) {
        config3 = _revertConfig;
      }
      var prevIsReverting = _reverting;
      _reverting = config3;
      if (_isRevertWorthy(this)) {
        this.timeline && this.timeline.revert(config3);
        this.totalTime(-0.01, config3.suppressEvents);
      }
      this.data !== "nested" && config3.kill !== false && this.kill();
      _reverting = prevIsReverting;
      return this;
    };
    _proto.globalTime = function globalTime(rawTime) {
      var animation = this, time = arguments.length ? rawTime : animation.rawTime();
      while (animation) {
        time = animation._start + time / (Math.abs(animation._ts) || 1);
        animation = animation._dp;
      }
      return !this.parent && this._sat ? this._sat.globalTime(rawTime) : time;
    };
    _proto.repeat = function repeat(value) {
      if (arguments.length) {
        this._repeat = value === Infinity ? -2 : value;
        return _onUpdateTotalDuration(this);
      }
      return this._repeat === -2 ? Infinity : this._repeat;
    };
    _proto.repeatDelay = function repeatDelay(value) {
      if (arguments.length) {
        var time = this._time;
        this._rDelay = value;
        _onUpdateTotalDuration(this);
        return time ? this.time(time) : this;
      }
      return this._rDelay;
    };
    _proto.yoyo = function yoyo(value) {
      if (arguments.length) {
        this._yoyo = value;
        return this;
      }
      return this._yoyo;
    };
    _proto.seek = function seek(position, suppressEvents) {
      return this.totalTime(_parsePosition(this, position), _isNotFalse(suppressEvents));
    };
    _proto.restart = function restart(includeDelay, suppressEvents) {
      this.play().totalTime(includeDelay ? -this._delay : 0, _isNotFalse(suppressEvents));
      this._dur || (this._zTime = -_tinyNum);
      return this;
    };
    _proto.play = function play(from, suppressEvents) {
      from != null && this.seek(from, suppressEvents);
      return this.reversed(false).paused(false);
    };
    _proto.reverse = function reverse(from, suppressEvents) {
      from != null && this.seek(from || this.totalDuration(), suppressEvents);
      return this.reversed(true).paused(false);
    };
    _proto.pause = function pause(atTime, suppressEvents) {
      atTime != null && this.seek(atTime, suppressEvents);
      return this.paused(true);
    };
    _proto.resume = function resume() {
      return this.paused(false);
    };
    _proto.reversed = function reversed(value) {
      if (arguments.length) {
        !!value !== this.reversed() && this.timeScale(-this._rts || (value ? -_tinyNum : 0));
        return this;
      }
      return this._rts < 0;
    };
    _proto.invalidate = function invalidate() {
      this._initted = this._act = 0;
      this._zTime = -_tinyNum;
      return this;
    };
    _proto.isActive = function isActive() {
      var parent = this.parent || this._dp, start = this._start, rawTime;
      return !!(!parent || this._ts && this._initted && parent.isActive() && (rawTime = parent.rawTime(true)) >= start && rawTime < this.endTime(true) - _tinyNum);
    };
    _proto.eventCallback = function eventCallback(type, callback, params) {
      var vars = this.vars;
      if (arguments.length > 1) {
        if (!callback) {
          delete vars[type];
        } else {
          vars[type] = callback;
          params && (vars[type + "Params"] = params);
          type === "onUpdate" && (this._onUpdate = callback);
        }
        return this;
      }
      return vars[type];
    };
    _proto.then = function then(onFulfilled) {
      var self = this;
      return new Promise(function(resolve) {
        var f2 = _isFunction(onFulfilled) ? onFulfilled : _passThrough, _resolve = function _resolve2() {
          var _then = self.then;
          self.then = null;
          _isFunction(f2) && (f2 = f2(self)) && (f2.then || f2 === self) && (self.then = _then);
          resolve(f2);
          self.then = _then;
        };
        if (self._initted && self.totalProgress() === 1 && self._ts >= 0 || !self._tTime && self._ts < 0) {
          _resolve();
        } else {
          self._prom = _resolve;
        }
      });
    };
    _proto.kill = function kill() {
      _interrupt(this);
    };
    return Animation2;
  }();
  _setDefaults(Animation.prototype, {
    _time: 0,
    _start: 0,
    _end: 0,
    _tTime: 0,
    _tDur: 0,
    _dirty: 0,
    _repeat: 0,
    _yoyo: false,
    parent: null,
    _initted: false,
    _rDelay: 0,
    _ts: 1,
    _dp: 0,
    ratio: 0,
    _zTime: -_tinyNum,
    _prom: 0,
    _ps: false,
    _rts: 1
  });
  var Timeline = /* @__PURE__ */ function(_Animation) {
    _inheritsLoose(Timeline2, _Animation);
    function Timeline2(vars, position) {
      var _this;
      if (vars === void 0) {
        vars = {};
      }
      _this = _Animation.call(this, vars) || this;
      _this.labels = {};
      _this.smoothChildTiming = !!vars.smoothChildTiming;
      _this.autoRemoveChildren = !!vars.autoRemoveChildren;
      _this._sort = _isNotFalse(vars.sortChildren);
      _globalTimeline && _addToTimeline(vars.parent || _globalTimeline, _assertThisInitialized(_this), position);
      vars.reversed && _this.reverse();
      vars.paused && _this.paused(true);
      vars.scrollTrigger && _scrollTrigger(_assertThisInitialized(_this), vars.scrollTrigger);
      return _this;
    }
    var _proto2 = Timeline2.prototype;
    _proto2.to = function to(targets, vars, position) {
      _createTweenType(0, arguments, this);
      return this;
    };
    _proto2.from = function from(targets, vars, position) {
      _createTweenType(1, arguments, this);
      return this;
    };
    _proto2.fromTo = function fromTo(targets, fromVars, toVars, position) {
      _createTweenType(2, arguments, this);
      return this;
    };
    _proto2.set = function set(targets, vars, position) {
      vars.duration = 0;
      vars.parent = this;
      _inheritDefaults(vars).repeatDelay || (vars.repeat = 0);
      vars.immediateRender = !!vars.immediateRender;
      new Tween(targets, vars, _parsePosition(this, position), 1);
      return this;
    };
    _proto2.call = function call(callback, params, position) {
      return _addToTimeline(this, Tween.delayedCall(0, callback, params), position);
    };
    _proto2.staggerTo = function staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
      vars.duration = duration;
      vars.stagger = vars.stagger || stagger;
      vars.onComplete = onCompleteAll;
      vars.onCompleteParams = onCompleteAllParams;
      vars.parent = this;
      new Tween(targets, vars, _parsePosition(this, position));
      return this;
    };
    _proto2.staggerFrom = function staggerFrom(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
      vars.runBackwards = 1;
      _inheritDefaults(vars).immediateRender = _isNotFalse(vars.immediateRender);
      return this.staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams);
    };
    _proto2.staggerFromTo = function staggerFromTo(targets, duration, fromVars, toVars, stagger, position, onCompleteAll, onCompleteAllParams) {
      toVars.startAt = fromVars;
      _inheritDefaults(toVars).immediateRender = _isNotFalse(toVars.immediateRender);
      return this.staggerTo(targets, duration, toVars, stagger, position, onCompleteAll, onCompleteAllParams);
    };
    _proto2.render = function render3(totalTime, suppressEvents, force) {
      var prevTime = this._time, tDur = this._dirty ? this.totalDuration() : this._tDur, dur = this._dur, tTime = totalTime <= 0 ? 0 : _roundPrecise(totalTime), crossingStart = this._zTime < 0 !== totalTime < 0 && (this._initted || !dur), time, child, next, iteration, cycleDuration, prevPaused, pauseTween, timeScale, prevStart, prevIteration, yoyo, isYoyo;
      this !== _globalTimeline && tTime > tDur && totalTime >= 0 && (tTime = tDur);
      if (tTime !== this._tTime || force || crossingStart) {
        if (prevTime !== this._time && dur) {
          tTime += this._time - prevTime;
          totalTime += this._time - prevTime;
        }
        time = tTime;
        prevStart = this._start;
        timeScale = this._ts;
        prevPaused = !timeScale;
        if (crossingStart) {
          dur || (prevTime = this._zTime);
          (totalTime || !suppressEvents) && (this._zTime = totalTime);
        }
        if (this._repeat) {
          yoyo = this._yoyo;
          cycleDuration = dur + this._rDelay;
          if (this._repeat < -1 && totalTime < 0) {
            return this.totalTime(cycleDuration * 100 + totalTime, suppressEvents, force);
          }
          time = _roundPrecise(tTime % cycleDuration);
          if (tTime === tDur) {
            iteration = this._repeat;
            time = dur;
          } else {
            prevIteration = _roundPrecise(tTime / cycleDuration);
            iteration = ~~prevIteration;
            if (iteration && iteration === prevIteration) {
              time = dur;
              iteration--;
            }
            time > dur && (time = dur);
          }
          prevIteration = _animationCycle(this._tTime, cycleDuration);
          !prevTime && this._tTime && prevIteration !== iteration && this._tTime - prevIteration * cycleDuration - this._dur <= 0 && (prevIteration = iteration);
          if (yoyo && iteration & 1) {
            time = dur - time;
            isYoyo = 1;
          }
          if (iteration !== prevIteration && !this._lock) {
            var rewinding = yoyo && prevIteration & 1, doesWrap = rewinding === (yoyo && iteration & 1);
            iteration < prevIteration && (rewinding = !rewinding);
            prevTime = rewinding ? 0 : tTime % dur ? dur : tTime;
            this._lock = 1;
            this.render(prevTime || (isYoyo ? 0 : _roundPrecise(iteration * cycleDuration)), suppressEvents, !dur)._lock = 0;
            this._tTime = tTime;
            !suppressEvents && this.parent && _callback(this, "onRepeat");
            this.vars.repeatRefresh && !isYoyo && (this.invalidate()._lock = 1);
            if (prevTime && prevTime !== this._time || prevPaused !== !this._ts || this.vars.onRepeat && !this.parent && !this._act) {
              return this;
            }
            dur = this._dur;
            tDur = this._tDur;
            if (doesWrap) {
              this._lock = 2;
              prevTime = rewinding ? dur : -1e-4;
              this.render(prevTime, true);
              this.vars.repeatRefresh && !isYoyo && this.invalidate();
            }
            this._lock = 0;
            if (!this._ts && !prevPaused) {
              return this;
            }
            _propagateYoyoEase(this, isYoyo);
          }
        }
        if (this._hasPause && !this._forcing && this._lock < 2) {
          pauseTween = _findNextPauseTween(this, _roundPrecise(prevTime), _roundPrecise(time));
          if (pauseTween) {
            tTime -= time - (time = pauseTween._start);
          }
        }
        this._tTime = tTime;
        this._time = time;
        this._act = !timeScale;
        if (!this._initted) {
          this._onUpdate = this.vars.onUpdate;
          this._initted = 1;
          this._zTime = totalTime;
          prevTime = 0;
        }
        if (!prevTime && tTime && !suppressEvents && !prevIteration) {
          _callback(this, "onStart");
          if (this._tTime !== tTime) {
            return this;
          }
        }
        if (time >= prevTime && totalTime >= 0) {
          child = this._first;
          while (child) {
            next = child._next;
            if ((child._act || time >= child._start) && child._ts && pauseTween !== child) {
              if (child.parent !== this) {
                return this.render(totalTime, suppressEvents, force);
              }
              child.render(child._ts > 0 ? (time - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (time - child._start) * child._ts, suppressEvents, force);
              if (time !== this._time || !this._ts && !prevPaused) {
                pauseTween = 0;
                next && (tTime += this._zTime = -_tinyNum);
                break;
              }
            }
            child = next;
          }
        } else {
          child = this._last;
          var adjustedTime = totalTime < 0 ? totalTime : time;
          while (child) {
            next = child._prev;
            if ((child._act || adjustedTime <= child._end) && child._ts && pauseTween !== child) {
              if (child.parent !== this) {
                return this.render(totalTime, suppressEvents, force);
              }
              child.render(child._ts > 0 ? (adjustedTime - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (adjustedTime - child._start) * child._ts, suppressEvents, force || _reverting && _isRevertWorthy(child));
              if (time !== this._time || !this._ts && !prevPaused) {
                pauseTween = 0;
                next && (tTime += this._zTime = adjustedTime ? -_tinyNum : _tinyNum);
                break;
              }
            }
            child = next;
          }
        }
        if (pauseTween && !suppressEvents) {
          this.pause();
          pauseTween.render(time >= prevTime ? 0 : -_tinyNum)._zTime = time >= prevTime ? 1 : -1;
          if (this._ts) {
            this._start = prevStart;
            _setEnd(this);
            return this.render(totalTime, suppressEvents, force);
          }
        }
        this._onUpdate && !suppressEvents && _callback(this, "onUpdate", true);
        if (tTime === tDur && this._tTime >= this.totalDuration() || !tTime && prevTime) {
          if (prevStart === this._start || Math.abs(timeScale) !== Math.abs(this._ts)) {
            if (!this._lock) {
              (totalTime || !dur) && (tTime === tDur && this._ts > 0 || !tTime && this._ts < 0) && _removeFromParent(this, 1);
              if (!suppressEvents && !(totalTime < 0 && !prevTime) && (tTime || prevTime || !tDur)) {
                _callback(this, tTime === tDur && totalTime >= 0 ? "onComplete" : "onReverseComplete", true);
                this._prom && !(tTime < tDur && this.timeScale() > 0) && this._prom();
              }
            }
          }
        }
      }
      return this;
    };
    _proto2.add = function add(child, position) {
      var _this2 = this;
      _isNumber(position) || (position = _parsePosition(this, position, child));
      if (!(child instanceof Animation)) {
        if (_isArray(child)) {
          child.forEach(function(obj) {
            return _this2.add(obj, position);
          });
          return this;
        }
        if (_isString(child)) {
          return this.addLabel(child, position);
        }
        if (_isFunction(child)) {
          child = Tween.delayedCall(0, child);
        } else {
          return this;
        }
      }
      return this !== child ? _addToTimeline(this, child, position) : this;
    };
    _proto2.getChildren = function getChildren(nested, tweens, timelines, ignoreBeforeTime) {
      if (nested === void 0) {
        nested = true;
      }
      if (tweens === void 0) {
        tweens = true;
      }
      if (timelines === void 0) {
        timelines = true;
      }
      if (ignoreBeforeTime === void 0) {
        ignoreBeforeTime = -_bigNum;
      }
      var a2 = [], child = this._first;
      while (child) {
        if (child._start >= ignoreBeforeTime) {
          if (child instanceof Tween) {
            tweens && a2.push(child);
          } else {
            timelines && a2.push(child);
            nested && a2.push.apply(a2, child.getChildren(true, tweens, timelines));
          }
        }
        child = child._next;
      }
      return a2;
    };
    _proto2.getById = function getById2(id) {
      var animations = this.getChildren(1, 1, 1), i2 = animations.length;
      while (i2--) {
        if (animations[i2].vars.id === id) {
          return animations[i2];
        }
      }
    };
    _proto2.remove = function remove(child) {
      if (_isString(child)) {
        return this.removeLabel(child);
      }
      if (_isFunction(child)) {
        return this.killTweensOf(child);
      }
      child.parent === this && _removeLinkedListItem(this, child);
      if (child === this._recent) {
        this._recent = this._last;
      }
      return _uncache(this);
    };
    _proto2.totalTime = function totalTime(_totalTime2, suppressEvents) {
      if (!arguments.length) {
        return this._tTime;
      }
      this._forcing = 1;
      if (!this._dp && this._ts) {
        this._start = _roundPrecise(_ticker.time - (this._ts > 0 ? _totalTime2 / this._ts : (this.totalDuration() - _totalTime2) / -this._ts));
      }
      _Animation.prototype.totalTime.call(this, _totalTime2, suppressEvents);
      this._forcing = 0;
      return this;
    };
    _proto2.addLabel = function addLabel(label, position) {
      this.labels[label] = _parsePosition(this, position);
      return this;
    };
    _proto2.removeLabel = function removeLabel(label) {
      delete this.labels[label];
      return this;
    };
    _proto2.addPause = function addPause(position, callback, params) {
      var t2 = Tween.delayedCall(0, callback || _emptyFunc, params);
      t2.data = "isPause";
      this._hasPause = 1;
      return _addToTimeline(this, t2, _parsePosition(this, position));
    };
    _proto2.removePause = function removePause(position) {
      var child = this._first;
      position = _parsePosition(this, position);
      while (child) {
        if (child._start === position && child.data === "isPause") {
          _removeFromParent(child);
        }
        child = child._next;
      }
    };
    _proto2.killTweensOf = function killTweensOf(targets, props, onlyActive) {
      var tweens = this.getTweensOf(targets, onlyActive), i2 = tweens.length;
      while (i2--) {
        _overwritingTween !== tweens[i2] && tweens[i2].kill(targets, props);
      }
      return this;
    };
    _proto2.getTweensOf = function getTweensOf2(targets, onlyActive) {
      var a2 = [], parsedTargets = toArray(targets), child = this._first, isGlobalTime = _isNumber(onlyActive), children;
      while (child) {
        if (child instanceof Tween) {
          if (_arrayContainsAny(child._targets, parsedTargets) && (isGlobalTime ? (!_overwritingTween || child._initted && child._ts) && child.globalTime(0) <= onlyActive && child.globalTime(child.totalDuration()) > onlyActive : !onlyActive || child.isActive())) {
            a2.push(child);
          }
        } else if ((children = child.getTweensOf(parsedTargets, onlyActive)).length) {
          a2.push.apply(a2, children);
        }
        child = child._next;
      }
      return a2;
    };
    _proto2.tweenTo = function tweenTo(position, vars) {
      vars = vars || {};
      var tl = this, endTime = _parsePosition(tl, position), _vars = vars, startAt = _vars.startAt, _onStart = _vars.onStart, onStartParams = _vars.onStartParams, immediateRender = _vars.immediateRender, initted, tween = Tween.to(tl, _setDefaults({
        ease: vars.ease || "none",
        lazy: false,
        immediateRender: false,
        time: endTime,
        overwrite: "auto",
        duration: vars.duration || Math.abs((endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale()) || _tinyNum,
        onStart: function onStart() {
          tl.pause();
          if (!initted) {
            var duration = vars.duration || Math.abs((endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale());
            tween._dur !== duration && _setDuration(tween, duration, 0, 1).render(tween._time, true, true);
            initted = 1;
          }
          _onStart && _onStart.apply(tween, onStartParams || []);
        }
      }, vars));
      return immediateRender ? tween.render(0) : tween;
    };
    _proto2.tweenFromTo = function tweenFromTo(fromPosition, toPosition, vars) {
      return this.tweenTo(toPosition, _setDefaults({
        startAt: {
          time: _parsePosition(this, fromPosition)
        }
      }, vars));
    };
    _proto2.recent = function recent() {
      return this._recent;
    };
    _proto2.nextLabel = function nextLabel(afterTime) {
      if (afterTime === void 0) {
        afterTime = this._time;
      }
      return _getLabelInDirection(this, _parsePosition(this, afterTime));
    };
    _proto2.previousLabel = function previousLabel(beforeTime) {
      if (beforeTime === void 0) {
        beforeTime = this._time;
      }
      return _getLabelInDirection(this, _parsePosition(this, beforeTime), 1);
    };
    _proto2.currentLabel = function currentLabel(value) {
      return arguments.length ? this.seek(value, true) : this.previousLabel(this._time + _tinyNum);
    };
    _proto2.shiftChildren = function shiftChildren(amount, adjustLabels, ignoreBeforeTime) {
      if (ignoreBeforeTime === void 0) {
        ignoreBeforeTime = 0;
      }
      var child = this._first, labels = this.labels, p2;
      while (child) {
        if (child._start >= ignoreBeforeTime) {
          child._start += amount;
          child._end += amount;
        }
        child = child._next;
      }
      if (adjustLabels) {
        for (p2 in labels) {
          if (labels[p2] >= ignoreBeforeTime) {
            labels[p2] += amount;
          }
        }
      }
      return _uncache(this);
    };
    _proto2.invalidate = function invalidate(soft) {
      var child = this._first;
      this._lock = 0;
      while (child) {
        child.invalidate(soft);
        child = child._next;
      }
      return _Animation.prototype.invalidate.call(this, soft);
    };
    _proto2.clear = function clear(includeLabels) {
      if (includeLabels === void 0) {
        includeLabels = true;
      }
      var child = this._first, next;
      while (child) {
        next = child._next;
        this.remove(child);
        child = next;
      }
      this._dp && (this._time = this._tTime = this._pTime = 0);
      includeLabels && (this.labels = {});
      return _uncache(this);
    };
    _proto2.totalDuration = function totalDuration(value) {
      var max = 0, self = this, child = self._last, prevStart = _bigNum, prev, start, parent;
      if (arguments.length) {
        return self.timeScale((self._repeat < 0 ? self.duration() : self.totalDuration()) / (self.reversed() ? -value : value));
      }
      if (self._dirty) {
        parent = self.parent;
        while (child) {
          prev = child._prev;
          child._dirty && child.totalDuration();
          start = child._start;
          if (start > prevStart && self._sort && child._ts && !self._lock) {
            self._lock = 1;
            _addToTimeline(self, child, start - child._delay, 1)._lock = 0;
          } else {
            prevStart = start;
          }
          if (start < 0 && child._ts) {
            max -= start;
            if (!parent && !self._dp || parent && parent.smoothChildTiming) {
              self._start += start / self._ts;
              self._time -= start;
              self._tTime -= start;
            }
            self.shiftChildren(-start, false, -Infinity);
            prevStart = 0;
          }
          child._end > max && child._ts && (max = child._end);
          child = prev;
        }
        _setDuration(self, self === _globalTimeline && self._time > max ? self._time : max, 1, 1);
        self._dirty = 0;
      }
      return self._tDur;
    };
    Timeline2.updateRoot = function updateRoot(time) {
      if (_globalTimeline._ts) {
        _lazySafeRender(_globalTimeline, _parentToChildTotalTime(time, _globalTimeline));
        _lastRenderedFrame = _ticker.frame;
      }
      if (_ticker.frame >= _nextGCFrame) {
        _nextGCFrame += _config.autoSleep || 120;
        var child = _globalTimeline._first;
        if (!child || !child._ts) {
          if (_config.autoSleep && _ticker._listeners.length < 2) {
            while (child && !child._ts) {
              child = child._next;
            }
            child || _ticker.sleep();
          }
        }
      }
    };
    return Timeline2;
  }(Animation);
  _setDefaults(Timeline.prototype, {
    _lock: 0,
    _hasPause: 0,
    _forcing: 0
  });
  var _addComplexStringPropTween = function _addComplexStringPropTween2(target, prop, start, end, setter, stringFilter, funcParam) {
    var pt = new PropTween(this._pt, target, prop, 0, 1, _renderComplexString, null, setter), index = 0, matchIndex = 0, result, startNums, color, endNum, chunk, startNum, hasRandom, a2;
    pt.b = start;
    pt.e = end;
    start += "";
    end += "";
    if (hasRandom = ~end.indexOf("random(")) {
      end = _replaceRandom(end);
    }
    if (stringFilter) {
      a2 = [start, end];
      stringFilter(a2, target, prop);
      start = a2[0];
      end = a2[1];
    }
    startNums = start.match(_complexStringNumExp) || [];
    while (result = _complexStringNumExp.exec(end)) {
      endNum = result[0];
      chunk = end.substring(index, result.index);
      if (color) {
        color = (color + 1) % 5;
      } else if (chunk.substr(-5) === "rgba(") {
        color = 1;
      }
      if (endNum !== startNums[matchIndex++]) {
        startNum = parseFloat(startNums[matchIndex - 1]) || 0;
        pt._pt = {
          _next: pt._pt,
          p: chunk || matchIndex === 1 ? chunk : ",",
          //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
          s: startNum,
          c: endNum.charAt(1) === "=" ? _parseRelative(startNum, endNum) - startNum : parseFloat(endNum) - startNum,
          m: color && color < 4 ? Math.round : 0
        };
        index = _complexStringNumExp.lastIndex;
      }
    }
    pt.c = index < end.length ? end.substring(index, end.length) : "";
    pt.fp = funcParam;
    if (_relExp.test(end) || hasRandom) {
      pt.e = 0;
    }
    this._pt = pt;
    return pt;
  };
  var _addPropTween = function _addPropTween2(target, prop, start, end, index, targets, modifier, stringFilter, funcParam, optional) {
    _isFunction(end) && (end = end(index || 0, target, targets));
    var currentValue = target[prop], parsedStart = start !== "get" ? start : !_isFunction(currentValue) ? currentValue : funcParam ? target[prop.indexOf("set") || !_isFunction(target["get" + prop.substr(3)]) ? prop : "get" + prop.substr(3)](funcParam) : target[prop](), setter = !_isFunction(currentValue) ? _setterPlain : funcParam ? _setterFuncWithParam : _setterFunc, pt;
    if (_isString(end)) {
      if (~end.indexOf("random(")) {
        end = _replaceRandom(end);
      }
      if (end.charAt(1) === "=") {
        pt = _parseRelative(parsedStart, end) + (getUnit(parsedStart) || 0);
        if (pt || pt === 0) {
          end = pt;
        }
      }
    }
    if (!optional || parsedStart !== end || _forceAllPropTweens) {
      if (!isNaN(parsedStart * end) && end !== "") {
        pt = new PropTween(this._pt, target, prop, +parsedStart || 0, end - (parsedStart || 0), typeof currentValue === "boolean" ? _renderBoolean : _renderPlain, 0, setter);
        funcParam && (pt.fp = funcParam);
        modifier && pt.modifier(modifier, this, target);
        return this._pt = pt;
      }
      !currentValue && !(prop in target) && _missingPlugin(prop, end);
      return _addComplexStringPropTween.call(this, target, prop, parsedStart, end, setter, stringFilter || _config.stringFilter, funcParam);
    }
  };
  var _processVars = function _processVars2(vars, index, target, targets, tween) {
    _isFunction(vars) && (vars = _parseFuncOrString(vars, tween, index, target, targets));
    if (!_isObject(vars) || vars.style && vars.nodeType || _isArray(vars) || _isTypedArray(vars)) {
      return _isString(vars) ? _parseFuncOrString(vars, tween, index, target, targets) : vars;
    }
    var copy = {}, p2;
    for (p2 in vars) {
      copy[p2] = _parseFuncOrString(vars[p2], tween, index, target, targets);
    }
    return copy;
  };
  var _checkPlugin = function _checkPlugin2(property, vars, tween, index, target, targets) {
    var plugin, pt, ptLookup, i2;
    if (_plugins[property] && (plugin = new _plugins[property]()).init(target, plugin.rawVars ? vars[property] : _processVars(vars[property], index, target, targets, tween), tween, index, targets) !== false) {
      tween._pt = pt = new PropTween(tween._pt, target, property, 0, 1, plugin.render, plugin, 0, plugin.priority);
      if (tween !== _quickTween) {
        ptLookup = tween._ptLookup[tween._targets.indexOf(target)];
        i2 = plugin._props.length;
        while (i2--) {
          ptLookup[plugin._props[i2]] = pt;
        }
      }
    }
    return plugin;
  };
  var _overwritingTween;
  var _forceAllPropTweens;
  var _initTween = function _initTween2(tween, time, tTime) {
    var vars = tween.vars, ease = vars.ease, startAt = vars.startAt, immediateRender = vars.immediateRender, lazy = vars.lazy, onUpdate = vars.onUpdate, runBackwards = vars.runBackwards, yoyoEase = vars.yoyoEase, keyframes = vars.keyframes, autoRevert = vars.autoRevert, dur = tween._dur, prevStartAt = tween._startAt, targets = tween._targets, parent = tween.parent, fullTargets = parent && parent.data === "nested" ? parent.vars.targets : targets, autoOverwrite = tween._overwrite === "auto" && !_suppressOverwrites, tl = tween.timeline, cleanVars, i2, p2, pt, target, hasPriority, gsData, harness, plugin, ptLookup, index, harnessVars, overwritten;
    tl && (!keyframes || !ease) && (ease = "none");
    tween._ease = _parseEase(ease, _defaults.ease);
    tween._yEase = yoyoEase ? _invertEase(_parseEase(yoyoEase === true ? ease : yoyoEase, _defaults.ease)) : 0;
    if (yoyoEase && tween._yoyo && !tween._repeat) {
      yoyoEase = tween._yEase;
      tween._yEase = tween._ease;
      tween._ease = yoyoEase;
    }
    tween._from = !tl && !!vars.runBackwards;
    if (!tl || keyframes && !vars.stagger) {
      harness = targets[0] ? _getCache(targets[0]).harness : 0;
      harnessVars = harness && vars[harness.prop];
      cleanVars = _copyExcluding(vars, _reservedProps);
      if (prevStartAt) {
        prevStartAt._zTime < 0 && prevStartAt.progress(1);
        time < 0 && runBackwards && immediateRender && !autoRevert ? prevStartAt.render(-1, true) : prevStartAt.revert(runBackwards && dur ? _revertConfigNoKill : _startAtRevertConfig);
        prevStartAt._lazy = 0;
      }
      if (startAt) {
        _removeFromParent(tween._startAt = Tween.set(targets, _setDefaults({
          data: "isStart",
          overwrite: false,
          parent,
          immediateRender: true,
          lazy: !prevStartAt && _isNotFalse(lazy),
          startAt: null,
          delay: 0,
          onUpdate: onUpdate && function() {
            return _callback(tween, "onUpdate");
          },
          stagger: 0
        }, startAt)));
        tween._startAt._dp = 0;
        tween._startAt._sat = tween;
        time < 0 && (_reverting || !immediateRender && !autoRevert) && tween._startAt.revert(_revertConfigNoKill);
        if (immediateRender) {
          if (dur && time <= 0 && tTime <= 0) {
            time && (tween._zTime = time);
            return;
          }
        }
      } else if (runBackwards && dur) {
        if (!prevStartAt) {
          time && (immediateRender = false);
          p2 = _setDefaults({
            overwrite: false,
            data: "isFromStart",
            //we tag the tween with as "isFromStart" so that if [inside a plugin] we need to only do something at the very END of a tween, we have a way of identifying this tween as merely the one that's setting the beginning values for a "from()" tween. For example, clearProps in CSSPlugin should only get applied at the very END of a tween and without this tag, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in.
            lazy: immediateRender && !prevStartAt && _isNotFalse(lazy),
            immediateRender,
            //zero-duration tweens render immediately by default, but if we're not specifically instructed to render this tween immediately, we should skip this and merely _init() to record the starting values (rendering them immediately would push them to completion which is wasteful in that case - we'd have to render(-1) immediately after)
            stagger: 0,
            parent
            //ensures that nested tweens that had a stagger are handled properly, like gsap.from(".class", {y: gsap.utils.wrap([-100,100]), stagger: 0.5})
          }, cleanVars);
          harnessVars && (p2[harness.prop] = harnessVars);
          _removeFromParent(tween._startAt = Tween.set(targets, p2));
          tween._startAt._dp = 0;
          tween._startAt._sat = tween;
          time < 0 && (_reverting ? tween._startAt.revert(_revertConfigNoKill) : tween._startAt.render(-1, true));
          tween._zTime = time;
          if (!immediateRender) {
            _initTween2(tween._startAt, _tinyNum, _tinyNum);
          } else if (!time) {
            return;
          }
        }
      }
      tween._pt = tween._ptCache = 0;
      lazy = dur && _isNotFalse(lazy) || lazy && !dur;
      for (i2 = 0; i2 < targets.length; i2++) {
        target = targets[i2];
        gsData = target._gsap || _harness(targets)[i2]._gsap;
        tween._ptLookup[i2] = ptLookup = {};
        _lazyLookup[gsData.id] && _lazyTweens.length && _lazyRender();
        index = fullTargets === targets ? i2 : fullTargets.indexOf(target);
        if (harness && (plugin = new harness()).init(target, harnessVars || cleanVars, tween, index, fullTargets) !== false) {
          tween._pt = pt = new PropTween(tween._pt, target, plugin.name, 0, 1, plugin.render, plugin, 0, plugin.priority);
          plugin._props.forEach(function(name) {
            ptLookup[name] = pt;
          });
          plugin.priority && (hasPriority = 1);
        }
        if (!harness || harnessVars) {
          for (p2 in cleanVars) {
            if (_plugins[p2] && (plugin = _checkPlugin(p2, cleanVars, tween, index, target, fullTargets))) {
              plugin.priority && (hasPriority = 1);
            } else {
              ptLookup[p2] = pt = _addPropTween.call(tween, target, p2, "get", cleanVars[p2], index, fullTargets, 0, vars.stringFilter);
            }
          }
        }
        tween._op && tween._op[i2] && tween.kill(target, tween._op[i2]);
        if (autoOverwrite && tween._pt) {
          _overwritingTween = tween;
          _globalTimeline.killTweensOf(target, ptLookup, tween.globalTime(time));
          overwritten = !tween.parent;
          _overwritingTween = 0;
        }
        tween._pt && lazy && (_lazyLookup[gsData.id] = 1);
      }
      hasPriority && _sortPropTweensByPriority(tween);
      tween._onInit && tween._onInit(tween);
    }
    tween._onUpdate = onUpdate;
    tween._initted = (!tween._op || tween._pt) && !overwritten;
    keyframes && time <= 0 && tl.render(_bigNum, true, true);
  };
  var _updatePropTweens = function _updatePropTweens2(tween, property, value, start, startIsRelative, ratio, time, skipRecursion) {
    var ptCache = (tween._pt && tween._ptCache || (tween._ptCache = {}))[property], pt, rootPT, lookup, i2;
    if (!ptCache) {
      ptCache = tween._ptCache[property] = [];
      lookup = tween._ptLookup;
      i2 = tween._targets.length;
      while (i2--) {
        pt = lookup[i2][property];
        if (pt && pt.d && pt.d._pt) {
          pt = pt.d._pt;
          while (pt && pt.p !== property && pt.fp !== property) {
            pt = pt._next;
          }
        }
        if (!pt) {
          _forceAllPropTweens = 1;
          tween.vars[property] = "+=0";
          _initTween(tween, time);
          _forceAllPropTweens = 0;
          return skipRecursion ? _warn(property + " not eligible for reset") : 1;
        }
        ptCache.push(pt);
      }
    }
    i2 = ptCache.length;
    while (i2--) {
      rootPT = ptCache[i2];
      pt = rootPT._pt || rootPT;
      pt.s = (start || start === 0) && !startIsRelative ? start : pt.s + (start || 0) + ratio * pt.c;
      pt.c = value - pt.s;
      rootPT.e && (rootPT.e = _round(value) + getUnit(rootPT.e));
      rootPT.b && (rootPT.b = pt.s + getUnit(rootPT.b));
    }
  };
  var _addAliasesToVars = function _addAliasesToVars2(targets, vars) {
    var harness = targets[0] ? _getCache(targets[0]).harness : 0, propertyAliases = harness && harness.aliases, copy, p2, i2, aliases;
    if (!propertyAliases) {
      return vars;
    }
    copy = _merge({}, vars);
    for (p2 in propertyAliases) {
      if (p2 in copy) {
        aliases = propertyAliases[p2].split(",");
        i2 = aliases.length;
        while (i2--) {
          copy[aliases[i2]] = copy[p2];
        }
      }
    }
    return copy;
  };
  var _parseKeyframe = function _parseKeyframe2(prop, obj, allProps, easeEach) {
    var ease = obj.ease || easeEach || "power1.inOut", p2, a2;
    if (_isArray(obj)) {
      a2 = allProps[prop] || (allProps[prop] = []);
      obj.forEach(function(value, i2) {
        return a2.push({
          t: i2 / (obj.length - 1) * 100,
          v: value,
          e: ease
        });
      });
    } else {
      for (p2 in obj) {
        a2 = allProps[p2] || (allProps[p2] = []);
        p2 === "ease" || a2.push({
          t: parseFloat(prop),
          v: obj[p2],
          e: ease
        });
      }
    }
  };
  var _parseFuncOrString = function _parseFuncOrString2(value, tween, i2, target, targets) {
    return _isFunction(value) ? value.call(tween, i2, target, targets) : _isString(value) && ~value.indexOf("random(") ? _replaceRandom(value) : value;
  };
  var _staggerTweenProps = _callbackNames + "repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,autoRevert";
  var _staggerPropsToSkip = {};
  _forEachName(_staggerTweenProps + ",id,stagger,delay,duration,paused,scrollTrigger", function(name) {
    return _staggerPropsToSkip[name] = 1;
  });
  var Tween = /* @__PURE__ */ function(_Animation2) {
    _inheritsLoose(Tween2, _Animation2);
    function Tween2(targets, vars, position, skipInherit) {
      var _this3;
      if (typeof vars === "number") {
        position.duration = vars;
        vars = position;
        position = null;
      }
      _this3 = _Animation2.call(this, skipInherit ? vars : _inheritDefaults(vars)) || this;
      var _this3$vars = _this3.vars, duration = _this3$vars.duration, delay = _this3$vars.delay, immediateRender = _this3$vars.immediateRender, stagger = _this3$vars.stagger, overwrite = _this3$vars.overwrite, keyframes = _this3$vars.keyframes, defaults2 = _this3$vars.defaults, scrollTrigger = _this3$vars.scrollTrigger, yoyoEase = _this3$vars.yoyoEase, parent = vars.parent || _globalTimeline, parsedTargets = (_isArray(targets) || _isTypedArray(targets) ? _isNumber(targets[0]) : "length" in vars) ? [targets] : toArray(targets), tl, i2, copy, l2, p2, curTarget, staggerFunc, staggerVarsToMerge;
      _this3._targets = parsedTargets.length ? _harness(parsedTargets) : _warn("GSAP target " + targets + " not found. https://gsap.com", !_config.nullTargetWarn) || [];
      _this3._ptLookup = [];
      _this3._overwrite = overwrite;
      if (keyframes || stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
        vars = _this3.vars;
        tl = _this3.timeline = new Timeline({
          data: "nested",
          defaults: defaults2 || {},
          targets: parent && parent.data === "nested" ? parent.vars.targets : parsedTargets
        });
        tl.kill();
        tl.parent = tl._dp = _assertThisInitialized(_this3);
        tl._start = 0;
        if (stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
          l2 = parsedTargets.length;
          staggerFunc = stagger && distribute(stagger);
          if (_isObject(stagger)) {
            for (p2 in stagger) {
              if (~_staggerTweenProps.indexOf(p2)) {
                staggerVarsToMerge || (staggerVarsToMerge = {});
                staggerVarsToMerge[p2] = stagger[p2];
              }
            }
          }
          for (i2 = 0; i2 < l2; i2++) {
            copy = _copyExcluding(vars, _staggerPropsToSkip);
            copy.stagger = 0;
            yoyoEase && (copy.yoyoEase = yoyoEase);
            staggerVarsToMerge && _merge(copy, staggerVarsToMerge);
            curTarget = parsedTargets[i2];
            copy.duration = +_parseFuncOrString(duration, _assertThisInitialized(_this3), i2, curTarget, parsedTargets);
            copy.delay = (+_parseFuncOrString(delay, _assertThisInitialized(_this3), i2, curTarget, parsedTargets) || 0) - _this3._delay;
            if (!stagger && l2 === 1 && copy.delay) {
              _this3._delay = delay = copy.delay;
              _this3._start += delay;
              copy.delay = 0;
            }
            tl.to(curTarget, copy, staggerFunc ? staggerFunc(i2, curTarget, parsedTargets) : 0);
            tl._ease = _easeMap.none;
          }
          tl.duration() ? duration = delay = 0 : _this3.timeline = 0;
        } else if (keyframes) {
          _inheritDefaults(_setDefaults(tl.vars.defaults, {
            ease: "none"
          }));
          tl._ease = _parseEase(keyframes.ease || vars.ease || "none");
          var time = 0, a2, kf, v;
          if (_isArray(keyframes)) {
            keyframes.forEach(function(frame) {
              return tl.to(parsedTargets, frame, ">");
            });
            tl.duration();
          } else {
            copy = {};
            for (p2 in keyframes) {
              p2 === "ease" || p2 === "easeEach" || _parseKeyframe(p2, keyframes[p2], copy, keyframes.easeEach);
            }
            for (p2 in copy) {
              a2 = copy[p2].sort(function(a3, b) {
                return a3.t - b.t;
              });
              time = 0;
              for (i2 = 0; i2 < a2.length; i2++) {
                kf = a2[i2];
                v = {
                  ease: kf.e,
                  duration: (kf.t - (i2 ? a2[i2 - 1].t : 0)) / 100 * duration
                };
                v[p2] = kf.v;
                tl.to(parsedTargets, v, time);
                time += v.duration;
              }
            }
            tl.duration() < duration && tl.to({}, {
              duration: duration - tl.duration()
            });
          }
        }
        duration || _this3.duration(duration = tl.duration());
      } else {
        _this3.timeline = 0;
      }
      if (overwrite === true && !_suppressOverwrites) {
        _overwritingTween = _assertThisInitialized(_this3);
        _globalTimeline.killTweensOf(parsedTargets);
        _overwritingTween = 0;
      }
      _addToTimeline(parent, _assertThisInitialized(_this3), position);
      vars.reversed && _this3.reverse();
      vars.paused && _this3.paused(true);
      if (immediateRender || !duration && !keyframes && _this3._start === _roundPrecise(parent._time) && _isNotFalse(immediateRender) && _hasNoPausedAncestors(_assertThisInitialized(_this3)) && parent.data !== "nested") {
        _this3._tTime = -_tinyNum;
        _this3.render(Math.max(0, -delay) || 0);
      }
      scrollTrigger && _scrollTrigger(_assertThisInitialized(_this3), scrollTrigger);
      return _this3;
    }
    var _proto3 = Tween2.prototype;
    _proto3.render = function render3(totalTime, suppressEvents, force) {
      var prevTime = this._time, tDur = this._tDur, dur = this._dur, isNegative = totalTime < 0, tTime = totalTime > tDur - _tinyNum && !isNegative ? tDur : totalTime < _tinyNum ? 0 : totalTime, time, pt, iteration, cycleDuration, prevIteration, isYoyo, ratio, timeline2, yoyoEase;
      if (!dur) {
        _renderZeroDurationTween(this, totalTime, suppressEvents, force);
      } else if (tTime !== this._tTime || !totalTime || force || !this._initted && this._tTime || this._startAt && this._zTime < 0 !== isNegative || this._lazy) {
        time = tTime;
        timeline2 = this.timeline;
        if (this._repeat) {
          cycleDuration = dur + this._rDelay;
          if (this._repeat < -1 && isNegative) {
            return this.totalTime(cycleDuration * 100 + totalTime, suppressEvents, force);
          }
          time = _roundPrecise(tTime % cycleDuration);
          if (tTime === tDur) {
            iteration = this._repeat;
            time = dur;
          } else {
            prevIteration = _roundPrecise(tTime / cycleDuration);
            iteration = ~~prevIteration;
            if (iteration && iteration === prevIteration) {
              time = dur;
              iteration--;
            } else if (time > dur) {
              time = dur;
            }
          }
          isYoyo = this._yoyo && iteration & 1;
          if (isYoyo) {
            yoyoEase = this._yEase;
            time = dur - time;
          }
          prevIteration = _animationCycle(this._tTime, cycleDuration);
          if (time === prevTime && !force && this._initted && iteration === prevIteration) {
            this._tTime = tTime;
            return this;
          }
          if (iteration !== prevIteration) {
            timeline2 && this._yEase && _propagateYoyoEase(timeline2, isYoyo);
            if (this.vars.repeatRefresh && !isYoyo && !this._lock && time !== cycleDuration && this._initted) {
              this._lock = force = 1;
              this.render(_roundPrecise(cycleDuration * iteration), true).invalidate()._lock = 0;
            }
          }
        }
        if (!this._initted) {
          if (_attemptInitTween(this, isNegative ? totalTime : time, force, suppressEvents, tTime)) {
            this._tTime = 0;
            return this;
          }
          if (prevTime !== this._time && !(force && this.vars.repeatRefresh && iteration !== prevIteration)) {
            return this;
          }
          if (dur !== this._dur) {
            return this.render(totalTime, suppressEvents, force);
          }
        }
        this._tTime = tTime;
        this._time = time;
        if (!this._act && this._ts) {
          this._act = 1;
          this._lazy = 0;
        }
        this.ratio = ratio = (yoyoEase || this._ease)(time / dur);
        if (this._from) {
          this.ratio = ratio = 1 - ratio;
        }
        if (!prevTime && tTime && !suppressEvents && !prevIteration) {
          _callback(this, "onStart");
          if (this._tTime !== tTime) {
            return this;
          }
        }
        pt = this._pt;
        while (pt) {
          pt.r(ratio, pt.d);
          pt = pt._next;
        }
        timeline2 && timeline2.render(totalTime < 0 ? totalTime : timeline2._dur * timeline2._ease(time / this._dur), suppressEvents, force) || this._startAt && (this._zTime = totalTime);
        if (this._onUpdate && !suppressEvents) {
          isNegative && _rewindStartAt(this, totalTime, suppressEvents, force);
          _callback(this, "onUpdate");
        }
        this._repeat && iteration !== prevIteration && this.vars.onRepeat && !suppressEvents && this.parent && _callback(this, "onRepeat");
        if ((tTime === this._tDur || !tTime) && this._tTime === tTime) {
          isNegative && !this._onUpdate && _rewindStartAt(this, totalTime, true, true);
          (totalTime || !dur) && (tTime === this._tDur && this._ts > 0 || !tTime && this._ts < 0) && _removeFromParent(this, 1);
          if (!suppressEvents && !(isNegative && !prevTime) && (tTime || prevTime || isYoyo)) {
            _callback(this, tTime === tDur ? "onComplete" : "onReverseComplete", true);
            this._prom && !(tTime < tDur && this.timeScale() > 0) && this._prom();
          }
        }
      }
      return this;
    };
    _proto3.targets = function targets() {
      return this._targets;
    };
    _proto3.invalidate = function invalidate(soft) {
      (!soft || !this.vars.runBackwards) && (this._startAt = 0);
      this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0;
      this._ptLookup = [];
      this.timeline && this.timeline.invalidate(soft);
      return _Animation2.prototype.invalidate.call(this, soft);
    };
    _proto3.resetTo = function resetTo(property, value, start, startIsRelative, skipRecursion) {
      _tickerActive || _ticker.wake();
      this._ts || this.play();
      var time = Math.min(this._dur, (this._dp._time - this._start) * this._ts), ratio;
      this._initted || _initTween(this, time);
      ratio = this._ease(time / this._dur);
      if (_updatePropTweens(this, property, value, start, startIsRelative, ratio, time, skipRecursion)) {
        return this.resetTo(property, value, start, startIsRelative, 1);
      }
      _alignPlayhead(this, 0);
      this.parent || _addLinkedListItem(this._dp, this, "_first", "_last", this._dp._sort ? "_start" : 0);
      return this.render(0);
    };
    _proto3.kill = function kill(targets, vars) {
      if (vars === void 0) {
        vars = "all";
      }
      if (!targets && (!vars || vars === "all")) {
        this._lazy = this._pt = 0;
        this.parent ? _interrupt(this) : this.scrollTrigger && this.scrollTrigger.kill(!!_reverting);
        return this;
      }
      if (this.timeline) {
        var tDur = this.timeline.totalDuration();
        this.timeline.killTweensOf(targets, vars, _overwritingTween && _overwritingTween.vars.overwrite !== true)._first || _interrupt(this);
        this.parent && tDur !== this.timeline.totalDuration() && _setDuration(this, this._dur * this.timeline._tDur / tDur, 0, 1);
        return this;
      }
      var parsedTargets = this._targets, killingTargets = targets ? toArray(targets) : parsedTargets, propTweenLookup = this._ptLookup, firstPT = this._pt, overwrittenProps, curLookup, curOverwriteProps, props, p2, pt, i2;
      if ((!vars || vars === "all") && _arraysMatch(parsedTargets, killingTargets)) {
        vars === "all" && (this._pt = 0);
        return _interrupt(this);
      }
      overwrittenProps = this._op = this._op || [];
      if (vars !== "all") {
        if (_isString(vars)) {
          p2 = {};
          _forEachName(vars, function(name) {
            return p2[name] = 1;
          });
          vars = p2;
        }
        vars = _addAliasesToVars(parsedTargets, vars);
      }
      i2 = parsedTargets.length;
      while (i2--) {
        if (~killingTargets.indexOf(parsedTargets[i2])) {
          curLookup = propTweenLookup[i2];
          if (vars === "all") {
            overwrittenProps[i2] = vars;
            props = curLookup;
            curOverwriteProps = {};
          } else {
            curOverwriteProps = overwrittenProps[i2] = overwrittenProps[i2] || {};
            props = vars;
          }
          for (p2 in props) {
            pt = curLookup && curLookup[p2];
            if (pt) {
              if (!("kill" in pt.d) || pt.d.kill(p2) === true) {
                _removeLinkedListItem(this, pt, "_pt");
              }
              delete curLookup[p2];
            }
            if (curOverwriteProps !== "all") {
              curOverwriteProps[p2] = 1;
            }
          }
        }
      }
      this._initted && !this._pt && firstPT && _interrupt(this);
      return this;
    };
    Tween2.to = function to(targets, vars) {
      return new Tween2(targets, vars, arguments[2]);
    };
    Tween2.from = function from(targets, vars) {
      return _createTweenType(1, arguments);
    };
    Tween2.delayedCall = function delayedCall(delay, callback, params, scope) {
      return new Tween2(callback, 0, {
        immediateRender: false,
        lazy: false,
        overwrite: false,
        delay,
        onComplete: callback,
        onReverseComplete: callback,
        onCompleteParams: params,
        onReverseCompleteParams: params,
        callbackScope: scope
      });
    };
    Tween2.fromTo = function fromTo(targets, fromVars, toVars) {
      return _createTweenType(2, arguments);
    };
    Tween2.set = function set(targets, vars) {
      vars.duration = 0;
      vars.repeatDelay || (vars.repeat = 0);
      return new Tween2(targets, vars);
    };
    Tween2.killTweensOf = function killTweensOf(targets, props, onlyActive) {
      return _globalTimeline.killTweensOf(targets, props, onlyActive);
    };
    return Tween2;
  }(Animation);
  _setDefaults(Tween.prototype, {
    _targets: [],
    _lazy: 0,
    _startAt: 0,
    _op: 0,
    _onInit: 0
  });
  _forEachName("staggerTo,staggerFrom,staggerFromTo", function(name) {
    Tween[name] = function() {
      var tl = new Timeline(), params = _slice.call(arguments, 0);
      params.splice(name === "staggerFromTo" ? 5 : 4, 0, 0);
      return tl[name].apply(tl, params);
    };
  });
  var _setterPlain = function _setterPlain2(target, property, value) {
    return target[property] = value;
  };
  var _setterFunc = function _setterFunc2(target, property, value) {
    return target[property](value);
  };
  var _setterFuncWithParam = function _setterFuncWithParam2(target, property, value, data) {
    return target[property](data.fp, value);
  };
  var _setterAttribute = function _setterAttribute2(target, property, value) {
    return target.setAttribute(property, value);
  };
  var _getSetter = function _getSetter2(target, property) {
    return _isFunction(target[property]) ? _setterFunc : _isUndefined(target[property]) && target.setAttribute ? _setterAttribute : _setterPlain;
  };
  var _renderPlain = function _renderPlain2(ratio, data) {
    return data.set(data.t, data.p, Math.round((data.s + data.c * ratio) * 1e6) / 1e6, data);
  };
  var _renderBoolean = function _renderBoolean2(ratio, data) {
    return data.set(data.t, data.p, !!(data.s + data.c * ratio), data);
  };
  var _renderComplexString = function _renderComplexString2(ratio, data) {
    var pt = data._pt, s2 = "";
    if (!ratio && data.b) {
      s2 = data.b;
    } else if (ratio === 1 && data.e) {
      s2 = data.e;
    } else {
      while (pt) {
        s2 = pt.p + (pt.m ? pt.m(pt.s + pt.c * ratio) : Math.round((pt.s + pt.c * ratio) * 1e4) / 1e4) + s2;
        pt = pt._next;
      }
      s2 += data.c;
    }
    data.set(data.t, data.p, s2, data);
  };
  var _renderPropTweens = function _renderPropTweens2(ratio, data) {
    var pt = data._pt;
    while (pt) {
      pt.r(ratio, pt.d);
      pt = pt._next;
    }
  };
  var _addPluginModifier = function _addPluginModifier2(modifier, tween, target, property) {
    var pt = this._pt, next;
    while (pt) {
      next = pt._next;
      pt.p === property && pt.modifier(modifier, tween, target);
      pt = next;
    }
  };
  var _killPropTweensOf = function _killPropTweensOf2(property) {
    var pt = this._pt, hasNonDependentRemaining, next;
    while (pt) {
      next = pt._next;
      if (pt.p === property && !pt.op || pt.op === property) {
        _removeLinkedListItem(this, pt, "_pt");
      } else if (!pt.dep) {
        hasNonDependentRemaining = 1;
      }
      pt = next;
    }
    return !hasNonDependentRemaining;
  };
  var _setterWithModifier = function _setterWithModifier2(target, property, value, data) {
    data.mSet(target, property, data.m.call(data.tween, value, data.mt), data);
  };
  var _sortPropTweensByPriority = function _sortPropTweensByPriority2(parent) {
    var pt = parent._pt, next, pt2, first, last;
    while (pt) {
      next = pt._next;
      pt2 = first;
      while (pt2 && pt2.pr > pt.pr) {
        pt2 = pt2._next;
      }
      if (pt._prev = pt2 ? pt2._prev : last) {
        pt._prev._next = pt;
      } else {
        first = pt;
      }
      if (pt._next = pt2) {
        pt2._prev = pt;
      } else {
        last = pt;
      }
      pt = next;
    }
    parent._pt = first;
  };
  var PropTween = /* @__PURE__ */ function() {
    function PropTween2(next, target, prop, start, change, renderer, data, setter, priority) {
      this.t = target;
      this.s = start;
      this.c = change;
      this.p = prop;
      this.r = renderer || _renderPlain;
      this.d = data || this;
      this.set = setter || _setterPlain;
      this.pr = priority || 0;
      this._next = next;
      if (next) {
        next._prev = this;
      }
    }
    var _proto4 = PropTween2.prototype;
    _proto4.modifier = function modifier(func, tween, target) {
      this.mSet = this.mSet || this.set;
      this.set = _setterWithModifier;
      this.m = func;
      this.mt = target;
      this.tween = tween;
    };
    return PropTween2;
  }();
  _forEachName(_callbackNames + "parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger", function(name) {
    return _reservedProps[name] = 1;
  });
  _globals.TweenMax = _globals.TweenLite = Tween;
  _globals.TimelineLite = _globals.TimelineMax = Timeline;
  _globalTimeline = new Timeline({
    sortChildren: false,
    defaults: _defaults,
    autoRemoveChildren: true,
    id: "root",
    smoothChildTiming: true
  });
  _config.stringFilter = _colorStringFilter;
  var _media = [];
  var _listeners = {};
  var _emptyArray = [];
  var _lastMediaTime = 0;
  var _contextID = 0;
  var _dispatch = function _dispatch2(type) {
    return (_listeners[type] || _emptyArray).map(function(f2) {
      return f2();
    });
  };
  var _onMediaChange = function _onMediaChange2() {
    var time = Date.now(), matches = [];
    if (time - _lastMediaTime > 2) {
      _dispatch("matchMediaInit");
      _media.forEach(function(c2) {
        var queries = c2.queries, conditions = c2.conditions, match, p2, anyMatch, toggled;
        for (p2 in queries) {
          match = _win.matchMedia(queries[p2]).matches;
          match && (anyMatch = 1);
          if (match !== conditions[p2]) {
            conditions[p2] = match;
            toggled = 1;
          }
        }
        if (toggled) {
          c2.revert();
          anyMatch && matches.push(c2);
        }
      });
      _dispatch("matchMediaRevert");
      matches.forEach(function(c2) {
        return c2.onMatch(c2, function(func) {
          return c2.add(null, func);
        });
      });
      _lastMediaTime = time;
      _dispatch("matchMedia");
    }
  };
  var Context = /* @__PURE__ */ function() {
    function Context2(func, scope) {
      this.selector = scope && selector(scope);
      this.data = [];
      this._r = [];
      this.isReverted = false;
      this.id = _contextID++;
      func && this.add(func);
    }
    var _proto5 = Context2.prototype;
    _proto5.add = function add(name, func, scope) {
      if (_isFunction(name)) {
        scope = func;
        func = name;
        name = _isFunction;
      }
      var self = this, f2 = function f3() {
        var prev = _context, prevSelector = self.selector, result;
        prev && prev !== self && prev.data.push(self);
        scope && (self.selector = selector(scope));
        _context = self;
        result = func.apply(self, arguments);
        _isFunction(result) && self._r.push(result);
        _context = prev;
        self.selector = prevSelector;
        self.isReverted = false;
        return result;
      };
      self.last = f2;
      return name === _isFunction ? f2(self, function(func2) {
        return self.add(null, func2);
      }) : name ? self[name] = f2 : f2;
    };
    _proto5.ignore = function ignore(func) {
      var prev = _context;
      _context = null;
      func(this);
      _context = prev;
    };
    _proto5.getTweens = function getTweens() {
      var a2 = [];
      this.data.forEach(function(e2) {
        return e2 instanceof Context2 ? a2.push.apply(a2, e2.getTweens()) : e2 instanceof Tween && !(e2.parent && e2.parent.data === "nested") && a2.push(e2);
      });
      return a2;
    };
    _proto5.clear = function clear() {
      this._r.length = this.data.length = 0;
    };
    _proto5.kill = function kill(revert, matchMedia2) {
      var _this4 = this;
      if (revert) {
        (function() {
          var tweens = _this4.getTweens(), i3 = _this4.data.length, t2;
          while (i3--) {
            t2 = _this4.data[i3];
            if (t2.data === "isFlip") {
              t2.revert();
              t2.getChildren(true, true, false).forEach(function(tween) {
                return tweens.splice(tweens.indexOf(tween), 1);
              });
            }
          }
          tweens.map(function(t3) {
            return {
              g: t3._dur || t3._delay || t3._sat && !t3._sat.vars.immediateRender ? t3.globalTime(0) : -Infinity,
              t: t3
            };
          }).sort(function(a2, b) {
            return b.g - a2.g || -Infinity;
          }).forEach(function(o2) {
            return o2.t.revert(revert);
          });
          i3 = _this4.data.length;
          while (i3--) {
            t2 = _this4.data[i3];
            if (t2 instanceof Timeline) {
              if (t2.data !== "nested") {
                t2.scrollTrigger && t2.scrollTrigger.revert();
                t2.kill();
              }
            } else {
              !(t2 instanceof Tween) && t2.revert && t2.revert(revert);
            }
          }
          _this4._r.forEach(function(f2) {
            return f2(revert, _this4);
          });
          _this4.isReverted = true;
        })();
      } else {
        this.data.forEach(function(e2) {
          return e2.kill && e2.kill();
        });
      }
      this.clear();
      if (matchMedia2) {
        var i2 = _media.length;
        while (i2--) {
          _media[i2].id === this.id && _media.splice(i2, 1);
        }
      }
    };
    _proto5.revert = function revert(config3) {
      this.kill(config3 || {});
    };
    return Context2;
  }();
  var MatchMedia = /* @__PURE__ */ function() {
    function MatchMedia2(scope) {
      this.contexts = [];
      this.scope = scope;
      _context && _context.data.push(this);
    }
    var _proto6 = MatchMedia2.prototype;
    _proto6.add = function add(conditions, func, scope) {
      _isObject(conditions) || (conditions = {
        matches: conditions
      });
      var context3 = new Context(0, scope || this.scope), cond = context3.conditions = {}, mq, p2, active;
      _context && !context3.selector && (context3.selector = _context.selector);
      this.contexts.push(context3);
      func = context3.add("onMatch", func);
      context3.queries = conditions;
      for (p2 in conditions) {
        if (p2 === "all") {
          active = 1;
        } else {
          mq = _win.matchMedia(conditions[p2]);
          if (mq) {
            _media.indexOf(context3) < 0 && _media.push(context3);
            (cond[p2] = mq.matches) && (active = 1);
            mq.addListener ? mq.addListener(_onMediaChange) : mq.addEventListener("change", _onMediaChange);
          }
        }
      }
      active && func(context3, function(f2) {
        return context3.add(null, f2);
      });
      return this;
    };
    _proto6.revert = function revert(config3) {
      this.kill(config3 || {});
    };
    _proto6.kill = function kill(revert) {
      this.contexts.forEach(function(c2) {
        return c2.kill(revert, true);
      });
    };
    return MatchMedia2;
  }();
  var _gsap = {
    registerPlugin: function registerPlugin() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      args.forEach(function(config3) {
        return _createPlugin(config3);
      });
    },
    timeline: function timeline(vars) {
      return new Timeline(vars);
    },
    getTweensOf: function getTweensOf(targets, onlyActive) {
      return _globalTimeline.getTweensOf(targets, onlyActive);
    },
    getProperty: function getProperty(target, property, unit, uncache) {
      _isString(target) && (target = toArray(target)[0]);
      var getter = _getCache(target || {}).get, format = unit ? _passThrough : _numericIfPossible;
      unit === "native" && (unit = "");
      return !target ? target : !property ? function(property2, unit2, uncache2) {
        return format((_plugins[property2] && _plugins[property2].get || getter)(target, property2, unit2, uncache2));
      } : format((_plugins[property] && _plugins[property].get || getter)(target, property, unit, uncache));
    },
    quickSetter: function quickSetter(target, property, unit) {
      target = toArray(target);
      if (target.length > 1) {
        var setters = target.map(function(t2) {
          return gsap.quickSetter(t2, property, unit);
        }), l2 = setters.length;
        return function(value) {
          var i2 = l2;
          while (i2--) {
            setters[i2](value);
          }
        };
      }
      target = target[0] || {};
      var Plugin = _plugins[property], cache = _getCache(target), p2 = cache.harness && (cache.harness.aliases || {})[property] || property, setter = Plugin ? function(value) {
        var p3 = new Plugin();
        _quickTween._pt = 0;
        p3.init(target, unit ? value + unit : value, _quickTween, 0, [target]);
        p3.render(1, p3);
        _quickTween._pt && _renderPropTweens(1, _quickTween);
      } : cache.set(target, p2);
      return Plugin ? setter : function(value) {
        return setter(target, p2, unit ? value + unit : value, cache, 1);
      };
    },
    quickTo: function quickTo(target, property, vars) {
      var _setDefaults22;
      var tween = gsap.to(target, _setDefaults((_setDefaults22 = {}, _setDefaults22[property] = "+=0.1", _setDefaults22.paused = true, _setDefaults22.stagger = 0, _setDefaults22), vars || {})), func = function func2(value, start, startIsRelative) {
        return tween.resetTo(property, value, start, startIsRelative);
      };
      func.tween = tween;
      return func;
    },
    isTweening: function isTweening(targets) {
      return _globalTimeline.getTweensOf(targets, true).length > 0;
    },
    defaults: function defaults(value) {
      value && value.ease && (value.ease = _parseEase(value.ease, _defaults.ease));
      return _mergeDeep(_defaults, value || {});
    },
    config: function config2(value) {
      return _mergeDeep(_config, value || {});
    },
    registerEffect: function registerEffect(_ref3) {
      var name = _ref3.name, effect = _ref3.effect, plugins = _ref3.plugins, defaults2 = _ref3.defaults, extendTimeline = _ref3.extendTimeline;
      (plugins || "").split(",").forEach(function(pluginName) {
        return pluginName && !_plugins[pluginName] && !_globals[pluginName] && _warn(name + " effect requires " + pluginName + " plugin.");
      });
      _effects[name] = function(targets, vars, tl) {
        return effect(toArray(targets), _setDefaults(vars || {}, defaults2), tl);
      };
      if (extendTimeline) {
        Timeline.prototype[name] = function(targets, vars, position) {
          return this.add(_effects[name](targets, _isObject(vars) ? vars : (position = vars) && {}, this), position);
        };
      }
    },
    registerEase: function registerEase(name, ease) {
      _easeMap[name] = _parseEase(ease);
    },
    parseEase: function parseEase(ease, defaultEase) {
      return arguments.length ? _parseEase(ease, defaultEase) : _easeMap;
    },
    getById: function getById(id) {
      return _globalTimeline.getById(id);
    },
    exportRoot: function exportRoot(vars, includeDelayedCalls) {
      if (vars === void 0) {
        vars = {};
      }
      var tl = new Timeline(vars), child, next;
      tl.smoothChildTiming = _isNotFalse(vars.smoothChildTiming);
      _globalTimeline.remove(tl);
      tl._dp = 0;
      tl._time = tl._tTime = _globalTimeline._time;
      child = _globalTimeline._first;
      while (child) {
        next = child._next;
        if (includeDelayedCalls || !(!child._dur && child instanceof Tween && child.vars.onComplete === child._targets[0])) {
          _addToTimeline(tl, child, child._start - child._delay);
        }
        child = next;
      }
      _addToTimeline(_globalTimeline, tl, 0);
      return tl;
    },
    context: function context(func, scope) {
      return func ? new Context(func, scope) : _context;
    },
    matchMedia: function matchMedia(scope) {
      return new MatchMedia(scope);
    },
    matchMediaRefresh: function matchMediaRefresh() {
      return _media.forEach(function(c2) {
        var cond = c2.conditions, found, p2;
        for (p2 in cond) {
          if (cond[p2]) {
            cond[p2] = false;
            found = 1;
          }
        }
        found && c2.revert();
      }) || _onMediaChange();
    },
    addEventListener: function addEventListener(type, callback) {
      var a2 = _listeners[type] || (_listeners[type] = []);
      ~a2.indexOf(callback) || a2.push(callback);
    },
    removeEventListener: function removeEventListener(type, callback) {
      var a2 = _listeners[type], i2 = a2 && a2.indexOf(callback);
      i2 >= 0 && a2.splice(i2, 1);
    },
    utils: {
      wrap,
      wrapYoyo,
      distribute,
      random,
      snap,
      normalize,
      getUnit,
      clamp: clamp2,
      splitColor,
      toArray,
      selector,
      mapRange,
      pipe,
      unitize,
      interpolate,
      shuffle
    },
    install: _install,
    effects: _effects,
    ticker: _ticker,
    updateRoot: Timeline.updateRoot,
    plugins: _plugins,
    globalTimeline: _globalTimeline,
    core: {
      PropTween,
      globals: _addGlobal,
      Tween,
      Timeline,
      Animation,
      getCache: _getCache,
      _removeLinkedListItem,
      reverting: function reverting() {
        return _reverting;
      },
      context: function context2(toAdd) {
        if (toAdd && _context) {
          _context.data.push(toAdd);
          toAdd._ctx = _context;
        }
        return _context;
      },
      suppressOverwrites: function suppressOverwrites(value) {
        return _suppressOverwrites = value;
      }
    }
  };
  _forEachName("to,from,fromTo,delayedCall,set,killTweensOf", function(name) {
    return _gsap[name] = Tween[name];
  });
  _ticker.add(Timeline.updateRoot);
  _quickTween = _gsap.to({}, {
    duration: 0
  });
  var _getPluginPropTween = function _getPluginPropTween2(plugin, prop) {
    var pt = plugin._pt;
    while (pt && pt.p !== prop && pt.op !== prop && pt.fp !== prop) {
      pt = pt._next;
    }
    return pt;
  };
  var _addModifiers = function _addModifiers2(tween, modifiers) {
    var targets = tween._targets, p2, i2, pt;
    for (p2 in modifiers) {
      i2 = targets.length;
      while (i2--) {
        pt = tween._ptLookup[i2][p2];
        if (pt && (pt = pt.d)) {
          if (pt._pt) {
            pt = _getPluginPropTween(pt, p2);
          }
          pt && pt.modifier && pt.modifier(modifiers[p2], tween, targets[i2], p2);
        }
      }
    }
  };
  var _buildModifierPlugin = function _buildModifierPlugin2(name, modifier) {
    return {
      name,
      headless: 1,
      rawVars: 1,
      //don't pre-process function-based values or "random()" strings.
      init: function init4(target, vars, tween) {
        tween._onInit = function(tween2) {
          var temp, p2;
          if (_isString(vars)) {
            temp = {};
            _forEachName(vars, function(name2) {
              return temp[name2] = 1;
            });
            vars = temp;
          }
          if (modifier) {
            temp = {};
            for (p2 in vars) {
              temp[p2] = modifier(vars[p2]);
            }
            vars = temp;
          }
          _addModifiers(tween2, vars);
        };
      }
    };
  };
  var gsap = _gsap.registerPlugin({
    name: "attr",
    init: function init(target, vars, tween, index, targets) {
      var p2, pt, v;
      this.tween = tween;
      for (p2 in vars) {
        v = target.getAttribute(p2) || "";
        pt = this.add(target, "setAttribute", (v || 0) + "", vars[p2], index, targets, 0, 0, p2);
        pt.op = p2;
        pt.b = v;
        this._props.push(p2);
      }
    },
    render: function render(ratio, data) {
      var pt = data._pt;
      while (pt) {
        _reverting ? pt.set(pt.t, pt.p, pt.b, pt) : pt.r(ratio, pt.d);
        pt = pt._next;
      }
    }
  }, {
    name: "endArray",
    headless: 1,
    init: function init2(target, value) {
      var i2 = value.length;
      while (i2--) {
        this.add(target, i2, target[i2] || 0, value[i2], 0, 0, 0, 0, 0, 1);
      }
    }
  }, _buildModifierPlugin("roundProps", _roundModifier), _buildModifierPlugin("modifiers"), _buildModifierPlugin("snap", snap)) || _gsap;
  Tween.version = Timeline.version = gsap.version = "3.13.0";
  _coreReady = 1;
  _windowExists() && _wake();
  var Power0 = _easeMap.Power0;
  var Power1 = _easeMap.Power1;
  var Power2 = _easeMap.Power2;
  var Power3 = _easeMap.Power3;
  var Power4 = _easeMap.Power4;
  var Linear = _easeMap.Linear;
  var Quad = _easeMap.Quad;
  var Cubic = _easeMap.Cubic;
  var Quart = _easeMap.Quart;
  var Quint = _easeMap.Quint;
  var Strong = _easeMap.Strong;
  var Elastic = _easeMap.Elastic;
  var Back = _easeMap.Back;
  var SteppedEase = _easeMap.SteppedEase;
  var Bounce = _easeMap.Bounce;
  var Sine = _easeMap.Sine;
  var Expo = _easeMap.Expo;
  var Circ = _easeMap.Circ;

  // node_modules/gsap/CSSPlugin.js
  var _win2;
  var _doc2;
  var _docElement;
  var _pluginInitted;
  var _tempDiv;
  var _tempDivStyler;
  var _recentSetterPlugin;
  var _reverting2;
  var _windowExists3 = function _windowExists4() {
    return typeof window !== "undefined";
  };
  var _transformProps = {};
  var _RAD2DEG = 180 / Math.PI;
  var _DEG2RAD = Math.PI / 180;
  var _atan2 = Math.atan2;
  var _bigNum2 = 1e8;
  var _capsExp = /([A-Z])/g;
  var _horizontalExp = /(left|right|width|margin|padding|x)/i;
  var _complexExp = /[\s,\(]\S/;
  var _propertyAliases = {
    autoAlpha: "opacity,visibility",
    scale: "scaleX,scaleY",
    alpha: "opacity"
  };
  var _renderCSSProp = function _renderCSSProp2(ratio, data) {
    return data.set(data.t, data.p, Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u, data);
  };
  var _renderPropWithEnd = function _renderPropWithEnd2(ratio, data) {
    return data.set(data.t, data.p, ratio === 1 ? data.e : Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u, data);
  };
  var _renderCSSPropWithBeginning = function _renderCSSPropWithBeginning2(ratio, data) {
    return data.set(data.t, data.p, ratio ? Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u : data.b, data);
  };
  var _renderRoundedCSSProp = function _renderRoundedCSSProp2(ratio, data) {
    var value = data.s + data.c * ratio;
    data.set(data.t, data.p, ~~(value + (value < 0 ? -0.5 : 0.5)) + data.u, data);
  };
  var _renderNonTweeningValue = function _renderNonTweeningValue2(ratio, data) {
    return data.set(data.t, data.p, ratio ? data.e : data.b, data);
  };
  var _renderNonTweeningValueOnlyAtEnd = function _renderNonTweeningValueOnlyAtEnd2(ratio, data) {
    return data.set(data.t, data.p, ratio !== 1 ? data.b : data.e, data);
  };
  var _setterCSSStyle = function _setterCSSStyle2(target, property, value) {
    return target.style[property] = value;
  };
  var _setterCSSProp = function _setterCSSProp2(target, property, value) {
    return target.style.setProperty(property, value);
  };
  var _setterTransform = function _setterTransform2(target, property, value) {
    return target._gsap[property] = value;
  };
  var _setterScale = function _setterScale2(target, property, value) {
    return target._gsap.scaleX = target._gsap.scaleY = value;
  };
  var _setterScaleWithRender = function _setterScaleWithRender2(target, property, value, data, ratio) {
    var cache = target._gsap;
    cache.scaleX = cache.scaleY = value;
    cache.renderTransform(ratio, cache);
  };
  var _setterTransformWithRender = function _setterTransformWithRender2(target, property, value, data, ratio) {
    var cache = target._gsap;
    cache[property] = value;
    cache.renderTransform(ratio, cache);
  };
  var _transformProp = "transform";
  var _transformOriginProp = _transformProp + "Origin";
  var _saveStyle = function _saveStyle2(property, isNotCSS) {
    var _this = this;
    var target = this.target, style = target.style, cache = target._gsap;
    if (property in _transformProps && style) {
      this.tfm = this.tfm || {};
      if (property !== "transform") {
        property = _propertyAliases[property] || property;
        ~property.indexOf(",") ? property.split(",").forEach(function(a2) {
          return _this.tfm[a2] = _get(target, a2);
        }) : this.tfm[property] = cache.x ? cache[property] : _get(target, property);
        property === _transformOriginProp && (this.tfm.zOrigin = cache.zOrigin);
      } else {
        return _propertyAliases.transform.split(",").forEach(function(p2) {
          return _saveStyle2.call(_this, p2, isNotCSS);
        });
      }
      if (this.props.indexOf(_transformProp) >= 0) {
        return;
      }
      if (cache.svg) {
        this.svgo = target.getAttribute("data-svg-origin");
        this.props.push(_transformOriginProp, isNotCSS, "");
      }
      property = _transformProp;
    }
    (style || isNotCSS) && this.props.push(property, isNotCSS, style[property]);
  };
  var _removeIndependentTransforms = function _removeIndependentTransforms2(style) {
    if (style.translate) {
      style.removeProperty("translate");
      style.removeProperty("scale");
      style.removeProperty("rotate");
    }
  };
  var _revertStyle = function _revertStyle2() {
    var props = this.props, target = this.target, style = target.style, cache = target._gsap, i2, p2;
    for (i2 = 0; i2 < props.length; i2 += 3) {
      if (!props[i2 + 1]) {
        props[i2 + 2] ? style[props[i2]] = props[i2 + 2] : style.removeProperty(props[i2].substr(0, 2) === "--" ? props[i2] : props[i2].replace(_capsExp, "-$1").toLowerCase());
      } else if (props[i2 + 1] === 2) {
        target[props[i2]](props[i2 + 2]);
      } else {
        target[props[i2]] = props[i2 + 2];
      }
    }
    if (this.tfm) {
      for (p2 in this.tfm) {
        cache[p2] = this.tfm[p2];
      }
      if (cache.svg) {
        cache.renderTransform();
        target.setAttribute("data-svg-origin", this.svgo || "");
      }
      i2 = _reverting2();
      if ((!i2 || !i2.isStart) && !style[_transformProp]) {
        _removeIndependentTransforms(style);
        if (cache.zOrigin && style[_transformOriginProp]) {
          style[_transformOriginProp] += " " + cache.zOrigin + "px";
          cache.zOrigin = 0;
          cache.renderTransform();
        }
        cache.uncache = 1;
      }
    }
  };
  var _getStyleSaver = function _getStyleSaver2(target, properties) {
    var saver = {
      target,
      props: [],
      revert: _revertStyle,
      save: _saveStyle
    };
    target._gsap || gsap.core.getCache(target);
    properties && target.style && target.nodeType && properties.split(",").forEach(function(p2) {
      return saver.save(p2);
    });
    return saver;
  };
  var _supports3D;
  var _createElement = function _createElement2(type, ns) {
    var e2 = _doc2.createElementNS ? _doc2.createElementNS((ns || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), type) : _doc2.createElement(type);
    return e2 && e2.style ? e2 : _doc2.createElement(type);
  };
  var _getComputedProperty = function _getComputedProperty2(target, property, skipPrefixFallback) {
    var cs = getComputedStyle(target);
    return cs[property] || cs.getPropertyValue(property.replace(_capsExp, "-$1").toLowerCase()) || cs.getPropertyValue(property) || !skipPrefixFallback && _getComputedProperty2(target, _checkPropPrefix(property) || property, 1) || "";
  };
  var _prefixes = "O,Moz,ms,Ms,Webkit".split(",");
  var _checkPropPrefix = function _checkPropPrefix2(property, element, preferPrefix) {
    var e2 = element || _tempDiv, s2 = e2.style, i2 = 5;
    if (property in s2 && !preferPrefix) {
      return property;
    }
    property = property.charAt(0).toUpperCase() + property.substr(1);
    while (i2-- && !(_prefixes[i2] + property in s2)) {
    }
    return i2 < 0 ? null : (i2 === 3 ? "ms" : i2 >= 0 ? _prefixes[i2] : "") + property;
  };
  var _initCore = function _initCore2() {
    if (_windowExists3() && window.document) {
      _win2 = window;
      _doc2 = _win2.document;
      _docElement = _doc2.documentElement;
      _tempDiv = _createElement("div") || {
        style: {}
      };
      _tempDivStyler = _createElement("div");
      _transformProp = _checkPropPrefix(_transformProp);
      _transformOriginProp = _transformProp + "Origin";
      _tempDiv.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0";
      _supports3D = !!_checkPropPrefix("perspective");
      _reverting2 = gsap.core.reverting;
      _pluginInitted = 1;
    }
  };
  var _getReparentedCloneBBox = function _getReparentedCloneBBox2(target) {
    var owner = target.ownerSVGElement, svg = _createElement("svg", owner && owner.getAttribute("xmlns") || "http://www.w3.org/2000/svg"), clone = target.cloneNode(true), bbox;
    clone.style.display = "block";
    svg.appendChild(clone);
    _docElement.appendChild(svg);
    try {
      bbox = clone.getBBox();
    } catch (e2) {
    }
    svg.removeChild(clone);
    _docElement.removeChild(svg);
    return bbox;
  };
  var _getAttributeFallbacks = function _getAttributeFallbacks2(target, attributesArray) {
    var i2 = attributesArray.length;
    while (i2--) {
      if (target.hasAttribute(attributesArray[i2])) {
        return target.getAttribute(attributesArray[i2]);
      }
    }
  };
  var _getBBox = function _getBBox2(target) {
    var bounds, cloned;
    try {
      bounds = target.getBBox();
    } catch (error) {
      bounds = _getReparentedCloneBBox(target);
      cloned = 1;
    }
    bounds && (bounds.width || bounds.height) || cloned || (bounds = _getReparentedCloneBBox(target));
    return bounds && !bounds.width && !bounds.x && !bounds.y ? {
      x: +_getAttributeFallbacks(target, ["x", "cx", "x1"]) || 0,
      y: +_getAttributeFallbacks(target, ["y", "cy", "y1"]) || 0,
      width: 0,
      height: 0
    } : bounds;
  };
  var _isSVG = function _isSVG2(e2) {
    return !!(e2.getCTM && (!e2.parentNode || e2.ownerSVGElement) && _getBBox(e2));
  };
  var _removeProperty = function _removeProperty2(target, property) {
    if (property) {
      var style = target.style, first2Chars;
      if (property in _transformProps && property !== _transformOriginProp) {
        property = _transformProp;
      }
      if (style.removeProperty) {
        first2Chars = property.substr(0, 2);
        if (first2Chars === "ms" || property.substr(0, 6) === "webkit") {
          property = "-" + property;
        }
        style.removeProperty(first2Chars === "--" ? property : property.replace(_capsExp, "-$1").toLowerCase());
      } else {
        style.removeAttribute(property);
      }
    }
  };
  var _addNonTweeningPT = function _addNonTweeningPT2(plugin, target, property, beginning, end, onlySetAtEnd) {
    var pt = new PropTween(plugin._pt, target, property, 0, 1, onlySetAtEnd ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue);
    plugin._pt = pt;
    pt.b = beginning;
    pt.e = end;
    plugin._props.push(property);
    return pt;
  };
  var _nonConvertibleUnits = {
    deg: 1,
    rad: 1,
    turn: 1
  };
  var _nonStandardLayouts = {
    grid: 1,
    flex: 1
  };
  var _convertToUnit = function _convertToUnit2(target, property, value, unit) {
    var curValue = parseFloat(value) || 0, curUnit = (value + "").trim().substr((curValue + "").length) || "px", style = _tempDiv.style, horizontal = _horizontalExp.test(property), isRootSVG = target.tagName.toLowerCase() === "svg", measureProperty = (isRootSVG ? "client" : "offset") + (horizontal ? "Width" : "Height"), amount = 100, toPixels = unit === "px", toPercent = unit === "%", px, parent, cache, isSVG;
    if (unit === curUnit || !curValue || _nonConvertibleUnits[unit] || _nonConvertibleUnits[curUnit]) {
      return curValue;
    }
    curUnit !== "px" && !toPixels && (curValue = _convertToUnit2(target, property, value, "px"));
    isSVG = target.getCTM && _isSVG(target);
    if ((toPercent || curUnit === "%") && (_transformProps[property] || ~property.indexOf("adius"))) {
      px = isSVG ? target.getBBox()[horizontal ? "width" : "height"] : target[measureProperty];
      return _round(toPercent ? curValue / px * amount : curValue / 100 * px);
    }
    style[horizontal ? "width" : "height"] = amount + (toPixels ? curUnit : unit);
    parent = unit !== "rem" && ~property.indexOf("adius") || unit === "em" && target.appendChild && !isRootSVG ? target : target.parentNode;
    if (isSVG) {
      parent = (target.ownerSVGElement || {}).parentNode;
    }
    if (!parent || parent === _doc2 || !parent.appendChild) {
      parent = _doc2.body;
    }
    cache = parent._gsap;
    if (cache && toPercent && cache.width && horizontal && cache.time === _ticker.time && !cache.uncache) {
      return _round(curValue / cache.width * amount);
    } else {
      if (toPercent && (property === "height" || property === "width")) {
        var v = target.style[property];
        target.style[property] = amount + unit;
        px = target[measureProperty];
        v ? target.style[property] = v : _removeProperty(target, property);
      } else {
        (toPercent || curUnit === "%") && !_nonStandardLayouts[_getComputedProperty(parent, "display")] && (style.position = _getComputedProperty(target, "position"));
        parent === target && (style.position = "static");
        parent.appendChild(_tempDiv);
        px = _tempDiv[measureProperty];
        parent.removeChild(_tempDiv);
        style.position = "absolute";
      }
      if (horizontal && toPercent) {
        cache = _getCache(parent);
        cache.time = _ticker.time;
        cache.width = parent[measureProperty];
      }
    }
    return _round(toPixels ? px * curValue / amount : px && curValue ? amount / px * curValue : 0);
  };
  var _get = function _get2(target, property, unit, uncache) {
    var value;
    _pluginInitted || _initCore();
    if (property in _propertyAliases && property !== "transform") {
      property = _propertyAliases[property];
      if (~property.indexOf(",")) {
        property = property.split(",")[0];
      }
    }
    if (_transformProps[property] && property !== "transform") {
      value = _parseTransform(target, uncache);
      value = property !== "transformOrigin" ? value[property] : value.svg ? value.origin : _firstTwoOnly(_getComputedProperty(target, _transformOriginProp)) + " " + value.zOrigin + "px";
    } else {
      value = target.style[property];
      if (!value || value === "auto" || uncache || ~(value + "").indexOf("calc(")) {
        value = _specialProps[property] && _specialProps[property](target, property, unit) || _getComputedProperty(target, property) || _getProperty(target, property) || (property === "opacity" ? 1 : 0);
      }
    }
    return unit && !~(value + "").trim().indexOf(" ") ? _convertToUnit(target, property, value, unit) + unit : value;
  };
  var _tweenComplexCSSString = function _tweenComplexCSSString2(target, prop, start, end) {
    if (!start || start === "none") {
      var p2 = _checkPropPrefix(prop, target, 1), s2 = p2 && _getComputedProperty(target, p2, 1);
      if (s2 && s2 !== start) {
        prop = p2;
        start = s2;
      } else if (prop === "borderColor") {
        start = _getComputedProperty(target, "borderTopColor");
      }
    }
    var pt = new PropTween(this._pt, target.style, prop, 0, 1, _renderComplexString), index = 0, matchIndex = 0, a2, result, startValues, startNum, color, startValue, endValue, endNum, chunk, endUnit, startUnit, endValues;
    pt.b = start;
    pt.e = end;
    start += "";
    end += "";
    if (end.substring(0, 6) === "var(--") {
      end = _getComputedProperty(target, end.substring(4, end.indexOf(")")));
    }
    if (end === "auto") {
      startValue = target.style[prop];
      target.style[prop] = end;
      end = _getComputedProperty(target, prop) || end;
      startValue ? target.style[prop] = startValue : _removeProperty(target, prop);
    }
    a2 = [start, end];
    _colorStringFilter(a2);
    start = a2[0];
    end = a2[1];
    startValues = start.match(_numWithUnitExp) || [];
    endValues = end.match(_numWithUnitExp) || [];
    if (endValues.length) {
      while (result = _numWithUnitExp.exec(end)) {
        endValue = result[0];
        chunk = end.substring(index, result.index);
        if (color) {
          color = (color + 1) % 5;
        } else if (chunk.substr(-5) === "rgba(" || chunk.substr(-5) === "hsla(") {
          color = 1;
        }
        if (endValue !== (startValue = startValues[matchIndex++] || "")) {
          startNum = parseFloat(startValue) || 0;
          startUnit = startValue.substr((startNum + "").length);
          endValue.charAt(1) === "=" && (endValue = _parseRelative(startNum, endValue) + startUnit);
          endNum = parseFloat(endValue);
          endUnit = endValue.substr((endNum + "").length);
          index = _numWithUnitExp.lastIndex - endUnit.length;
          if (!endUnit) {
            endUnit = endUnit || _config.units[prop] || startUnit;
            if (index === end.length) {
              end += endUnit;
              pt.e += endUnit;
            }
          }
          if (startUnit !== endUnit) {
            startNum = _convertToUnit(target, prop, startValue, endUnit) || 0;
          }
          pt._pt = {
            _next: pt._pt,
            p: chunk || matchIndex === 1 ? chunk : ",",
            //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
            s: startNum,
            c: endNum - startNum,
            m: color && color < 4 || prop === "zIndex" ? Math.round : 0
          };
        }
      }
      pt.c = index < end.length ? end.substring(index, end.length) : "";
    } else {
      pt.r = prop === "display" && end === "none" ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue;
    }
    _relExp.test(end) && (pt.e = 0);
    this._pt = pt;
    return pt;
  };
  var _keywordToPercent = {
    top: "0%",
    bottom: "100%",
    left: "0%",
    right: "100%",
    center: "50%"
  };
  var _convertKeywordsToPercentages = function _convertKeywordsToPercentages2(value) {
    var split = value.split(" "), x = split[0], y = split[1] || "50%";
    if (x === "top" || x === "bottom" || y === "left" || y === "right") {
      value = x;
      x = y;
      y = value;
    }
    split[0] = _keywordToPercent[x] || x;
    split[1] = _keywordToPercent[y] || y;
    return split.join(" ");
  };
  var _renderClearProps = function _renderClearProps2(ratio, data) {
    if (data.tween && data.tween._time === data.tween._dur) {
      var target = data.t, style = target.style, props = data.u, cache = target._gsap, prop, clearTransforms, i2;
      if (props === "all" || props === true) {
        style.cssText = "";
        clearTransforms = 1;
      } else {
        props = props.split(",");
        i2 = props.length;
        while (--i2 > -1) {
          prop = props[i2];
          if (_transformProps[prop]) {
            clearTransforms = 1;
            prop = prop === "transformOrigin" ? _transformOriginProp : _transformProp;
          }
          _removeProperty(target, prop);
        }
      }
      if (clearTransforms) {
        _removeProperty(target, _transformProp);
        if (cache) {
          cache.svg && target.removeAttribute("transform");
          style.scale = style.rotate = style.translate = "none";
          _parseTransform(target, 1);
          cache.uncache = 1;
          _removeIndependentTransforms(style);
        }
      }
    }
  };
  var _specialProps = {
    clearProps: function clearProps(plugin, target, property, endValue, tween) {
      if (tween.data !== "isFromStart") {
        var pt = plugin._pt = new PropTween(plugin._pt, target, property, 0, 0, _renderClearProps);
        pt.u = endValue;
        pt.pr = -10;
        pt.tween = tween;
        plugin._props.push(property);
        return 1;
      }
    }
    /* className feature (about 0.4kb gzipped).
    , className(plugin, target, property, endValue, tween) {
    	let _renderClassName = (ratio, data) => {
    			data.css.render(ratio, data.css);
    			if (!ratio || ratio === 1) {
    				let inline = data.rmv,
    					target = data.t,
    					p;
    				target.setAttribute("class", ratio ? data.e : data.b);
    				for (p in inline) {
    					_removeProperty(target, p);
    				}
    			}
    		},
    		_getAllStyles = (target) => {
    			let styles = {},
    				computed = getComputedStyle(target),
    				p;
    			for (p in computed) {
    				if (isNaN(p) && p !== "cssText" && p !== "length") {
    					styles[p] = computed[p];
    				}
    			}
    			_setDefaults(styles, _parseTransform(target, 1));
    			return styles;
    		},
    		startClassList = target.getAttribute("class"),
    		style = target.style,
    		cssText = style.cssText,
    		cache = target._gsap,
    		classPT = cache.classPT,
    		inlineToRemoveAtEnd = {},
    		data = {t:target, plugin:plugin, rmv:inlineToRemoveAtEnd, b:startClassList, e:(endValue.charAt(1) !== "=") ? endValue : startClassList.replace(new RegExp("(?:\\s|^)" + endValue.substr(2) + "(?![\\w-])"), "") + ((endValue.charAt(0) === "+") ? " " + endValue.substr(2) : "")},
    		changingVars = {},
    		startVars = _getAllStyles(target),
    		transformRelated = /(transform|perspective)/i,
    		endVars, p;
    	if (classPT) {
    		classPT.r(1, classPT.d);
    		_removeLinkedListItem(classPT.d.plugin, classPT, "_pt");
    	}
    	target.setAttribute("class", data.e);
    	endVars = _getAllStyles(target, true);
    	target.setAttribute("class", startClassList);
    	for (p in endVars) {
    		if (endVars[p] !== startVars[p] && !transformRelated.test(p)) {
    			changingVars[p] = endVars[p];
    			if (!style[p] && style[p] !== "0") {
    				inlineToRemoveAtEnd[p] = 1;
    			}
    		}
    	}
    	cache.classPT = plugin._pt = new PropTween(plugin._pt, target, "className", 0, 0, _renderClassName, data, 0, -11);
    	if (style.cssText !== cssText) { //only apply if things change. Otherwise, in cases like a background-image that's pulled dynamically, it could cause a refresh. See https://gsap.com/forums/topic/20368-possible-gsap-bug-switching-classnames-in-chrome/.
    		style.cssText = cssText; //we recorded cssText before we swapped classes and ran _getAllStyles() because in cases when a className tween is overwritten, we remove all the related tweening properties from that class change (otherwise class-specific stuff can't override properties we've directly set on the target's style object due to specificity).
    	}
    	_parseTransform(target, true); //to clear the caching of transforms
    	data.css = new gsap.plugins.css();
    	data.css.init(target, changingVars, tween);
    	plugin._props.push(...data.css._props);
    	return 1;
    }
    */
  };
  var _identity2DMatrix = [1, 0, 0, 1, 0, 0];
  var _rotationalProperties = {};
  var _isNullTransform = function _isNullTransform2(value) {
    return value === "matrix(1, 0, 0, 1, 0, 0)" || value === "none" || !value;
  };
  var _getComputedTransformMatrixAsArray = function _getComputedTransformMatrixAsArray2(target) {
    var matrixString = _getComputedProperty(target, _transformProp);
    return _isNullTransform(matrixString) ? _identity2DMatrix : matrixString.substr(7).match(_numExp).map(_round);
  };
  var _getMatrix = function _getMatrix2(target, force2D) {
    var cache = target._gsap || _getCache(target), style = target.style, matrix = _getComputedTransformMatrixAsArray(target), parent, nextSibling, temp, addedToDOM;
    if (cache.svg && target.getAttribute("transform")) {
      temp = target.transform.baseVal.consolidate().matrix;
      matrix = [temp.a, temp.b, temp.c, temp.d, temp.e, temp.f];
      return matrix.join(",") === "1,0,0,1,0,0" ? _identity2DMatrix : matrix;
    } else if (matrix === _identity2DMatrix && !target.offsetParent && target !== _docElement && !cache.svg) {
      temp = style.display;
      style.display = "block";
      parent = target.parentNode;
      if (!parent || !target.offsetParent && !target.getBoundingClientRect().width) {
        addedToDOM = 1;
        nextSibling = target.nextElementSibling;
        _docElement.appendChild(target);
      }
      matrix = _getComputedTransformMatrixAsArray(target);
      temp ? style.display = temp : _removeProperty(target, "display");
      if (addedToDOM) {
        nextSibling ? parent.insertBefore(target, nextSibling) : parent ? parent.appendChild(target) : _docElement.removeChild(target);
      }
    }
    return force2D && matrix.length > 6 ? [matrix[0], matrix[1], matrix[4], matrix[5], matrix[12], matrix[13]] : matrix;
  };
  var _applySVGOrigin = function _applySVGOrigin2(target, origin, originIsAbsolute, smooth, matrixArray, pluginToAddPropTweensTo) {
    var cache = target._gsap, matrix = matrixArray || _getMatrix(target, true), xOriginOld = cache.xOrigin || 0, yOriginOld = cache.yOrigin || 0, xOffsetOld = cache.xOffset || 0, yOffsetOld = cache.yOffset || 0, a2 = matrix[0], b = matrix[1], c2 = matrix[2], d2 = matrix[3], tx = matrix[4], ty = matrix[5], originSplit = origin.split(" "), xOrigin = parseFloat(originSplit[0]) || 0, yOrigin = parseFloat(originSplit[1]) || 0, bounds, determinant, x, y;
    if (!originIsAbsolute) {
      bounds = _getBBox(target);
      xOrigin = bounds.x + (~originSplit[0].indexOf("%") ? xOrigin / 100 * bounds.width : xOrigin);
      yOrigin = bounds.y + (~(originSplit[1] || originSplit[0]).indexOf("%") ? yOrigin / 100 * bounds.height : yOrigin);
    } else if (matrix !== _identity2DMatrix && (determinant = a2 * d2 - b * c2)) {
      x = xOrigin * (d2 / determinant) + yOrigin * (-c2 / determinant) + (c2 * ty - d2 * tx) / determinant;
      y = xOrigin * (-b / determinant) + yOrigin * (a2 / determinant) - (a2 * ty - b * tx) / determinant;
      xOrigin = x;
      yOrigin = y;
    }
    if (smooth || smooth !== false && cache.smooth) {
      tx = xOrigin - xOriginOld;
      ty = yOrigin - yOriginOld;
      cache.xOffset = xOffsetOld + (tx * a2 + ty * c2) - tx;
      cache.yOffset = yOffsetOld + (tx * b + ty * d2) - ty;
    } else {
      cache.xOffset = cache.yOffset = 0;
    }
    cache.xOrigin = xOrigin;
    cache.yOrigin = yOrigin;
    cache.smooth = !!smooth;
    cache.origin = origin;
    cache.originIsAbsolute = !!originIsAbsolute;
    target.style[_transformOriginProp] = "0px 0px";
    if (pluginToAddPropTweensTo) {
      _addNonTweeningPT(pluginToAddPropTweensTo, cache, "xOrigin", xOriginOld, xOrigin);
      _addNonTweeningPT(pluginToAddPropTweensTo, cache, "yOrigin", yOriginOld, yOrigin);
      _addNonTweeningPT(pluginToAddPropTweensTo, cache, "xOffset", xOffsetOld, cache.xOffset);
      _addNonTweeningPT(pluginToAddPropTweensTo, cache, "yOffset", yOffsetOld, cache.yOffset);
    }
    target.setAttribute("data-svg-origin", xOrigin + " " + yOrigin);
  };
  var _parseTransform = function _parseTransform2(target, uncache) {
    var cache = target._gsap || new GSCache(target);
    if ("x" in cache && !uncache && !cache.uncache) {
      return cache;
    }
    var style = target.style, invertedScaleX = cache.scaleX < 0, px = "px", deg = "deg", cs = getComputedStyle(target), origin = _getComputedProperty(target, _transformOriginProp) || "0", x, y, z, scaleX, scaleY, rotation, rotationX, rotationY, skewX, skewY, perspective, xOrigin, yOrigin, matrix, angle, cos, sin, a2, b, c2, d2, a12, a22, t1, t2, t3, a13, a23, a33, a42, a43, a32;
    x = y = z = rotation = rotationX = rotationY = skewX = skewY = perspective = 0;
    scaleX = scaleY = 1;
    cache.svg = !!(target.getCTM && _isSVG(target));
    if (cs.translate) {
      if (cs.translate !== "none" || cs.scale !== "none" || cs.rotate !== "none") {
        style[_transformProp] = (cs.translate !== "none" ? "translate3d(" + (cs.translate + " 0 0").split(" ").slice(0, 3).join(", ") + ") " : "") + (cs.rotate !== "none" ? "rotate(" + cs.rotate + ") " : "") + (cs.scale !== "none" ? "scale(" + cs.scale.split(" ").join(",") + ") " : "") + (cs[_transformProp] !== "none" ? cs[_transformProp] : "");
      }
      style.scale = style.rotate = style.translate = "none";
    }
    matrix = _getMatrix(target, cache.svg);
    if (cache.svg) {
      if (cache.uncache) {
        t2 = target.getBBox();
        origin = cache.xOrigin - t2.x + "px " + (cache.yOrigin - t2.y) + "px";
        t1 = "";
      } else {
        t1 = !uncache && target.getAttribute("data-svg-origin");
      }
      _applySVGOrigin(target, t1 || origin, !!t1 || cache.originIsAbsolute, cache.smooth !== false, matrix);
    }
    xOrigin = cache.xOrigin || 0;
    yOrigin = cache.yOrigin || 0;
    if (matrix !== _identity2DMatrix) {
      a2 = matrix[0];
      b = matrix[1];
      c2 = matrix[2];
      d2 = matrix[3];
      x = a12 = matrix[4];
      y = a22 = matrix[5];
      if (matrix.length === 6) {
        scaleX = Math.sqrt(a2 * a2 + b * b);
        scaleY = Math.sqrt(d2 * d2 + c2 * c2);
        rotation = a2 || b ? _atan2(b, a2) * _RAD2DEG : 0;
        skewX = c2 || d2 ? _atan2(c2, d2) * _RAD2DEG + rotation : 0;
        skewX && (scaleY *= Math.abs(Math.cos(skewX * _DEG2RAD)));
        if (cache.svg) {
          x -= xOrigin - (xOrigin * a2 + yOrigin * c2);
          y -= yOrigin - (xOrigin * b + yOrigin * d2);
        }
      } else {
        a32 = matrix[6];
        a42 = matrix[7];
        a13 = matrix[8];
        a23 = matrix[9];
        a33 = matrix[10];
        a43 = matrix[11];
        x = matrix[12];
        y = matrix[13];
        z = matrix[14];
        angle = _atan2(a32, a33);
        rotationX = angle * _RAD2DEG;
        if (angle) {
          cos = Math.cos(-angle);
          sin = Math.sin(-angle);
          t1 = a12 * cos + a13 * sin;
          t2 = a22 * cos + a23 * sin;
          t3 = a32 * cos + a33 * sin;
          a13 = a12 * -sin + a13 * cos;
          a23 = a22 * -sin + a23 * cos;
          a33 = a32 * -sin + a33 * cos;
          a43 = a42 * -sin + a43 * cos;
          a12 = t1;
          a22 = t2;
          a32 = t3;
        }
        angle = _atan2(-c2, a33);
        rotationY = angle * _RAD2DEG;
        if (angle) {
          cos = Math.cos(-angle);
          sin = Math.sin(-angle);
          t1 = a2 * cos - a13 * sin;
          t2 = b * cos - a23 * sin;
          t3 = c2 * cos - a33 * sin;
          a43 = d2 * sin + a43 * cos;
          a2 = t1;
          b = t2;
          c2 = t3;
        }
        angle = _atan2(b, a2);
        rotation = angle * _RAD2DEG;
        if (angle) {
          cos = Math.cos(angle);
          sin = Math.sin(angle);
          t1 = a2 * cos + b * sin;
          t2 = a12 * cos + a22 * sin;
          b = b * cos - a2 * sin;
          a22 = a22 * cos - a12 * sin;
          a2 = t1;
          a12 = t2;
        }
        if (rotationX && Math.abs(rotationX) + Math.abs(rotation) > 359.9) {
          rotationX = rotation = 0;
          rotationY = 180 - rotationY;
        }
        scaleX = _round(Math.sqrt(a2 * a2 + b * b + c2 * c2));
        scaleY = _round(Math.sqrt(a22 * a22 + a32 * a32));
        angle = _atan2(a12, a22);
        skewX = Math.abs(angle) > 2e-4 ? angle * _RAD2DEG : 0;
        perspective = a43 ? 1 / (a43 < 0 ? -a43 : a43) : 0;
      }
      if (cache.svg) {
        t1 = target.getAttribute("transform");
        cache.forceCSS = target.setAttribute("transform", "") || !_isNullTransform(_getComputedProperty(target, _transformProp));
        t1 && target.setAttribute("transform", t1);
      }
    }
    if (Math.abs(skewX) > 90 && Math.abs(skewX) < 270) {
      if (invertedScaleX) {
        scaleX *= -1;
        skewX += rotation <= 0 ? 180 : -180;
        rotation += rotation <= 0 ? 180 : -180;
      } else {
        scaleY *= -1;
        skewX += skewX <= 0 ? 180 : -180;
      }
    }
    uncache = uncache || cache.uncache;
    cache.x = x - ((cache.xPercent = x && (!uncache && cache.xPercent || (Math.round(target.offsetWidth / 2) === Math.round(-x) ? -50 : 0))) ? target.offsetWidth * cache.xPercent / 100 : 0) + px;
    cache.y = y - ((cache.yPercent = y && (!uncache && cache.yPercent || (Math.round(target.offsetHeight / 2) === Math.round(-y) ? -50 : 0))) ? target.offsetHeight * cache.yPercent / 100 : 0) + px;
    cache.z = z + px;
    cache.scaleX = _round(scaleX);
    cache.scaleY = _round(scaleY);
    cache.rotation = _round(rotation) + deg;
    cache.rotationX = _round(rotationX) + deg;
    cache.rotationY = _round(rotationY) + deg;
    cache.skewX = skewX + deg;
    cache.skewY = skewY + deg;
    cache.transformPerspective = perspective + px;
    if (cache.zOrigin = parseFloat(origin.split(" ")[2]) || !uncache && cache.zOrigin || 0) {
      style[_transformOriginProp] = _firstTwoOnly(origin);
    }
    cache.xOffset = cache.yOffset = 0;
    cache.force3D = _config.force3D;
    cache.renderTransform = cache.svg ? _renderSVGTransforms : _supports3D ? _renderCSSTransforms : _renderNon3DTransforms;
    cache.uncache = 0;
    return cache;
  };
  var _firstTwoOnly = function _firstTwoOnly2(value) {
    return (value = value.split(" "))[0] + " " + value[1];
  };
  var _addPxTranslate = function _addPxTranslate2(target, start, value) {
    var unit = getUnit(start);
    return _round(parseFloat(start) + parseFloat(_convertToUnit(target, "x", value + "px", unit))) + unit;
  };
  var _renderNon3DTransforms = function _renderNon3DTransforms2(ratio, cache) {
    cache.z = "0px";
    cache.rotationY = cache.rotationX = "0deg";
    cache.force3D = 0;
    _renderCSSTransforms(ratio, cache);
  };
  var _zeroDeg = "0deg";
  var _zeroPx = "0px";
  var _endParenthesis = ") ";
  var _renderCSSTransforms = function _renderCSSTransforms2(ratio, cache) {
    var _ref = cache || this, xPercent = _ref.xPercent, yPercent = _ref.yPercent, x = _ref.x, y = _ref.y, z = _ref.z, rotation = _ref.rotation, rotationY = _ref.rotationY, rotationX = _ref.rotationX, skewX = _ref.skewX, skewY = _ref.skewY, scaleX = _ref.scaleX, scaleY = _ref.scaleY, transformPerspective = _ref.transformPerspective, force3D = _ref.force3D, target = _ref.target, zOrigin = _ref.zOrigin, transforms = "", use3D = force3D === "auto" && ratio && ratio !== 1 || force3D === true;
    if (zOrigin && (rotationX !== _zeroDeg || rotationY !== _zeroDeg)) {
      var angle = parseFloat(rotationY) * _DEG2RAD, a13 = Math.sin(angle), a33 = Math.cos(angle), cos;
      angle = parseFloat(rotationX) * _DEG2RAD;
      cos = Math.cos(angle);
      x = _addPxTranslate(target, x, a13 * cos * -zOrigin);
      y = _addPxTranslate(target, y, -Math.sin(angle) * -zOrigin);
      z = _addPxTranslate(target, z, a33 * cos * -zOrigin + zOrigin);
    }
    if (transformPerspective !== _zeroPx) {
      transforms += "perspective(" + transformPerspective + _endParenthesis;
    }
    if (xPercent || yPercent) {
      transforms += "translate(" + xPercent + "%, " + yPercent + "%) ";
    }
    if (use3D || x !== _zeroPx || y !== _zeroPx || z !== _zeroPx) {
      transforms += z !== _zeroPx || use3D ? "translate3d(" + x + ", " + y + ", " + z + ") " : "translate(" + x + ", " + y + _endParenthesis;
    }
    if (rotation !== _zeroDeg) {
      transforms += "rotate(" + rotation + _endParenthesis;
    }
    if (rotationY !== _zeroDeg) {
      transforms += "rotateY(" + rotationY + _endParenthesis;
    }
    if (rotationX !== _zeroDeg) {
      transforms += "rotateX(" + rotationX + _endParenthesis;
    }
    if (skewX !== _zeroDeg || skewY !== _zeroDeg) {
      transforms += "skew(" + skewX + ", " + skewY + _endParenthesis;
    }
    if (scaleX !== 1 || scaleY !== 1) {
      transforms += "scale(" + scaleX + ", " + scaleY + _endParenthesis;
    }
    target.style[_transformProp] = transforms || "translate(0, 0)";
  };
  var _renderSVGTransforms = function _renderSVGTransforms2(ratio, cache) {
    var _ref2 = cache || this, xPercent = _ref2.xPercent, yPercent = _ref2.yPercent, x = _ref2.x, y = _ref2.y, rotation = _ref2.rotation, skewX = _ref2.skewX, skewY = _ref2.skewY, scaleX = _ref2.scaleX, scaleY = _ref2.scaleY, target = _ref2.target, xOrigin = _ref2.xOrigin, yOrigin = _ref2.yOrigin, xOffset = _ref2.xOffset, yOffset = _ref2.yOffset, forceCSS = _ref2.forceCSS, tx = parseFloat(x), ty = parseFloat(y), a11, a21, a12, a22, temp;
    rotation = parseFloat(rotation);
    skewX = parseFloat(skewX);
    skewY = parseFloat(skewY);
    if (skewY) {
      skewY = parseFloat(skewY);
      skewX += skewY;
      rotation += skewY;
    }
    if (rotation || skewX) {
      rotation *= _DEG2RAD;
      skewX *= _DEG2RAD;
      a11 = Math.cos(rotation) * scaleX;
      a21 = Math.sin(rotation) * scaleX;
      a12 = Math.sin(rotation - skewX) * -scaleY;
      a22 = Math.cos(rotation - skewX) * scaleY;
      if (skewX) {
        skewY *= _DEG2RAD;
        temp = Math.tan(skewX - skewY);
        temp = Math.sqrt(1 + temp * temp);
        a12 *= temp;
        a22 *= temp;
        if (skewY) {
          temp = Math.tan(skewY);
          temp = Math.sqrt(1 + temp * temp);
          a11 *= temp;
          a21 *= temp;
        }
      }
      a11 = _round(a11);
      a21 = _round(a21);
      a12 = _round(a12);
      a22 = _round(a22);
    } else {
      a11 = scaleX;
      a22 = scaleY;
      a21 = a12 = 0;
    }
    if (tx && !~(x + "").indexOf("px") || ty && !~(y + "").indexOf("px")) {
      tx = _convertToUnit(target, "x", x, "px");
      ty = _convertToUnit(target, "y", y, "px");
    }
    if (xOrigin || yOrigin || xOffset || yOffset) {
      tx = _round(tx + xOrigin - (xOrigin * a11 + yOrigin * a12) + xOffset);
      ty = _round(ty + yOrigin - (xOrigin * a21 + yOrigin * a22) + yOffset);
    }
    if (xPercent || yPercent) {
      temp = target.getBBox();
      tx = _round(tx + xPercent / 100 * temp.width);
      ty = _round(ty + yPercent / 100 * temp.height);
    }
    temp = "matrix(" + a11 + "," + a21 + "," + a12 + "," + a22 + "," + tx + "," + ty + ")";
    target.setAttribute("transform", temp);
    forceCSS && (target.style[_transformProp] = temp);
  };
  var _addRotationalPropTween = function _addRotationalPropTween2(plugin, target, property, startNum, endValue) {
    var cap = 360, isString = _isString(endValue), endNum = parseFloat(endValue) * (isString && ~endValue.indexOf("rad") ? _RAD2DEG : 1), change = endNum - startNum, finalValue = startNum + change + "deg", direction, pt;
    if (isString) {
      direction = endValue.split("_")[1];
      if (direction === "short") {
        change %= cap;
        if (change !== change % (cap / 2)) {
          change += change < 0 ? cap : -cap;
        }
      }
      if (direction === "cw" && change < 0) {
        change = (change + cap * _bigNum2) % cap - ~~(change / cap) * cap;
      } else if (direction === "ccw" && change > 0) {
        change = (change - cap * _bigNum2) % cap - ~~(change / cap) * cap;
      }
    }
    plugin._pt = pt = new PropTween(plugin._pt, target, property, startNum, change, _renderPropWithEnd);
    pt.e = finalValue;
    pt.u = "deg";
    plugin._props.push(property);
    return pt;
  };
  var _assign = function _assign2(target, source) {
    for (var p2 in source) {
      target[p2] = source[p2];
    }
    return target;
  };
  var _addRawTransformPTs = function _addRawTransformPTs2(plugin, transforms, target) {
    var startCache = _assign({}, target._gsap), exclude = "perspective,force3D,transformOrigin,svgOrigin", style = target.style, endCache, p2, startValue, endValue, startNum, endNum, startUnit, endUnit;
    if (startCache.svg) {
      startValue = target.getAttribute("transform");
      target.setAttribute("transform", "");
      style[_transformProp] = transforms;
      endCache = _parseTransform(target, 1);
      _removeProperty(target, _transformProp);
      target.setAttribute("transform", startValue);
    } else {
      startValue = getComputedStyle(target)[_transformProp];
      style[_transformProp] = transforms;
      endCache = _parseTransform(target, 1);
      style[_transformProp] = startValue;
    }
    for (p2 in _transformProps) {
      startValue = startCache[p2];
      endValue = endCache[p2];
      if (startValue !== endValue && exclude.indexOf(p2) < 0) {
        startUnit = getUnit(startValue);
        endUnit = getUnit(endValue);
        startNum = startUnit !== endUnit ? _convertToUnit(target, p2, startValue, endUnit) : parseFloat(startValue);
        endNum = parseFloat(endValue);
        plugin._pt = new PropTween(plugin._pt, endCache, p2, startNum, endNum - startNum, _renderCSSProp);
        plugin._pt.u = endUnit || 0;
        plugin._props.push(p2);
      }
    }
    _assign(endCache, startCache);
  };
  _forEachName("padding,margin,Width,Radius", function(name, index) {
    var t2 = "Top", r2 = "Right", b = "Bottom", l2 = "Left", props = (index < 3 ? [t2, r2, b, l2] : [t2 + l2, t2 + r2, b + r2, b + l2]).map(function(side) {
      return index < 2 ? name + side : "border" + side + name;
    });
    _specialProps[index > 1 ? "border" + name : name] = function(plugin, target, property, endValue, tween) {
      var a2, vars;
      if (arguments.length < 4) {
        a2 = props.map(function(prop) {
          return _get(plugin, prop, property);
        });
        vars = a2.join(" ");
        return vars.split(a2[0]).length === 5 ? a2[0] : vars;
      }
      a2 = (endValue + "").split(" ");
      vars = {};
      props.forEach(function(prop, i2) {
        return vars[prop] = a2[i2] = a2[i2] || a2[(i2 - 1) / 2 | 0];
      });
      plugin.init(target, vars, tween);
    };
  });
  var CSSPlugin = {
    name: "css",
    register: _initCore,
    targetTest: function targetTest(target) {
      return target.style && target.nodeType;
    },
    init: function init3(target, vars, tween, index, targets) {
      var props = this._props, style = target.style, startAt = tween.vars.startAt, startValue, endValue, endNum, startNum, type, specialProp, p2, startUnit, endUnit, relative, isTransformRelated, transformPropTween, cache, smooth, hasPriority, inlineProps;
      _pluginInitted || _initCore();
      this.styles = this.styles || _getStyleSaver(target);
      inlineProps = this.styles.props;
      this.tween = tween;
      for (p2 in vars) {
        if (p2 === "autoRound") {
          continue;
        }
        endValue = vars[p2];
        if (_plugins[p2] && _checkPlugin(p2, vars, tween, index, target, targets)) {
          continue;
        }
        type = typeof endValue;
        specialProp = _specialProps[p2];
        if (type === "function") {
          endValue = endValue.call(tween, index, target, targets);
          type = typeof endValue;
        }
        if (type === "string" && ~endValue.indexOf("random(")) {
          endValue = _replaceRandom(endValue);
        }
        if (specialProp) {
          specialProp(this, target, p2, endValue, tween) && (hasPriority = 1);
        } else if (p2.substr(0, 2) === "--") {
          startValue = (getComputedStyle(target).getPropertyValue(p2) + "").trim();
          endValue += "";
          _colorExp.lastIndex = 0;
          if (!_colorExp.test(startValue)) {
            startUnit = getUnit(startValue);
            endUnit = getUnit(endValue);
          }
          endUnit ? startUnit !== endUnit && (startValue = _convertToUnit(target, p2, startValue, endUnit) + endUnit) : startUnit && (endValue += startUnit);
          this.add(style, "setProperty", startValue, endValue, index, targets, 0, 0, p2);
          props.push(p2);
          inlineProps.push(p2, 0, style[p2]);
        } else if (type !== "undefined") {
          if (startAt && p2 in startAt) {
            startValue = typeof startAt[p2] === "function" ? startAt[p2].call(tween, index, target, targets) : startAt[p2];
            _isString(startValue) && ~startValue.indexOf("random(") && (startValue = _replaceRandom(startValue));
            getUnit(startValue + "") || startValue === "auto" || (startValue += _config.units[p2] || getUnit(_get(target, p2)) || "");
            (startValue + "").charAt(1) === "=" && (startValue = _get(target, p2));
          } else {
            startValue = _get(target, p2);
          }
          startNum = parseFloat(startValue);
          relative = type === "string" && endValue.charAt(1) === "=" && endValue.substr(0, 2);
          relative && (endValue = endValue.substr(2));
          endNum = parseFloat(endValue);
          if (p2 in _propertyAliases) {
            if (p2 === "autoAlpha") {
              if (startNum === 1 && _get(target, "visibility") === "hidden" && endNum) {
                startNum = 0;
              }
              inlineProps.push("visibility", 0, style.visibility);
              _addNonTweeningPT(this, style, "visibility", startNum ? "inherit" : "hidden", endNum ? "inherit" : "hidden", !endNum);
            }
            if (p2 !== "scale" && p2 !== "transform") {
              p2 = _propertyAliases[p2];
              ~p2.indexOf(",") && (p2 = p2.split(",")[0]);
            }
          }
          isTransformRelated = p2 in _transformProps;
          if (isTransformRelated) {
            this.styles.save(p2);
            if (type === "string" && endValue.substring(0, 6) === "var(--") {
              endValue = _getComputedProperty(target, endValue.substring(4, endValue.indexOf(")")));
              endNum = parseFloat(endValue);
            }
            if (!transformPropTween) {
              cache = target._gsap;
              cache.renderTransform && !vars.parseTransform || _parseTransform(target, vars.parseTransform);
              smooth = vars.smoothOrigin !== false && cache.smooth;
              transformPropTween = this._pt = new PropTween(this._pt, style, _transformProp, 0, 1, cache.renderTransform, cache, 0, -1);
              transformPropTween.dep = 1;
            }
            if (p2 === "scale") {
              this._pt = new PropTween(this._pt, cache, "scaleY", cache.scaleY, (relative ? _parseRelative(cache.scaleY, relative + endNum) : endNum) - cache.scaleY || 0, _renderCSSProp);
              this._pt.u = 0;
              props.push("scaleY", p2);
              p2 += "X";
            } else if (p2 === "transformOrigin") {
              inlineProps.push(_transformOriginProp, 0, style[_transformOriginProp]);
              endValue = _convertKeywordsToPercentages(endValue);
              if (cache.svg) {
                _applySVGOrigin(target, endValue, 0, smooth, 0, this);
              } else {
                endUnit = parseFloat(endValue.split(" ")[2]) || 0;
                endUnit !== cache.zOrigin && _addNonTweeningPT(this, cache, "zOrigin", cache.zOrigin, endUnit);
                _addNonTweeningPT(this, style, p2, _firstTwoOnly(startValue), _firstTwoOnly(endValue));
              }
              continue;
            } else if (p2 === "svgOrigin") {
              _applySVGOrigin(target, endValue, 1, smooth, 0, this);
              continue;
            } else if (p2 in _rotationalProperties) {
              _addRotationalPropTween(this, cache, p2, startNum, relative ? _parseRelative(startNum, relative + endValue) : endValue);
              continue;
            } else if (p2 === "smoothOrigin") {
              _addNonTweeningPT(this, cache, "smooth", cache.smooth, endValue);
              continue;
            } else if (p2 === "force3D") {
              cache[p2] = endValue;
              continue;
            } else if (p2 === "transform") {
              _addRawTransformPTs(this, endValue, target);
              continue;
            }
          } else if (!(p2 in style)) {
            p2 = _checkPropPrefix(p2) || p2;
          }
          if (isTransformRelated || (endNum || endNum === 0) && (startNum || startNum === 0) && !_complexExp.test(endValue) && p2 in style) {
            startUnit = (startValue + "").substr((startNum + "").length);
            endNum || (endNum = 0);
            endUnit = getUnit(endValue) || (p2 in _config.units ? _config.units[p2] : startUnit);
            startUnit !== endUnit && (startNum = _convertToUnit(target, p2, startValue, endUnit));
            this._pt = new PropTween(this._pt, isTransformRelated ? cache : style, p2, startNum, (relative ? _parseRelative(startNum, relative + endNum) : endNum) - startNum, !isTransformRelated && (endUnit === "px" || p2 === "zIndex") && vars.autoRound !== false ? _renderRoundedCSSProp : _renderCSSProp);
            this._pt.u = endUnit || 0;
            if (startUnit !== endUnit && endUnit !== "%") {
              this._pt.b = startValue;
              this._pt.r = _renderCSSPropWithBeginning;
            }
          } else if (!(p2 in style)) {
            if (p2 in target) {
              this.add(target, p2, startValue || target[p2], relative ? relative + endValue : endValue, index, targets);
            } else if (p2 !== "parseTransform") {
              _missingPlugin(p2, endValue);
              continue;
            }
          } else {
            _tweenComplexCSSString.call(this, target, p2, startValue, relative ? relative + endValue : endValue);
          }
          isTransformRelated || (p2 in style ? inlineProps.push(p2, 0, style[p2]) : typeof target[p2] === "function" ? inlineProps.push(p2, 2, target[p2]()) : inlineProps.push(p2, 1, startValue || target[p2]));
          props.push(p2);
        }
      }
      hasPriority && _sortPropTweensByPriority(this);
    },
    render: function render2(ratio, data) {
      if (data.tween._time || !_reverting2()) {
        var pt = data._pt;
        while (pt) {
          pt.r(ratio, pt.d);
          pt = pt._next;
        }
      } else {
        data.styles.revert();
      }
    },
    get: _get,
    aliases: _propertyAliases,
    getSetter: function getSetter(target, property, plugin) {
      var p2 = _propertyAliases[property];
      p2 && p2.indexOf(",") < 0 && (property = p2);
      return property in _transformProps && property !== _transformOriginProp && (target._gsap.x || _get(target, "x")) ? plugin && _recentSetterPlugin === plugin ? property === "scale" ? _setterScale : _setterTransform : (_recentSetterPlugin = plugin || {}) && (property === "scale" ? _setterScaleWithRender : _setterTransformWithRender) : target.style && !_isUndefined(target.style[property]) ? _setterCSSStyle : ~property.indexOf("-") ? _setterCSSProp : _getSetter(target, property);
    },
    core: {
      _removeProperty,
      _getMatrix
    }
  };
  gsap.utils.checkPrefix = _checkPropPrefix;
  gsap.core.getStyleSaver = _getStyleSaver;
  (function(positionAndScale, rotation, others, aliases) {
    var all = _forEachName(positionAndScale + "," + rotation + "," + others, function(name) {
      _transformProps[name] = 1;
    });
    _forEachName(rotation, function(name) {
      _config.units[name] = "deg";
      _rotationalProperties[name] = 1;
    });
    _propertyAliases[all[13]] = positionAndScale + "," + rotation;
    _forEachName(aliases, function(name) {
      var split = name.split(":");
      _propertyAliases[split[1]] = all[split[0]];
    });
  })("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY");
  _forEachName("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function(name) {
    _config.units[name] = "px";
  });
  gsap.registerPlugin(CSSPlugin);

  // node_modules/gsap/index.js
  var gsapWithCSS = gsap.registerPlugin(CSSPlugin) || gsap;
  var TweenMaxWithCSS = gsapWithCSS.core.Tween;

  // node_modules/gsap/SplitText.js
  var gsap2;
  var _fonts;
  var _coreInitted2;
  var _initIfNecessary = () => _coreInitted2 || SplitText.register(window.gsap);
  var _charSegmenter = typeof Intl !== "undefined" ? new Intl.Segmenter() : 0;
  var _toArray = (r2) => typeof r2 === "string" ? _toArray(document.querySelectorAll(r2)) : "length" in r2 ? Array.from(r2) : [r2];
  var _elements = (targets) => _toArray(targets).filter((e2) => e2 instanceof HTMLElement);
  var _emptyArray2 = [];
  var _context2 = function() {
  };
  var _spacesRegEx = /\s+/g;
  var _emojiSafeRegEx = new RegExp("\\p{RI}\\p{RI}|\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?(\\u{200D}\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?)*|.", "gu");
  var _emptyBounds = { left: 0, top: 0, width: 0, height: 0 };
  var _stretchToFitSpecialChars = (collection, specialCharsRegEx) => {
    if (specialCharsRegEx) {
      let charsFound = new Set(collection.join("").match(specialCharsRegEx) || _emptyArray2), i2 = collection.length, slots, word, char, combined;
      if (charsFound.size) {
        while (--i2 > -1) {
          word = collection[i2];
          for (char of charsFound) {
            if (char.startsWith(word) && char.length > word.length) {
              slots = 0;
              combined = word;
              while (char.startsWith(combined += collection[i2 + ++slots]) && combined.length < char.length) {
              }
              if (slots && combined.length === char.length) {
                collection[i2] = char;
                collection.splice(i2 + 1, slots);
                break;
              }
            }
          }
        }
      }
    }
    return collection;
  };
  var _disallowInline = (element) => window.getComputedStyle(element).display === "inline" && (element.style.display = "inline-block");
  var _insertNodeBefore = (newChild, parent, existingChild) => parent.insertBefore(typeof newChild === "string" ? document.createTextNode(newChild) : newChild, existingChild);
  var _getWrapper = (type, config3, collection) => {
    let className = config3[type + "sClass"] || "", { tag = "div", aria = "auto", propIndex = false } = config3, display = type === "line" ? "block" : "inline-block", incrementClass = className.indexOf("++") > -1, wrapper = (text) => {
      let el = document.createElement(tag), i2 = collection.length + 1;
      className && (el.className = className + (incrementClass ? " " + className + i2 : ""));
      propIndex && el.style.setProperty("--" + type, i2 + "");
      aria !== "none" && el.setAttribute("aria-hidden", "true");
      if (tag !== "span") {
        el.style.position = "relative";
        el.style.display = display;
      }
      el.textContent = text;
      collection.push(el);
      return el;
    };
    incrementClass && (className = className.replace("++", ""));
    wrapper.collection = collection;
    return wrapper;
  };
  var _getLineWrapper = (element, nodes, config3, collection) => {
    let lineWrapper = _getWrapper("line", config3, collection), textAlign = window.getComputedStyle(element).textAlign || "left";
    return (startIndex, endIndex) => {
      let newLine = lineWrapper("");
      newLine.style.textAlign = textAlign;
      element.insertBefore(newLine, nodes[startIndex]);
      for (; startIndex < endIndex; startIndex++) {
        newLine.appendChild(nodes[startIndex]);
      }
      newLine.normalize();
    };
  };
  var _splitWordsAndCharsRecursively = (element, config3, wordWrapper, charWrapper, prepForCharsOnly, deepSlice, ignore, charSplitRegEx, specialCharsRegEx, isNested) => {
    var _a;
    let nodes = Array.from(element.childNodes), i2 = 0, { wordDelimiter, reduceWhiteSpace = true, prepareText } = config3, elementBounds = element.getBoundingClientRect(), lastBounds = elementBounds, isPreformatted = !reduceWhiteSpace && window.getComputedStyle(element).whiteSpace.substring(0, 3) === "pre", ignoredPreviousSibling = 0, wordsCollection = wordWrapper.collection, wordDelimIsNotSpace, wordDelimString, wordDelimSplitter, curNode, words, curWordEl, startsWithSpace, endsWithSpace, j, bounds, curWordChars, clonedNode, curSubNode, tempSubNode, curTextContent, wordText, lastWordText, k;
    if (typeof wordDelimiter === "object") {
      wordDelimSplitter = wordDelimiter.delimiter || wordDelimiter;
      wordDelimString = wordDelimiter.replaceWith || "";
    } else {
      wordDelimString = wordDelimiter === "" ? "" : wordDelimiter || " ";
    }
    wordDelimIsNotSpace = wordDelimString !== " ";
    for (; i2 < nodes.length; i2++) {
      curNode = nodes[i2];
      if (curNode.nodeType === 3) {
        curTextContent = curNode.textContent || "";
        if (reduceWhiteSpace) {
          curTextContent = curTextContent.replace(_spacesRegEx, " ");
        } else if (isPreformatted) {
          curTextContent = curTextContent.replace(/\n/g, wordDelimString + "\n");
        }
        prepareText && (curTextContent = prepareText(curTextContent, element));
        curNode.textContent = curTextContent;
        words = wordDelimString || wordDelimSplitter ? curTextContent.split(wordDelimSplitter || wordDelimString) : curTextContent.match(charSplitRegEx) || _emptyArray2;
        lastWordText = words[words.length - 1];
        endsWithSpace = wordDelimIsNotSpace ? lastWordText.slice(-1) === " " : !lastWordText;
        lastWordText || words.pop();
        lastBounds = elementBounds;
        startsWithSpace = wordDelimIsNotSpace ? words[0].charAt(0) === " " : !words[0];
        startsWithSpace && _insertNodeBefore(" ", element, curNode);
        words[0] || words.shift();
        _stretchToFitSpecialChars(words, specialCharsRegEx);
        deepSlice && isNested || (curNode.textContent = "");
        for (j = 1; j <= words.length; j++) {
          wordText = words[j - 1];
          if (!reduceWhiteSpace && isPreformatted && wordText.charAt(0) === "\n") {
            (_a = curNode.previousSibling) == null ? void 0 : _a.remove();
            _insertNodeBefore(document.createElement("br"), element, curNode);
            wordText = wordText.slice(1);
          }
          if (!reduceWhiteSpace && wordText === "") {
            _insertNodeBefore(wordDelimString, element, curNode);
          } else if (wordText === " ") {
            element.insertBefore(document.createTextNode(" "), curNode);
          } else {
            wordDelimIsNotSpace && wordText.charAt(0) === " " && _insertNodeBefore(" ", element, curNode);
            if (ignoredPreviousSibling && j === 1 && !startsWithSpace && wordsCollection.indexOf(ignoredPreviousSibling.parentNode) > -1) {
              curWordEl = wordsCollection[wordsCollection.length - 1];
              curWordEl.appendChild(document.createTextNode(charWrapper ? "" : wordText));
            } else {
              curWordEl = wordWrapper(charWrapper ? "" : wordText);
              _insertNodeBefore(curWordEl, element, curNode);
              ignoredPreviousSibling && j === 1 && !startsWithSpace && curWordEl.insertBefore(ignoredPreviousSibling, curWordEl.firstChild);
            }
            if (charWrapper) {
              curWordChars = _charSegmenter ? _stretchToFitSpecialChars([..._charSegmenter.segment(wordText)].map((s2) => s2.segment), specialCharsRegEx) : wordText.match(charSplitRegEx) || _emptyArray2;
              for (k = 0; k < curWordChars.length; k++) {
                curWordEl.appendChild(curWordChars[k] === " " ? document.createTextNode(" ") : charWrapper(curWordChars[k]));
              }
            }
            if (deepSlice && isNested) {
              curTextContent = curNode.textContent = curTextContent.substring(wordText.length + 1, curTextContent.length);
              bounds = curWordEl.getBoundingClientRect();
              if (bounds.top > lastBounds.top && bounds.left <= lastBounds.left) {
                clonedNode = element.cloneNode();
                curSubNode = element.childNodes[0];
                while (curSubNode && curSubNode !== curWordEl) {
                  tempSubNode = curSubNode;
                  curSubNode = curSubNode.nextSibling;
                  clonedNode.appendChild(tempSubNode);
                }
                element.parentNode.insertBefore(clonedNode, element);
                prepForCharsOnly && _disallowInline(clonedNode);
              }
              lastBounds = bounds;
            }
            if (j < words.length || endsWithSpace) {
              _insertNodeBefore(j >= words.length ? " " : wordDelimIsNotSpace && wordText.slice(-1) === " " ? " " + wordDelimString : wordDelimString, element, curNode);
            }
          }
        }
        element.removeChild(curNode);
        ignoredPreviousSibling = 0;
      } else if (curNode.nodeType === 1) {
        if (ignore && ignore.indexOf(curNode) > -1) {
          wordsCollection.indexOf(curNode.previousSibling) > -1 && wordsCollection[wordsCollection.length - 1].appendChild(curNode);
          ignoredPreviousSibling = curNode;
        } else {
          _splitWordsAndCharsRecursively(curNode, config3, wordWrapper, charWrapper, prepForCharsOnly, deepSlice, ignore, charSplitRegEx, specialCharsRegEx, true);
          ignoredPreviousSibling = 0;
        }
        prepForCharsOnly && _disallowInline(curNode);
      }
    }
  };
  var _SplitText = class _SplitText2 {
    constructor(elements, config3) {
      this.isSplit = false;
      _initIfNecessary();
      this.elements = _elements(elements);
      this.chars = [];
      this.words = [];
      this.lines = [];
      this.masks = [];
      this.vars = config3;
      this._split = () => this.isSplit && this.split(this.vars);
      let orig = [], timerId, checkWidths = () => {
        let i2 = orig.length, o2;
        while (i2--) {
          o2 = orig[i2];
          let w = o2.element.offsetWidth;
          if (w !== o2.width) {
            o2.width = w;
            this._split();
            return;
          }
        }
      };
      this._data = { orig, obs: typeof ResizeObserver !== "undefined" && new ResizeObserver(() => {
        clearTimeout(timerId);
        timerId = setTimeout(checkWidths, 200);
      }) };
      _context2(this);
      this.split(config3);
    }
    split(config3) {
      this.isSplit && this.revert();
      this.vars = config3 = config3 || this.vars || {};
      let { type = "chars,words,lines", aria = "auto", deepSlice = true, smartWrap, onSplit, autoSplit = false, specialChars, mask } = this.vars, splitLines = type.indexOf("lines") > -1, splitCharacters = type.indexOf("chars") > -1, splitWords = type.indexOf("words") > -1, onlySplitCharacters = splitCharacters && !splitWords && !splitLines, specialCharsRegEx = specialChars && ("push" in specialChars ? new RegExp("(?:" + specialChars.join("|") + ")", "gu") : specialChars), finalCharSplitRegEx = specialCharsRegEx ? new RegExp(specialCharsRegEx.source + "|" + _emojiSafeRegEx.source, "gu") : _emojiSafeRegEx, ignore = !!config3.ignore && _elements(config3.ignore), { orig, animTime, obs } = this._data, onSplitResult;
      if (splitCharacters || splitWords || splitLines) {
        this.elements.forEach((element, index) => {
          orig[index] = {
            element,
            html: element.innerHTML,
            ariaL: element.getAttribute("aria-label"),
            ariaH: element.getAttribute("aria-hidden")
          };
          aria === "auto" ? element.setAttribute("aria-label", (element.textContent || "").trim()) : aria === "hidden" && element.setAttribute("aria-hidden", "true");
          let chars = [], words = [], lines = [], charWrapper = splitCharacters ? _getWrapper("char", config3, chars) : null, wordWrapper = _getWrapper("word", config3, words), i2, curWord, smartWrapSpan, nextSibling;
          _splitWordsAndCharsRecursively(element, config3, wordWrapper, charWrapper, onlySplitCharacters, deepSlice && (splitLines || onlySplitCharacters), ignore, finalCharSplitRegEx, specialCharsRegEx, false);
          if (splitLines) {
            let nodes = _toArray(element.childNodes), wrapLine = _getLineWrapper(element, nodes, config3, lines), curNode, toRemove = [], lineStartIndex = 0, allBounds = nodes.map((n2) => n2.nodeType === 1 ? n2.getBoundingClientRect() : _emptyBounds), lastBounds = _emptyBounds;
            for (i2 = 0; i2 < nodes.length; i2++) {
              curNode = nodes[i2];
              if (curNode.nodeType === 1) {
                if (curNode.nodeName === "BR") {
                  toRemove.push(curNode);
                  wrapLine(lineStartIndex, i2 + 1);
                  lineStartIndex = i2 + 1;
                  lastBounds = allBounds[lineStartIndex];
                } else {
                  if (i2 && allBounds[i2].top > lastBounds.top && allBounds[i2].left <= lastBounds.left) {
                    wrapLine(lineStartIndex, i2);
                    lineStartIndex = i2;
                  }
                  lastBounds = allBounds[i2];
                }
              }
            }
            lineStartIndex < i2 && wrapLine(lineStartIndex, i2);
            toRemove.forEach((el) => {
              var _a;
              return (_a = el.parentNode) == null ? void 0 : _a.removeChild(el);
            });
          }
          if (!splitWords) {
            for (i2 = 0; i2 < words.length; i2++) {
              curWord = words[i2];
              if (splitCharacters || !curWord.nextSibling || curWord.nextSibling.nodeType !== 3) {
                if (smartWrap && !splitLines) {
                  smartWrapSpan = document.createElement("span");
                  smartWrapSpan.style.whiteSpace = "nowrap";
                  while (curWord.firstChild) {
                    smartWrapSpan.appendChild(curWord.firstChild);
                  }
                  curWord.replaceWith(smartWrapSpan);
                } else {
                  curWord.replaceWith(...curWord.childNodes);
                }
              } else {
                nextSibling = curWord.nextSibling;
                if (nextSibling && nextSibling.nodeType === 3) {
                  nextSibling.textContent = (curWord.textContent || "") + (nextSibling.textContent || "");
                  curWord.remove();
                }
              }
            }
            words.length = 0;
            element.normalize();
          }
          this.lines.push(...lines);
          this.words.push(...words);
          this.chars.push(...chars);
        });
        mask && this[mask] && this.masks.push(...this[mask].map((el) => {
          let maskEl = el.cloneNode();
          el.replaceWith(maskEl);
          maskEl.appendChild(el);
          el.className && (maskEl.className = el.className.replace(/(\b\w+\b)/g, "$1-mask"));
          maskEl.style.overflow = "clip";
          return maskEl;
        }));
      }
      this.isSplit = true;
      _fonts && (autoSplit ? _fonts.addEventListener("loadingdone", this._split) : _fonts.status === "loading" && console.warn("SplitText called before fonts loaded"));
      if ((onSplitResult = onSplit && onSplit(this)) && onSplitResult.totalTime) {
        this._data.anim = animTime ? onSplitResult.totalTime(animTime) : onSplitResult;
      }
      splitLines && autoSplit && this.elements.forEach((element, index) => {
        orig[index].width = element.offsetWidth;
        obs && obs.observe(element);
      });
      return this;
    }
    revert() {
      var _a, _b;
      let { orig, anim, obs } = this._data;
      obs && obs.disconnect();
      orig.forEach(({ element, html, ariaL, ariaH }) => {
        element.innerHTML = html;
        ariaL ? element.setAttribute("aria-label", ariaL) : element.removeAttribute("aria-label");
        ariaH ? element.setAttribute("aria-hidden", ariaH) : element.removeAttribute("aria-hidden");
      });
      this.chars.length = this.words.length = this.lines.length = orig.length = this.masks.length = 0;
      this.isSplit = false;
      _fonts == null ? void 0 : _fonts.removeEventListener("loadingdone", this._split);
      if (anim) {
        this._data.animTime = anim.totalTime();
        anim.revert();
      }
      (_b = (_a = this.vars).onRevert) == null ? void 0 : _b.call(_a, this);
      return this;
    }
    static create(elements, config3) {
      return new _SplitText2(elements, config3);
    }
    static register(core) {
      gsap2 = gsap2 || core || window.gsap;
      if (gsap2) {
        _toArray = gsap2.utils.toArray;
        _context2 = gsap2.core.context || _context2;
      }
      if (!_coreInitted2 && window.innerWidth > 0) {
        _fonts = document.fonts;
        _coreInitted2 = true;
      }
    }
  };
  _SplitText.version = "3.13.0";
  var SplitText = _SplitText;

  // js/Button.js
  gsapWithCSS.registerPlugin(SplitText);
  var Button = class {
    constructor(element) {
      this.element = element;
      console.log("button");
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.elements();
          this.splitWords();
          this.bind();
        });
      }
    }
    elements() {
      this.text = this.element.querySelector("div");
    }
    splitWords() {
      this.splitText = new SplitText(this.text, {
        type: "chars"
      });
    }
    bind() {
      this.element.addEventListener("mouseenter", () => {
        const tl = gsapWithCSS.timeline();
        tl.to(this.splitText.chars, {
          duration: 1,
          rotate: (index) => -10 + index / this.splitText.chars.length * 20,
          x: (index) => -5 + index / this.splitText.chars.length * 10,
          y: (index) => -5 * Math.abs(index - this.splitText.chars.length / 2) / (this.splitText.chars.length / 2),
          ease: "elastic.out(1, 0.3)",
          stagger: {
            amount: 0.6
          },
          scaleY: 0.5,
          transformOrigin: "center top"
        });
        tl.to(this.splitText.chars, {
          duration: 1,
          rotate: 0,
          x: 0,
          y: 0,
          ease: "elastic.out(1, 0.3)",
          overwrite: "auto",
          scaleY: 1,
          stagger: {
            amount: 0.6
          }
        }, "<0.3");
      });
    }
  };

  // js/Roller.js
  var Roller = class {
    constructor(element) {
      this.element = element;
      this.position = 0;
      this.elements();
      this.loader();
    }
    elements() {
      this.logos = this.element.querySelectorAll("img");
      this.logos.forEach((logo) => {
        this.loaded = false;
      });
    }
    loader() {
      let logosLoaded = 0;
      let logosToLoad = this.logos.length;
      const checkIfAllLoaded = () => {
        if (logosLoaded === logosToLoad) {
          this.sizing();
          this.update();
          console.log("execute update");
        }
      };
      this.logos.forEach((logo) => {
        if (logo.complete) {
          this.loaded = true;
          logosLoaded++;
          console.log("logos loaded", logosLoaded, logosToLoad);
          console.log(logosLoaded === logosToLoad);
          checkIfAllLoaded();
        } else {
          logo.addEventListener("load", () => {
            this.loaded = true;
            logosLoaded++;
            console.log("logos loaded", logosLoaded, logosToLoad);
            console.log(logosLoaded === logosToLoad);
            checkIfAllLoaded();
          });
        }
      });
      window.addEventListener("resize", () => {
        this.sizing();
      });
    }
    sizing() {
      this.totalWidth = this.logos[this.logos.length - 1].offsetWidth + this.logos[this.logos.length - 1].offsetLeft + (parseInt(getComputedStyle(this.element).gap) || 0) - this.element.offsetLeft;
      this.logos.forEach((logo) => {
        logo.startingWidth = logo.offsetWidth;
        logo.startingX = logo.offsetLeft - this.element.offsetLeft;
        logo.loop = 0;
      });
      let widestLogoWidth = 0;
      this.logos.forEach((logo) => {
        if (logo.offsetWidth > widestLogoWidth) {
          widestLogoWidth = logo.offsetWidth;
        }
      });
      gsapWithCSS.set(this.element, {
        width: Math.min(document.body.offsetWidth, this.totalWidth - widestLogoWidth)
      });
    }
    update() {
      this.ticker = () => {
        this.position -= 1;
        this.logos.forEach((logo, index) => {
          if (-this.position > logo.startingWidth + logo.startingX + logo.loop * this.totalWidth) {
            logo.loop++;
          }
          gsapWithCSS.set(logo, {
            x: logo.loop * this.totalWidth + this.position
          });
        });
      };
      gsapWithCSS.ticker.add(this.ticker);
    }
  };

  // js/Hex.js
  var Hex = class {
    constructor(element) {
      this.element = element;
      this.hexQ = 32;
      this.elements();
      this.build();
      this.place();
      this.sizing();
      this.animate();
      window.addEventListener("resize", this.sizing.bind(this));
    }
    elements() {
      this.bg = document.createElement("div");
      this.bgWrapper = document.createElement("div");
      this.bgWrapper.classList.add("bg-wrapper");
      this.bg.classList.add("bg");
      this.element.appendChild(this.bgWrapper);
      this.bgWrapper.appendChild(this.bg);
    }
    build() {
      for (let i2 = 0; i2 < this.hexQ; i2++) {
        const hex = document.createElement("div");
        hex.classList.add("hex");
        this.bg.appendChild(hex);
      }
      this.hexes = this.bg.querySelectorAll(".hex");
    }
    place() {
      const bgColor = getComputedStyle(this.hexes[0]).backgroundColor;
      const rgb = bgColor.match(/\d+/g).map(Number);
      this.hexes.forEach((hex, index) => {
        const col = index % 8;
        const row = Math.floor(index / 8);
        const rVar = Math.random() * 10;
        const gVar = Math.random() * 140 - 30;
        const bVar = Math.random() * 10;
        gsapWithCSS.set(hex, {
          xPercent: col * (93.3 - 6.7) - 6.7 + (93.3 - 6.7) / (row % 2 ? -4 : 4),
          yPercent: row * 75,
          backgroundColor: `rgb(${Math.max(0, Math.min(255, rgb[0] + rVar))}, ${Math.max(0, Math.min(255, rgb[1] + gVar))}, ${Math.max(0, Math.min(255, rgb[2] + bVar))})`
        });
      });
    }
    sizing() {
      gsapWithCSS.set(this.hexes, {
        width: this.bgWrapper.offsetHeight / 2
      });
      gsapWithCSS.set(this.bg, {
        height: this.hexes[0].getBoundingClientRect().height + this.hexes[0].getBoundingClientRect().height * 3 * 0.75,
        width: this.hexes[0].getBoundingClientRect().width * 8 * 0.866
      });
    }
    animate() {
      const tl = gsapWithCSS.timeline();
      tl.from(this.hexes, {
        opacity: 0,
        scale: 0.7,
        duration: 2,
        ease: "elastic.out(1, 0.3)",
        stagger: {
          grid: "auto",
          from: "center",
          each: 0.05,
          onComplete: function() {
            gsapWithCSS.to(this._targets[0], {
              opacity: 0,
              yoyo: true,
              duration: "random(0.5, 5)",
              delay: "random(0, 2)",
              repeat: -1
            });
          }
        },
        delay: 2
      });
      tl.to(this.hexes, {
        opacity: 0,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut",
        duration: "random(0.5, 5)",
        delay: "random(0, 2)"
      });
    }
  };

  // js/MovingHex.js
  var MovingHex = class {
    constructor(element) {
      this.element = element;
      this.slot = this.element.querySelector(".slot");
      this.create();
      this.position();
      this.animate();
    }
    create() {
      const hexQ = 48;
      this.hexWrapper = [document.createElement("div"), document.createElement("div")];
      this.hexWrapper.forEach((wrapper) => {
        wrapper.classList.add("hex-wrapper");
        if (this.slot) {
          this.slot.appendChild(wrapper);
          gsapWithCSS.set(this.slot, { position: "relative" });
        } else {
          this.element.appendChild(wrapper);
        }
      });
      gsapWithCSS.set(this.hexWrapper[1], {
        scaleX: -1,
        y: "-6rem"
      });
      for (let i2 = 0; i2 < hexQ; i2++) {
        const hexController = document.createElement("div");
        hexController.classList.add("hex-controller");
        const hex = document.createElement("div");
        hex.classList.add("hex");
        hexController.appendChild(hex);
        if (i2 < 24) {
          this.hexWrapper[0].appendChild(hexController);
        } else {
          this.hexWrapper[1].appendChild(hexController);
        }
      }
      this.hexWrapper.forEach((wrapper) => {
        wrapper.controllers = wrapper.querySelectorAll(".hex-controller");
      });
    }
    position() {
      this.hexWrapper.forEach((wrapper) => {
        wrapper.controllers.forEach((controller, index) => {
          const col = index % 4;
          const row = Math.floor(index / 4);
          gsapWithCSS.set(controller, {
            xPercent: ((col - 1) * (93.3 - 6.7) - 6.7 + (93.3 - 6.7) / (row % 2 ? -4 : 4)) * 1.1,
            yPercent: row * 75 * 1.1
          });
        });
      });
    }
    animate() {
      this.hexWrapper.forEach((wrapper) => {
        wrapper.controllers.forEach((controller, index) => {
          const hex = controller.querySelector(".hex");
          const duration = 3;
          gsapWithCSS.to(hex, {
            xPercent: (93.3 - 6.7) * 1.09,
            ease: "none",
            duration,
            repeat: -1
          });
          if (index % 4 === 0) {
            gsapWithCSS.from(hex, {
              autoAlpha: 0,
              rotate: -180,
              duration: duration - 1,
              ease: "elastic.out(1, 0.9)",
              repeat: -1,
              scale: 0,
              repeatDelay: duration - 2
            });
          }
          if (index % 4 === 1) {
            gsapWithCSS.to(hex, {
              scale: 0.7,
              duration,
              ease: "none",
              repeat: -1
            });
          }
          if (index % 4 === 2) {
            gsapWithCSS.fromTo(hex, {
              scale: 0.7
            }, {
              duration,
              ease: "none",
              repeat: -1,
              scale: 0.3
            });
          }
          if (index % 4 === 3) {
            gsapWithCSS.fromTo(hex, {
              autoAlpha: 1,
              scale: 0.3
            }, {
              autoAlpha: 0,
              duration,
              ease: "none",
              repeat: -1,
              scale: 0,
              rotate: 180
            });
          }
        });
      });
    }
  };

  // js/InteractiveHex.js
  var InteractiveHex = class {
    constructor(element) {
      this.element = element;
      this.canvas = null;
      this.gl = null;
      this.program = null;
      this.time = 0;
      this.mouseWorldX = 0;
      this.mouseWorldY = 0;
      this.isMouseOver = false;
      this.hoverZBoost = 0.5;
      this.hoverRadius = 3;
      this.animationSpeed = 0.3;
      this.zRange = 0.25;
      this.init();
    }
    init() {
      this.createCanvas();
      this.setupWebGL();
      this.createShaderProgram();
      this.setupBuffers();
      this.generateHexagons();
      this.setupMouseInteraction();
      this.animate();
    }
    createCanvas() {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "glCanvas";
      this.canvas.style.position = "absolute";
      this.canvas.style.top = "0";
      this.canvas.style.left = "0";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      this.element.style.position = "relative";
      this.element.appendChild(this.canvas);
      this.resize();
      window.addEventListener("resize", () => this.resize());
    }
    resize() {
      const rect = this.element.getBoundingClientRect();
      const canvasWidth = Math.floor(rect.width * 0.8);
      const canvasHeight = Math.floor(rect.height * 0.8);
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      if (this.gl) {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
      if (this.canvas.width > 0 && this.canvas.height > 0) {
        this.generateHexagons();
      }
    }
    setupWebGL() {
      this.gl = this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
      if (!this.gl) {
        console.error("WebGL not supported");
        return;
      }
      this.gl.enable(this.gl.DEPTH_TEST);
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.blendEquation(this.gl.FUNC_ADD);
      this.gl.clearColor(0.05, 0.05, 0.05, 1);
    }
    createShaderProgram() {
      const vertexShaderSource = `
            precision mediump float;
            
            attribute vec3 a_position;
            attribute vec3 a_normal;
            
            uniform mat4 u_modelViewMatrix;
            uniform mat4 u_projectionMatrix;
            uniform float u_time;
            uniform float u_zOffset;
            uniform float u_isShadow;
            uniform float u_scale;
            
            varying vec3 v_normal;
            varying vec3 v_position;
            varying float v_zDepth;
            varying vec2 v_originalPos;
            
            void main() {
                vec3 position = a_position;
                v_originalPos = a_position.xy;
                position.xy *= u_scale;
                
                if (u_isShadow > 0.5) {
                    position.xy *= 1.05;
                } else {
                    position.xy *= 0.97; // More visible embed effect
                }
                
                vec4 worldPosition = u_modelViewMatrix * vec4(position, 1.0);
                
                if (u_isShadow > 0.5) {
                    worldPosition.z += u_zOffset + 0.1;
                    worldPosition.x += 0.02;
                    worldPosition.y -= 0.02;
                } else {
                    worldPosition.z += u_zOffset;
                }
                
                v_position = worldPosition.xyz;
                v_normal = a_normal;
                v_zDepth = worldPosition.z;
                
                gl_Position = u_projectionMatrix * worldPosition;
            }
        `;
      const fragmentShaderSource = `
            precision mediump float;
            
            varying vec3 v_normal;
            varying vec3 v_position;
            varying float v_zDepth;
            varying vec2 v_originalPos;
            
            uniform float u_time;
            uniform float u_baseGray;
            uniform float u_isShadow;
            
            void main() {
                if (u_isShadow >= 0.5) {
                    float shadowAlpha = 0.3;
                    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
                } else {
                    vec3 baseColor = vec3(u_baseGray);
                    
                    float normalizedZ = clamp((v_zDepth + 20.0) / 0.15, 0.0, 1.0);
                    float shadowIntensity = 1.0 - normalizedZ * 0.2;
                    
                    vec3 lightDir = normalize(vec3(0.3, 0.4, 1.0));
                    float light = dot(normalize(v_normal), lightDir);
                    
                    // Rim lighting for embed effect - more obvious at top
                    vec2 pos = v_originalPos;
                    float hexRadius = 0.192;
                    float angle = atan(pos.y, pos.x);
                    float distFromCenter = length(pos);
                    float normalizedAngle = mod(angle + 1.5708, 1.0472);
                    float expectedRadius = hexRadius / cos(normalizedAngle - 0.5236);
                    float edgeDist = expectedRadius - distFromCenter;
                    
                    // Make edge detection tighter for 1px effect
                    float edgeFactor = smoothstep(0.0, hexRadius * 0.02, edgeDist);
                    
                    // Emphasize top edge (angle near -90 degrees / 1.5708)
                    float topEdgeFactor = 1.0 - clamp(abs(angle + 1.5708) / 0.5, 0.0, 1.0); // Stronger at top
                    
                    // Combine edge detection with top emphasis - clamp to prevent flares
                    float rimLight = clamp(edgeFactor * 0.25 * (0.5 + topEdgeFactor * 0.5), 0.0, 0.3);
                    
                    light = light * 0.5 + 0.5;
                    light = max(light, 0.3);
                    light = min(light + rimLight, 1.0); // Clamp to prevent over-brightening
                    
                    vec3 finalColor = baseColor * shadowIntensity * light;
                    finalColor = max(finalColor, vec3(0.05));
                    finalColor = finalColor * 1.1; // 10% brighter overall
                    finalColor = min(finalColor, vec3(1.0)); // Clamp to prevent over-brightening
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            }
        `;
      const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
      this.program = this.createProgram(vertexShader, fragmentShader);
      if (!this.program) {
        console.error("Failed to create shader program");
        return;
      }
      this.gl.useProgram(this.program);
      this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");
      this.normalLocation = this.gl.getAttribLocation(this.program, "a_normal");
      this.modelViewMatrixLocation = this.gl.getUniformLocation(this.program, "u_modelViewMatrix");
      this.projectionMatrixLocation = this.gl.getUniformLocation(this.program, "u_projectionMatrix");
      this.timeLocation = this.gl.getUniformLocation(this.program, "u_time");
      this.zOffsetLocation = this.gl.getUniformLocation(this.program, "u_zOffset");
      this.baseGrayLocation = this.gl.getUniformLocation(this.program, "u_baseGray");
      this.isShadowLocation = this.gl.getUniformLocation(this.program, "u_isShadow");
      this.scaleLocation = this.gl.getUniformLocation(this.program, "u_scale");
    }
    compileShader(type, source) {
      const shader = this.gl.createShader(type);
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
        return null;
      }
      return shader;
    }
    createProgram(vertexShader, fragmentShader) {
      const program = this.gl.createProgram();
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.error("Program linking error:", this.gl.getProgramInfoLog(program));
        this.gl.deleteProgram(program);
        return null;
      }
      return program;
    }
    createHexagon() {
      const vertices = [];
      const normals = [];
      const indices = [];
      const radius = 0.192;
      const center = [0, 0, 0];
      vertices.push(...center);
      normals.push(0, 0, 1);
      for (let i2 = 0; i2 < 6; i2++) {
        const angle = Math.PI / 3 * i2 - Math.PI / 2;
        const x = center[0] + radius * Math.cos(angle);
        const y = center[1] + radius * Math.sin(angle);
        const z = center[2];
        vertices.push(x, y, z);
        normals.push(0, 0, 1);
      }
      for (let i2 = 0; i2 < 6; i2++) {
        indices.push(0, (i2 + 1) % 6 + 1, i2 + 1);
      }
      return { vertices, normals, indices };
    }
    calculateGridSize() {
      const cameraZ = -20;
      const fov = Math.PI / 15;
      const distance = Math.abs(cameraZ);
      const aspect = this.canvas.width / this.canvas.height;
      const tanHalfFov = Math.tan(fov / 2);
      const visibleHeight = tanHalfFov * distance * 2;
      const visibleWidth = visibleHeight * aspect;
      const hexRadius = 0.192;
      const hexWidth = hexRadius * Math.sqrt(3);
      const hexHeight = hexRadius * 1.5;
      const cols = Math.ceil(visibleWidth * 1.2 / hexWidth);
      const rows = Math.ceil(visibleHeight * 1.2 / hexHeight);
      return { rows, cols, hexWidth, hexHeight };
    }
    generateHexCombPattern(rows, cols, hexWidth, hexHeight) {
      const hexagons = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const xOffset = row % 2 * (hexWidth / 2);
          const x = col * hexWidth + xOffset - cols * hexWidth / 2;
          const y = row * hexHeight - rows * hexHeight / 2;
          const z = 0;
          const minGray = 0.033 * 1.1;
          const maxGray = (0.033 + 0.099) * 0.9;
          const baseGray = minGray + Math.random() * (maxGray - minGray);
          const phaseOffset = Math.random() * Math.PI * 2;
          hexagons.push({
            x,
            y,
            z,
            baseGray,
            phaseOffset
          });
        }
      }
      return hexagons;
    }
    setupBuffers() {
      const hexData = this.createHexagon();
      this.hexData = hexData;
      this.hexVertexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexVertexBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(hexData.vertices), this.gl.STATIC_DRAW);
      this.hexNormalBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexNormalBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(hexData.normals), this.gl.STATIC_DRAW);
      this.hexIndexBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.hexIndexBuffer);
      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(hexData.indices), this.gl.STATIC_DRAW);
    }
    generateHexagons() {
      if (!this.canvas || !this.canvas.width || !this.canvas.height) {
        this.hexagons = this.generateHexCombPattern(30, 40, 0.192 * Math.sqrt(3), 0.192 * 1.5);
        return;
      }
      const { rows, cols, hexWidth, hexHeight } = this.calculateGridSize();
      this.hexagons = this.generateHexCombPattern(rows, cols, hexWidth, hexHeight);
    }
    createPerspectiveMatrix(fov, aspect, near, far) {
      const f2 = 1 / Math.tan(fov / 2);
      const rangeInv = 1 / (near - far);
      return [
        f2 / aspect,
        0,
        0,
        0,
        0,
        f2,
        0,
        0,
        0,
        0,
        (near + far) * rangeInv,
        -1,
        0,
        0,
        near * far * rangeInv * 2,
        0
      ];
    }
    createOrthographicMatrix(left, right, bottom, top, near, far) {
      const lr = 1 / (left - right);
      const bt = 1 / (bottom - top);
      const nf = 1 / (near - far);
      return [
        -2 * lr,
        0,
        0,
        0,
        0,
        -2 * bt,
        0,
        0,
        0,
        0,
        2 * nf,
        0,
        (left + right) * lr,
        (top + bottom) * bt,
        (far + near) * nf,
        1
      ];
    }
    createModelViewMatrix(x, y, z) {
      const cameraZ = -20;
      return [
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        x,
        y,
        z + cameraZ,
        1
      ];
    }
    setupMouseInteraction() {
      const updateMousePosition = (e2) => {
        const rect = this.element.getBoundingClientRect();
        const x = e2.clientX - rect.left;
        const y = e2.clientY - rect.top;
        const clampedX = Math.max(0, Math.min(rect.width, x));
        const clampedY = Math.max(0, Math.min(rect.height, y));
        const canvasX = clampedX / rect.width * this.canvas.width;
        const canvasY = clampedY / rect.height * this.canvas.height;
        const ndcX = canvasX / this.canvas.width * 2 - 1;
        const ndcY = 1 - canvasY / this.canvas.height * 2;
        const aspect = this.canvas.width / this.canvas.height;
        const fov = Math.PI / 15;
        const cameraZ = -20;
        const distance = Math.abs(cameraZ);
        const tanHalfFov = Math.tan(fov / 2);
        this.mouseWorldY = tanHalfFov * distance * ndcY;
        this.mouseWorldX = tanHalfFov * distance * aspect * ndcX;
        this.isMouseOver = true;
      };
      document.addEventListener("mousemove", updateMousePosition);
    }
    getHoverEffect(hexX, hexY, baseZOffset) {
      if (!this.isMouseOver) return { zBoost: 0, scale: 1 };
      const dx = this.mouseWorldX - hexX;
      const dy = this.mouseWorldY - hexY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.hoverRadius) {
        const factor = 1 - dist / this.hoverRadius;
        const easedFactor = factor * factor * factor;
        const targetZ = this.zRange + this.hoverZBoost;
        const currentZ = baseZOffset;
        const zBoost = (targetZ - currentZ) * easedFactor;
        return {
          zBoost,
          scale: 1
        };
      }
      return { zBoost: 0, scale: 1 };
    }
    animate() {
      this.time += 8e-3;
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
      const aspect = this.canvas.width / this.canvas.height;
      const fov = Math.PI / 15;
      const projectionMatrix = this.createPerspectiveMatrix(fov, aspect, 0.1, 100);
      this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, projectionMatrix);
      this.gl.uniform1f(this.timeLocation, this.time);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexVertexBuffer);
      this.gl.enableVertexAttribArray(this.positionLocation);
      this.gl.vertexAttribPointer(this.positionLocation, 3, this.gl.FLOAT, false, 0, 0);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.hexNormalBuffer);
      this.gl.enableVertexAttribArray(this.normalLocation);
      this.gl.vertexAttribPointer(this.normalLocation, 3, this.gl.FLOAT, false, 0, 0);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.hexIndexBuffer);
      this.gl.depthMask(true);
      this.gl.uniform1f(this.isShadowLocation, 0);
      this.hexagons.forEach((hex) => {
        const baseZOffset = Math.sin(this.time * this.animationSpeed + hex.phaseOffset) * this.zRange;
        const hoverEffect = this.getHoverEffect(hex.x, hex.y, baseZOffset);
        const zOffset = baseZOffset + hoverEffect.zBoost;
        const modelViewMatrix = this.createModelViewMatrix(hex.x, hex.y, hex.z);
        this.gl.uniformMatrix4fv(this.modelViewMatrixLocation, false, modelViewMatrix);
        this.gl.uniform1f(this.zOffsetLocation, zOffset);
        this.gl.uniform1f(this.baseGrayLocation, hex.baseGray);
        this.gl.uniform1f(this.scaleLocation, hoverEffect.scale);
        this.gl.drawElements(this.gl.TRIANGLES, this.hexData.indices.length, this.gl.UNSIGNED_SHORT, 0);
      });
      requestAnimationFrame(() => this.animate());
    }
  };

  // node_modules/gsap/utils/paths.js
  var _svgPathExp = /[achlmqstvz]|(-?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig;
  var _scientific = /[\+\-]?\d*\.?\d+e[\+\-]?\d+/ig;
  var _DEG2RAD2 = Math.PI / 180;
  var _RAD2DEG2 = 180 / Math.PI;
  var _sin2 = Math.sin;
  var _cos2 = Math.cos;
  var _abs = Math.abs;
  var _sqrt2 = Math.sqrt;
  var _isNumber3 = function _isNumber4(value) {
    return typeof value === "number";
  };
  var _roundingNum = 1e5;
  var _round3 = function _round4(value) {
    return Math.round(value * _roundingNum) / _roundingNum || 0;
  };
  function transformRawPath(rawPath, a2, b, c2, d2, tx, ty) {
    var j = rawPath.length, segment, l2, i2, x, y;
    while (--j > -1) {
      segment = rawPath[j];
      l2 = segment.length;
      for (i2 = 0; i2 < l2; i2 += 2) {
        x = segment[i2];
        y = segment[i2 + 1];
        segment[i2] = x * a2 + y * c2 + tx;
        segment[i2 + 1] = x * b + y * d2 + ty;
      }
    }
    rawPath._dirty = 1;
    return rawPath;
  }
  function arcToSegment(lastX, lastY, rx, ry, angle, largeArcFlag, sweepFlag, x, y) {
    if (lastX === x && lastY === y) {
      return;
    }
    rx = _abs(rx);
    ry = _abs(ry);
    var angleRad = angle % 360 * _DEG2RAD2, cosAngle = _cos2(angleRad), sinAngle = _sin2(angleRad), PI = Math.PI, TWOPI = PI * 2, dx2 = (lastX - x) / 2, dy2 = (lastY - y) / 2, x1 = cosAngle * dx2 + sinAngle * dy2, y1 = -sinAngle * dx2 + cosAngle * dy2, x1_sq = x1 * x1, y1_sq = y1 * y1, radiiCheck = x1_sq / (rx * rx) + y1_sq / (ry * ry);
    if (radiiCheck > 1) {
      rx = _sqrt2(radiiCheck) * rx;
      ry = _sqrt2(radiiCheck) * ry;
    }
    var rx_sq = rx * rx, ry_sq = ry * ry, sq = (rx_sq * ry_sq - rx_sq * y1_sq - ry_sq * x1_sq) / (rx_sq * y1_sq + ry_sq * x1_sq);
    if (sq < 0) {
      sq = 0;
    }
    var coef = (largeArcFlag === sweepFlag ? -1 : 1) * _sqrt2(sq), cx1 = coef * (rx * y1 / ry), cy1 = coef * -(ry * x1 / rx), sx2 = (lastX + x) / 2, sy2 = (lastY + y) / 2, cx = sx2 + (cosAngle * cx1 - sinAngle * cy1), cy = sy2 + (sinAngle * cx1 + cosAngle * cy1), ux = (x1 - cx1) / rx, uy = (y1 - cy1) / ry, vx = (-x1 - cx1) / rx, vy = (-y1 - cy1) / ry, temp = ux * ux + uy * uy, angleStart = (uy < 0 ? -1 : 1) * Math.acos(ux / _sqrt2(temp)), angleExtent = (ux * vy - uy * vx < 0 ? -1 : 1) * Math.acos((ux * vx + uy * vy) / _sqrt2(temp * (vx * vx + vy * vy)));
    isNaN(angleExtent) && (angleExtent = PI);
    if (!sweepFlag && angleExtent > 0) {
      angleExtent -= TWOPI;
    } else if (sweepFlag && angleExtent < 0) {
      angleExtent += TWOPI;
    }
    angleStart %= TWOPI;
    angleExtent %= TWOPI;
    var segments = Math.ceil(_abs(angleExtent) / (TWOPI / 4)), rawPath = [], angleIncrement = angleExtent / segments, controlLength = 4 / 3 * _sin2(angleIncrement / 2) / (1 + _cos2(angleIncrement / 2)), ma = cosAngle * rx, mb = sinAngle * rx, mc = sinAngle * -ry, md = cosAngle * ry, i2;
    for (i2 = 0; i2 < segments; i2++) {
      angle = angleStart + i2 * angleIncrement;
      x1 = _cos2(angle);
      y1 = _sin2(angle);
      ux = _cos2(angle += angleIncrement);
      uy = _sin2(angle);
      rawPath.push(x1 - controlLength * y1, y1 + controlLength * x1, ux + controlLength * uy, uy - controlLength * ux, ux, uy);
    }
    for (i2 = 0; i2 < rawPath.length; i2 += 2) {
      x1 = rawPath[i2];
      y1 = rawPath[i2 + 1];
      rawPath[i2] = x1 * ma + y1 * mc + cx;
      rawPath[i2 + 1] = x1 * mb + y1 * md + cy;
    }
    rawPath[i2 - 2] = x;
    rawPath[i2 - 1] = y;
    return rawPath;
  }
  function stringToRawPath(d2) {
    var a2 = (d2 + "").replace(_scientific, function(m) {
      var n2 = +m;
      return n2 < 1e-4 && n2 > -1e-4 ? 0 : n2;
    }).match(_svgPathExp) || [], path = [], relativeX = 0, relativeY = 0, twoThirds = 2 / 3, elements = a2.length, points = 0, errorMessage = "ERROR: malformed path: " + d2, i2, j, x, y, command, isRelative, segment, startX, startY, difX, difY, beziers, prevCommand, flag1, flag2, line = function line2(sx, sy, ex, ey) {
      difX = (ex - sx) / 3;
      difY = (ey - sy) / 3;
      segment.push(sx + difX, sy + difY, ex - difX, ey - difY, ex, ey);
    };
    if (!d2 || !isNaN(a2[0]) || isNaN(a2[1])) {
      console.log(errorMessage);
      return path;
    }
    for (i2 = 0; i2 < elements; i2++) {
      prevCommand = command;
      if (isNaN(a2[i2])) {
        command = a2[i2].toUpperCase();
        isRelative = command !== a2[i2];
      } else {
        i2--;
      }
      x = +a2[i2 + 1];
      y = +a2[i2 + 2];
      if (isRelative) {
        x += relativeX;
        y += relativeY;
      }
      if (!i2) {
        startX = x;
        startY = y;
      }
      if (command === "M") {
        if (segment) {
          if (segment.length < 8) {
            path.length -= 1;
          } else {
            points += segment.length;
          }
        }
        relativeX = startX = x;
        relativeY = startY = y;
        segment = [x, y];
        path.push(segment);
        i2 += 2;
        command = "L";
      } else if (command === "C") {
        if (!segment) {
          segment = [0, 0];
        }
        if (!isRelative) {
          relativeX = relativeY = 0;
        }
        segment.push(x, y, relativeX + a2[i2 + 3] * 1, relativeY + a2[i2 + 4] * 1, relativeX += a2[i2 + 5] * 1, relativeY += a2[i2 + 6] * 1);
        i2 += 6;
      } else if (command === "S") {
        difX = relativeX;
        difY = relativeY;
        if (prevCommand === "C" || prevCommand === "S") {
          difX += relativeX - segment[segment.length - 4];
          difY += relativeY - segment[segment.length - 3];
        }
        if (!isRelative) {
          relativeX = relativeY = 0;
        }
        segment.push(difX, difY, x, y, relativeX += a2[i2 + 3] * 1, relativeY += a2[i2 + 4] * 1);
        i2 += 4;
      } else if (command === "Q") {
        difX = relativeX + (x - relativeX) * twoThirds;
        difY = relativeY + (y - relativeY) * twoThirds;
        if (!isRelative) {
          relativeX = relativeY = 0;
        }
        relativeX += a2[i2 + 3] * 1;
        relativeY += a2[i2 + 4] * 1;
        segment.push(difX, difY, relativeX + (x - relativeX) * twoThirds, relativeY + (y - relativeY) * twoThirds, relativeX, relativeY);
        i2 += 4;
      } else if (command === "T") {
        difX = relativeX - segment[segment.length - 4];
        difY = relativeY - segment[segment.length - 3];
        segment.push(relativeX + difX, relativeY + difY, x + (relativeX + difX * 1.5 - x) * twoThirds, y + (relativeY + difY * 1.5 - y) * twoThirds, relativeX = x, relativeY = y);
        i2 += 2;
      } else if (command === "H") {
        line(relativeX, relativeY, relativeX = x, relativeY);
        i2 += 1;
      } else if (command === "V") {
        line(relativeX, relativeY, relativeX, relativeY = x + (isRelative ? relativeY - relativeX : 0));
        i2 += 1;
      } else if (command === "L" || command === "Z") {
        if (command === "Z") {
          x = startX;
          y = startY;
          segment.closed = true;
        }
        if (command === "L" || _abs(relativeX - x) > 0.5 || _abs(relativeY - y) > 0.5) {
          line(relativeX, relativeY, x, y);
          if (command === "L") {
            i2 += 2;
          }
        }
        relativeX = x;
        relativeY = y;
      } else if (command === "A") {
        flag1 = a2[i2 + 4];
        flag2 = a2[i2 + 5];
        difX = a2[i2 + 6];
        difY = a2[i2 + 7];
        j = 7;
        if (flag1.length > 1) {
          if (flag1.length < 3) {
            difY = difX;
            difX = flag2;
            j--;
          } else {
            difY = flag2;
            difX = flag1.substr(2);
            j -= 2;
          }
          flag2 = flag1.charAt(1);
          flag1 = flag1.charAt(0);
        }
        beziers = arcToSegment(relativeX, relativeY, +a2[i2 + 1], +a2[i2 + 2], +a2[i2 + 3], +flag1, +flag2, (isRelative ? relativeX : 0) + difX * 1, (isRelative ? relativeY : 0) + difY * 1);
        i2 += j;
        if (beziers) {
          for (j = 0; j < beziers.length; j++) {
            segment.push(beziers[j]);
          }
        }
        relativeX = segment[segment.length - 2];
        relativeY = segment[segment.length - 1];
      } else {
        console.log(errorMessage);
      }
    }
    i2 = segment.length;
    if (i2 < 6) {
      path.pop();
      i2 = 0;
    } else if (segment[0] === segment[i2 - 2] && segment[1] === segment[i2 - 1]) {
      segment.closed = true;
    }
    path.totalPoints = points + i2;
    return path;
  }
  function rawPathToString(rawPath) {
    if (_isNumber3(rawPath[0])) {
      rawPath = [rawPath];
    }
    var result = "", l2 = rawPath.length, sl, s2, i2, segment;
    for (s2 = 0; s2 < l2; s2++) {
      segment = rawPath[s2];
      result += "M" + _round3(segment[0]) + "," + _round3(segment[1]) + " C";
      sl = segment.length;
      for (i2 = 2; i2 < sl; i2++) {
        result += _round3(segment[i2++]) + "," + _round3(segment[i2++]) + " " + _round3(segment[i2++]) + "," + _round3(segment[i2++]) + " " + _round3(segment[i2++]) + "," + _round3(segment[i2]) + " ";
      }
      if (segment.closed) {
        result += "z";
      }
    }
    return result;
  }

  // node_modules/gsap/CustomEase.js
  var gsap3;
  var _coreInitted3;
  var _getGSAP = function _getGSAP2() {
    return gsap3 || typeof window !== "undefined" && (gsap3 = window.gsap) && gsap3.registerPlugin && gsap3;
  };
  var _initCore3 = function _initCore4() {
    gsap3 = _getGSAP();
    if (gsap3) {
      gsap3.registerEase("_CE", CustomEase.create);
      _coreInitted3 = 1;
    } else {
      console.warn("Please gsap.registerPlugin(CustomEase)");
    }
  };
  var _bigNum3 = 1e20;
  var _round5 = function _round6(value) {
    return ~~(value * 1e3 + (value < 0 ? -0.5 : 0.5)) / 1e3;
  };
  var _bonusValidated = 1;
  var _numExp2 = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/gi;
  var _needsParsingExp = /[cLlsSaAhHvVtTqQ]/g;
  var _findMinimum = function _findMinimum2(values) {
    var l2 = values.length, min = _bigNum3, i2;
    for (i2 = 1; i2 < l2; i2 += 6) {
      +values[i2] < min && (min = +values[i2]);
    }
    return min;
  };
  var _normalize = function _normalize2(values, height, originY) {
    if (!originY && originY !== 0) {
      originY = Math.max(+values[values.length - 1], +values[1]);
    }
    var tx = +values[0] * -1, ty = -originY, l2 = values.length, sx = 1 / (+values[l2 - 2] + tx), sy = -height || (Math.abs(+values[l2 - 1] - +values[1]) < 0.01 * (+values[l2 - 2] - +values[0]) ? _findMinimum(values) + ty : +values[l2 - 1] + ty), i2;
    if (sy) {
      sy = 1 / sy;
    } else {
      sy = -sx;
    }
    for (i2 = 0; i2 < l2; i2 += 2) {
      values[i2] = (+values[i2] + tx) * sx;
      values[i2 + 1] = (+values[i2 + 1] + ty) * sy;
    }
  };
  var _bezierToPoints = function _bezierToPoints2(x1, y1, x2, y2, x3, y3, x4, y4, threshold, points, index) {
    var x12 = (x1 + x2) / 2, y12 = (y1 + y2) / 2, x23 = (x2 + x3) / 2, y23 = (y2 + y3) / 2, x34 = (x3 + x4) / 2, y34 = (y3 + y4) / 2, x123 = (x12 + x23) / 2, y123 = (y12 + y23) / 2, x234 = (x23 + x34) / 2, y234 = (y23 + y34) / 2, x1234 = (x123 + x234) / 2, y1234 = (y123 + y234) / 2, dx = x4 - x1, dy = y4 - y1, d2 = Math.abs((x2 - x4) * dy - (y2 - y4) * dx), d3 = Math.abs((x3 - x4) * dy - (y3 - y4) * dx), length;
    if (!points) {
      points = [{
        x: x1,
        y: y1
      }, {
        x: x4,
        y: y4
      }];
      index = 1;
    }
    points.splice(index || points.length - 1, 0, {
      x: x1234,
      y: y1234
    });
    if ((d2 + d3) * (d2 + d3) > threshold * (dx * dx + dy * dy)) {
      length = points.length;
      _bezierToPoints2(x1, y1, x12, y12, x123, y123, x1234, y1234, threshold, points, index);
      _bezierToPoints2(x1234, y1234, x234, y234, x34, y34, x4, y4, threshold, points, index + 1 + (points.length - length));
    }
    return points;
  };
  var CustomEase = /* @__PURE__ */ function() {
    function CustomEase2(id, data, config3) {
      _coreInitted3 || _initCore3();
      this.id = id;
      _bonusValidated && this.setData(data, config3);
    }
    var _proto = CustomEase2.prototype;
    _proto.setData = function setData(data, config3) {
      config3 = config3 || {};
      data = data || "0,0,1,1";
      var values = data.match(_numExp2), closest = 1, points = [], lookup = [], precision = config3.precision || 1, fast = precision <= 1, l2, a1, a2, i2, inc, j, point, prevPoint, p2;
      this.data = data;
      if (_needsParsingExp.test(data) || ~data.indexOf("M") && data.indexOf("C") < 0) {
        values = stringToRawPath(data)[0];
      }
      l2 = values.length;
      if (l2 === 4) {
        values.unshift(0, 0);
        values.push(1, 1);
        l2 = 8;
      } else if ((l2 - 2) % 6) {
        throw "Invalid CustomEase";
      }
      if (+values[0] !== 0 || +values[l2 - 2] !== 1) {
        _normalize(values, config3.height, config3.originY);
      }
      this.segment = values;
      for (i2 = 2; i2 < l2; i2 += 6) {
        a1 = {
          x: +values[i2 - 2],
          y: +values[i2 - 1]
        };
        a2 = {
          x: +values[i2 + 4],
          y: +values[i2 + 5]
        };
        points.push(a1, a2);
        _bezierToPoints(a1.x, a1.y, +values[i2], +values[i2 + 1], +values[i2 + 2], +values[i2 + 3], a2.x, a2.y, 1 / (precision * 2e5), points, points.length - 1);
      }
      l2 = points.length;
      for (i2 = 0; i2 < l2; i2++) {
        point = points[i2];
        prevPoint = points[i2 - 1] || point;
        if ((point.x > prevPoint.x || prevPoint.y !== point.y && prevPoint.x === point.x || point === prevPoint) && point.x <= 1) {
          prevPoint.cx = point.x - prevPoint.x;
          prevPoint.cy = point.y - prevPoint.y;
          prevPoint.n = point;
          prevPoint.nx = point.x;
          if (fast && i2 > 1 && Math.abs(prevPoint.cy / prevPoint.cx - points[i2 - 2].cy / points[i2 - 2].cx) > 2) {
            fast = 0;
          }
          if (prevPoint.cx < closest) {
            if (!prevPoint.cx) {
              prevPoint.cx = 1e-3;
              if (i2 === l2 - 1) {
                prevPoint.x -= 1e-3;
                closest = Math.min(closest, 1e-3);
                fast = 0;
              }
            } else {
              closest = prevPoint.cx;
            }
          }
        } else {
          points.splice(i2--, 1);
          l2--;
        }
      }
      l2 = 1 / closest + 1 | 0;
      inc = 1 / l2;
      j = 0;
      point = points[0];
      if (fast) {
        for (i2 = 0; i2 < l2; i2++) {
          p2 = i2 * inc;
          if (point.nx < p2) {
            point = points[++j];
          }
          a1 = point.y + (p2 - point.x) / point.cx * point.cy;
          lookup[i2] = {
            x: p2,
            cx: inc,
            y: a1,
            cy: 0,
            nx: 9
          };
          if (i2) {
            lookup[i2 - 1].cy = a1 - lookup[i2 - 1].y;
          }
        }
        j = points[points.length - 1];
        lookup[l2 - 1].cy = j.y - a1;
        lookup[l2 - 1].cx = j.x - lookup[lookup.length - 1].x;
      } else {
        for (i2 = 0; i2 < l2; i2++) {
          if (point.nx < i2 * inc) {
            point = points[++j];
          }
          lookup[i2] = point;
        }
        if (j < points.length - 1) {
          lookup[i2 - 1] = points[points.length - 2];
        }
      }
      this.ease = function(p3) {
        var point2 = lookup[p3 * l2 | 0] || lookup[l2 - 1];
        if (point2.nx < p3) {
          point2 = point2.n;
        }
        return point2.y + (p3 - point2.x) / point2.cx * point2.cy;
      };
      this.ease.custom = this;
      this.id && gsap3 && gsap3.registerEase(this.id, this.ease);
      return this;
    };
    _proto.getSVGData = function getSVGData(config3) {
      return CustomEase2.getSVGData(this, config3);
    };
    CustomEase2.create = function create(id, data, config3) {
      return new CustomEase2(id, data, config3).ease;
    };
    CustomEase2.register = function register(core) {
      gsap3 = core;
      _initCore3();
    };
    CustomEase2.get = function get(id) {
      return gsap3.parseEase(id);
    };
    CustomEase2.getSVGData = function getSVGData(ease, config3) {
      config3 = config3 || {};
      var width = config3.width || 100, height = config3.height || 100, x = config3.x || 0, y = (config3.y || 0) + height, e2 = gsap3.utils.toArray(config3.path)[0], a2, slope, i2, inc, tx, ty, precision, threshold, prevX, prevY;
      if (config3.invert) {
        height = -height;
        y = 0;
      }
      if (typeof ease === "string") {
        ease = gsap3.parseEase(ease);
      }
      if (ease.custom) {
        ease = ease.custom;
      }
      if (ease instanceof CustomEase2) {
        a2 = rawPathToString(transformRawPath([ease.segment], width, 0, 0, -height, x, y));
      } else {
        a2 = [x, y];
        precision = Math.max(5, (config3.precision || 1) * 200);
        inc = 1 / precision;
        precision += 2;
        threshold = 5 / precision;
        prevX = _round5(x + inc * width);
        prevY = _round5(y + ease(inc) * -height);
        slope = (prevY - y) / (prevX - x);
        for (i2 = 2; i2 < precision; i2++) {
          tx = _round5(x + i2 * inc * width);
          ty = _round5(y + ease(i2 * inc) * -height);
          if (Math.abs((ty - prevY) / (tx - prevX) - slope) > threshold || i2 === precision - 1) {
            a2.push(prevX, prevY);
            slope = (ty - prevY) / (tx - prevX);
          }
          prevX = tx;
          prevY = ty;
        }
        a2 = "M" + a2.join(",");
      }
      e2 && e2.setAttribute("d", a2);
      return a2;
    };
    return CustomEase2;
  }();
  CustomEase.version = "3.13.0";
  CustomEase.headless = true;
  _getGSAP() && gsap3.registerPlugin(CustomEase);

  // node_modules/gsap/CustomBounce.js
  var gsap4;
  var _coreInitted4;
  var createCustomEase;
  var _getGSAP3 = function _getGSAP4() {
    return gsap4 || typeof window !== "undefined" && (gsap4 = window.gsap) && gsap4.registerPlugin && gsap4;
  };
  var _initCore5 = function _initCore6(required) {
    gsap4 = _getGSAP3();
    createCustomEase = gsap4 && gsap4.parseEase("_CE");
    if (createCustomEase) {
      _coreInitted4 = 1;
      gsap4.parseEase("bounce").config = function(vars) {
        return typeof vars === "object" ? _create("", vars) : _create("bounce(" + vars + ")", {
          strength: +vars
        });
      };
    } else {
      required && console.warn("Please gsap.registerPlugin(CustomEase, CustomBounce)");
    }
  };
  var _normalizeX = function _normalizeX2(a2) {
    var l2 = a2.length, s2 = 1 / a2[l2 - 2], rnd = 1e3, i2;
    for (i2 = 2; i2 < l2; i2 += 2) {
      a2[i2] = ~~(a2[i2] * s2 * rnd) / rnd;
    }
    a2[l2 - 2] = 1;
  };
  var _bonusValidated2 = 1;
  var _create = function _create2(id, vars) {
    if (!_coreInitted4) {
      _initCore5(1);
    }
    vars = vars || {};
    if (_bonusValidated2) {
      var max = 0.999, decay = Math.min(max, vars.strength || 0.7), decayX = decay, gap = (vars.squash || 0) / 100, originalGap = gap, slope = 1 / 0.03, w = 0.2, h2 = 1, prevX = 0.1, path = [0, 0, 0.07, 0, 0.1, 1, 0.1, 1], squashPath = [0, 0, 0, 0, 0.1, 0, 0.1, 0], cp1, cp2, x, y, i2, nextX, squishMagnitude;
      for (i2 = 0; i2 < 200; i2++) {
        w *= decayX * ((decayX + 1) / 2);
        h2 *= decay * decay;
        nextX = prevX + w;
        x = prevX + w * 0.49;
        y = 1 - h2;
        cp1 = prevX + h2 / slope;
        cp2 = x + (x - cp1) * 0.8;
        if (gap) {
          prevX += gap;
          cp1 += gap;
          x += gap;
          cp2 += gap;
          nextX += gap;
          squishMagnitude = gap / originalGap;
          squashPath.push(
            prevX - gap,
            0,
            prevX - gap,
            squishMagnitude,
            prevX - gap / 2,
            squishMagnitude,
            //center peak anchor
            prevX,
            squishMagnitude,
            prevX,
            0,
            prevX,
            0,
            //base anchor
            prevX,
            squishMagnitude * -0.6,
            prevX + (nextX - prevX) / 6,
            0,
            nextX,
            0
          );
          path.push(prevX - gap, 1, prevX, 1, prevX, 1);
          gap *= decay * decay;
        }
        path.push(prevX, 1, cp1, y, x, y, cp2, y, nextX, 1, nextX, 1);
        decay *= 0.95;
        slope = h2 / (nextX - cp2);
        prevX = nextX;
        if (y > max) {
          break;
        }
      }
      if (vars.endAtStart && vars.endAtStart !== "false") {
        x = -0.1;
        path.unshift(x, 1, x, 1, -0.07, 0);
        if (originalGap) {
          gap = originalGap * 2.5;
          x -= gap;
          path.unshift(x, 1, x, 1, x, 1);
          squashPath.splice(0, 6);
          squashPath.unshift(x, 0, x, 0, x, 1, x + gap / 2, 1, x + gap, 1, x + gap, 0, x + gap, 0, x + gap, -0.6, x + gap + 0.033, 0);
          for (i2 = 0; i2 < squashPath.length; i2 += 2) {
            squashPath[i2] -= x;
          }
        }
        for (i2 = 0; i2 < path.length; i2 += 2) {
          path[i2] -= x;
          path[i2 + 1] = 1 - path[i2 + 1];
        }
      }
      if (gap) {
        _normalizeX(squashPath);
        squashPath[2] = "C" + squashPath[2];
        createCustomEase(vars.squashID || id + "-squash", "M" + squashPath.join(","));
      }
      _normalizeX(path);
      path[2] = "C" + path[2];
      return createCustomEase(id, "M" + path.join(","));
    }
  };
  var CustomBounce = /* @__PURE__ */ function() {
    function CustomBounce2(id, vars) {
      this.ease = _create(id, vars);
    }
    CustomBounce2.create = function create(id, vars) {
      return _create(id, vars);
    };
    CustomBounce2.register = function register(core) {
      gsap4 = core;
      _initCore5();
    };
    return CustomBounce2;
  }();
  _getGSAP3() && gsap4.registerPlugin(CustomBounce);
  CustomBounce.version = "3.13.0";

  // js/Diction.js
  var Diction = class {
    constructor(element) {
      gsapWithCSS.registerPlugin(CustomEase, CustomBounce);
      this.element = element;
      this.elements();
      this.create();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.split();
          this.animate();
        });
      } else {
        this.split();
        this.animate();
      }
    }
    elements() {
      this.text = this.element.querySelector(".anim-diction");
      console.log(this.text);
      this.color1 = getComputedStyle(this.text).getPropertyValue("--color1");
      this.color2 = getComputedStyle(this.text).getPropertyValue("--color2");
    }
    create() {
      this.dot = document.createElement("div");
      this.dot.classList.add("dot");
      this.text.appendChild(this.dot);
    }
    split() {
      this.splitText = new SplitText(this.text, {
        type: "words, chars",
        classes: "char"
      });
      splitTextGradient(this.text, this.splitText.chars);
    }
    animate() {
      gsapWithCSS.set(this.dot, {
        autoAlpha: 0,
        backgroundColor: this.color1
      });
      gsapWithCSS.set(this.splitText.chars, {
        opacity: 0,
        scaleY: 0,
        transformOrigin: this.direction === "over" ? "center top" : "center bottom"
      });
      const tl = gsapWithCSS.timeline({
        scrollTrigger: {
          trigger: this.text,
          start: "top 90%",
          end: "bottom 30%"
        }
      });
      tl.to(this.splitText.chars, {
        opacity: 1,
        scaleY: 1,
        duration: 1,
        stagger: {
          amount: 1
        },
        ease: "elastic.out(1, 0.7)"
      }, 0);
      tl.to(this.dot, {
        autoAlpha: 1,
        duration: 0.2,
        ease: "none"
      }, 0);
      tl.to(this.dot, {
        left: "calc(100% - 0.5rem)",
        backgroundColor: this.color2,
        duration: 2,
        // ease: "none",
        ease: "power1.out"
      }, 0);
      tl.fromTo(this.dot, {
        top: this.direction === "over" ? "-40%" : "140%"
      }, {
        top: this.direction === "over" ? "20%" : "80%",
        duration: 4,
        ease: "bounce({strength:4, endAtStart:false})"
      }, 0);
      tl.to(this.dot, {
        autoAlpha: 0,
        duration: 0.2,
        ease: "none"
      }, 1.8);
    }
  };

  // js/Megamenu.js
  var Megamenu = class {
    constructor(element) {
      this.element = element;
      this.isShowing = false;
      this.currentTarget = null;
      this.isMobileMenuOpen = false;
      this.elements();
      this.binds();
      this.update();
      this.sizing();
      this.spotlight();
      window.addEventListener("resize", () => {
        this.sizing();
      });
    }
    elements() {
      this.wrapper = this.element.querySelector(".header-megamenu");
      this.logo = this.element.querySelector(".header-logo");
      this.menu = this.element.querySelector(".header-menu");
      this.productsMobile = this.element.querySelector(".header-mobile-products-wrapper");
      this.productsMobileLink = this.element.querySelector(".mobile-products-link");
      this.mobileToggler = this.element.querySelector(".header-toggler");
      this.mobileMenu = this.element.querySelector(".header-mobile");
      this.links = this.element.querySelectorAll("[megamenu-link='0']");
      this.menuLinks = this.element.querySelectorAll("[megamenu-link='1']");
      this.menuTargets = this.element.querySelectorAll("[megamenu-target]");
      this.megamenu = this.element.querySelector(".header-megamenu");
      this.megamenuWrapper = this.element.querySelector(".header-megamenu-wrapper");
      gsapWithCSS.set(this.menuTargets, {
        opacity: 0
      });
      gsapWithCSS.set(this.mobileMenu, {
        scale: 0.5,
        transformOrigin: "top center",
        autoAlpha: 0
      });
    }
    binds() {
      this.menuLinks.forEach((link, index) => {
        link.addEventListener("mouseenter", () => {
          if (!this.isShowing) {
            this.isShowing = true;
            this.showMegamenu(true);
          }
          link.classList.add("active");
          if (this.currentTarget !== null && this.currentTarget !== index) {
            this.menuLinks[this.currentTarget].classList.remove("active");
          }
          if (this.currentTarget === index) return;
          this.showMenu(index);
        });
      });
      this.element.addEventListener("mouseleave", () => {
        if (!this.isShowing) return;
        this.isShowing = false;
        this.showMegamenu(false);
        if (this.currentTarget !== null) {
          this.menuLinks[this.currentTarget].classList.remove("active");
        }
      });
      this.links.forEach((link) => {
        link.addEventListener("mouseenter", () => {
          if (!this.isShowing) return;
          this.isShowing = false;
          this.showMegamenu(false);
          if (this.currentTarget !== null) {
            this.menuLinks[this.currentTarget].classList.remove("active");
          }
        });
      });
      this.productsMobileLink.addEventListener("click", () => {
        this.productsMobile.classList.toggle("active");
      });
      this.mobileToggler.addEventListener("click", () => {
        this.openMobileMenu(!this.isMobileMenuOpen);
      });
      this.menu.addEventListener("mouseenter", (e2) => {
        e2.preventDefault();
      });
    }
    observe() {
      const resizeObserver = new ResizeObserver(() => {
        this.sizing();
      });
      resizeObserver.observe(this.element);
    }
    sizing() {
      this.left = this.megamenu.getBoundingClientRect().left;
      this.top = this.megamenu.getBoundingClientRect().top;
    }
    spotlight() {
      if (window.innerWidth < 1024) {
        return;
      }
      this.spotlight = document.createElement("div");
      this.spotlight.classList.add("spotlight");
      this.megamenuWrapper.appendChild(this.spotlight);
      const xPos = gsapWithCSS.quickTo(this.spotlight, "x");
      const yPos = gsapWithCSS.quickTo(this.spotlight, "y");
      const interaction = (event) => {
        const x = event.clientX;
        const y = event.clientY;
        xPos(x - this.left);
        yPos(y - this.top);
      };
      window.addEventListener("mousemove", interaction);
    }
    showMenu(newIndex) {
      const targetElement = this.menuTargets[newIndex];
      const previousTarget = this.menuTargets[this.currentTarget];
      if (this.currentTarget !== null) {
        gsapWithCSS.to(previousTarget, {
          opacity: 0,
          duration: 1,
          xPercent: this.currentTarget > newIndex ? 100 : -100,
          ease: "power4.inOut"
        });
      }
      if (targetElement) {
        gsapWithCSS.set(targetElement, {
          xPercent: this.currentTarget !== null ? this.currentTarget > newIndex ? -100 : 100 : 0
        });
        gsapWithCSS.to(targetElement, {
          opacity: 1,
          duration: 1,
          xPercent: 0,
          ease: "power4.inOut"
        });
      }
      this.currentTarget = newIndex;
    }
    showMegamenu(show) {
      console.log("showing");
      gsapWithCSS.set(this.megamenu, {
        autoAlpha: show ? 0 : 1,
        y: show ? 0 : -100
      });
      gsapWithCSS.to(this.megamenu, {
        autoAlpha: show ? 1 : 0,
        duration: 1,
        y: show ? -100 : 0,
        ease: "power4.out"
      });
      this.megamenuShowing = show;
    }
    update() {
      this.menuSmall = false;
      this.ticker = () => {
        if (window.lenis.targetScroll > 0 && !this.menuSmall) {
          this.menuSmall = true;
          gsapWithCSS.to(this.logo, {
            padding: "1rem 0"
          });
        } else if (window.lenis.targetScroll <= 0 && this.menuSmall) {
          this.menuSmall = false;
          gsapWithCSS.to(this.logo, {
            // reset padding
            padding: "2.125rem 0"
          });
        }
      };
      gsapWithCSS.ticker.add(this.ticker);
    }
    openMobileMenu(open) {
      gsapWithCSS.set(this.mobileMenu, {
        scale: open ? 0.5 : 1,
        autoAlpha: open ? 0 : 1,
        overwrite: true
      });
      gsapWithCSS.to(this.mobileMenu, {
        duration: 1,
        scale: open ? 1 : 1,
        autoAlpha: open ? 1 : 0,
        ease: "power4.out"
      });
      gsapWithCSS.to(this.productsMobileLink.querySelector("div"), {
        scaleY: open ? -1 : 1
      });
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    }
  };

  // js/Video.js
  var Video = class {
    constructor(element) {
      this.element = element;
      this.open = false;
      if (!this.element.dataset.video) {
        return;
      }
      this.elements();
      this.bind();
    }
    elements() {
      this.modal = document.querySelector(".video-modal");
      this.videoWrapper = this.modal.querySelector(".video-modal-video");
      this.closeButton = this.modal.querySelector(".video-modal-close");
      this.videoURL = this.element.dataset.video;
    }
    bind() {
      this.element.addEventListener("click", (e2) => {
        e2.preventDefault();
        if (this.open) {
          return;
        }
        this.openModal();
      });
      this.modal.addEventListener("click", () => {
        if (!this.open) {
          return;
        }
        this.closeModal();
      });
      this.videoWrapper.addEventListener("click", (e2) => {
        e2.stopPropagation();
      });
    }
    getYouTubeVideoId(url) {
      if (url.includes("youtu.be/")) {
        return url.split("youtu.be/")[1].split("?")[0];
      }
      const match = url.match(/[?&]v=([^&]+)/);
      return match ? match[1] : url.split("v=")[1]?.split("&")[0];
    }
    openModal() {
      const embedUrl = this.videoURL.includes("vimeo.com") ? `https://player.vimeo.com/video/${this.videoURL.split("/").pop().split("?")[0]}?autoplay=1` : `https://www.youtube.com/embed/${this.getYouTubeVideoId(this.videoURL)}?autoplay=1`;
      this.videoWrapper.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: auto; touch-action: auto;"></iframe>`;
      gsapWithCSS.to(this.modal, {
        autoAlpha: 1,
        duration: 1,
        ease: "power4.inOut"
      });
      this.open = true;
    }
    closeModal() {
      gsapWithCSS.to(this.modal, {
        autoAlpha: 0,
        duration: 1,
        ease: "power4.inOut",
        onComplete: () => {
          this.videoWrapper.innerHTML = "";
        }
      });
      this.open = false;
    }
  };

  // js/Parallax.js
  var Parallax = class {
    constructor(element) {
      this.element = element;
      this.elements();
      const initiate = () => {
        this.sizing();
        this.animate();
        g.scrollTrigger.refresh();
      };
      if (this.image.complete) {
        initiate();
      } else {
        this.image.addEventListener("load", () => {
          initiate();
        });
      }
      window.addEventListener("resize", () => {
        this.sizing();
        g.scrollTrigger.refresh();
      });
    }
    elements() {
      if (this.element.tagName.toLowerCase() === "img") {
        this.wrapper = this.element.parentElement;
      } else {
        this.wrapper = this.element;
      }
      if (this.element.tagName.toLowerCase() === "img") {
        this.image = this.element;
      } else {
        this.image = this.element.querySelector("img");
      }
      this.direction = this.image.getAttribute("data-parallax-image") === "down" ? "up" : "up";
    }
    sizing() {
      this.wrapperHeight = this.wrapper.offsetHeight;
      this.imageHeight = this.image.getBoundingClientRect().height;
      this.travelDistance = this.imageHeight - this.wrapperHeight;
    }
    animate() {
      gsapWithCSS.set(this.image, {
        y: this.direction === "up" ? -this.travelDistance : 0
      });
      this.scrollTrigger = gsapWithCSS.to(this.image, {
        y: this.direction === "up" ? 0 : -this.travelDistance,
        ease: "none",
        scrollTrigger: {
          trigger: this.wrapper,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    }
  };

  // js/Memberships.js
  var Memberships = class {
    constructor(element) {
      this.element = element;
      this.currentTab = null;
      this.elements();
      this.bind();
      this.showTab(0);
    }
    elements() {
      this.togglerLinks = this.element.querySelectorAll(".memberships-toggler div:not(.memberships-indicator");
      this.tabs = this.element.querySelectorAll(".memberships-tab");
      this.indicator = this.element.querySelector(".memberships-indicator");
      this.tabs.forEach((tab) => {
        tab.items = tab.querySelectorAll(".membership-plan");
        tab.items.forEach((item) => {
          item.numeral = item.querySelector(".membership-pricing-number");
          item.originalNumber = item.numeral.textContent;
        });
      });
      console.log(this.togglerLinks);
    }
    bind() {
      this.togglerLinks.forEach((item, index) => {
        item.addEventListener("click", () => {
          if (this.currentTab === index) return;
          this.showTab(index);
        });
      });
    }
    showTab(index) {
      const currentTab = this.tabs[index];
      const left = index > this.currentTab ? true : false;
      const bgcolors = ["#FFDF10", "#72BEE0"];
      const textcolors = ["#404040", "#FFFFFF", "#A9A9A9"];
      if (this.currentTab !== null) {
        const previousTab = this.tabs[this.currentTab];
        gsapWithCSS.to(previousTab.items, {
          autoAlpha: 0,
          duration: 1,
          ease: "elastic.out(1, 0.7)",
          xPercent: left ? 20 : -20,
          stagger: left ? -0.2 : 0.2
        });
        gsapWithCSS.set(previousTab, {
          autoAlpha: 0,
          duration: 1,
          delay: 1
        });
      }
      const tl = gsapWithCSS.timeline();
      tl.to(this.indicator, {
        xPercent: -50,
        duration: 1,
        left: 50 + index * 100 + "%",
        ease: "power4.out"
      }, 0);
      tl.to(this.indicator, {
        width: "20%",
        duration: 0.5,
        ease: "power4.out"
      }, 0);
      tl.to(this.indicator, {
        width: "100%",
        duration: 2,
        ease: "elastic.out(1, 1.3)",
        backgroundColor: bgcolors[index]
      }, 0.2);
      this.togglerLinks.forEach((item, i2) => {
        gsapWithCSS.to(item, {
          color: i2 === index ? textcolors[index] : textcolors[2],
          duration: 1,
          ease: "power4.out"
        });
      });
      gsapWithCSS.to(currentTab, {
        autoAlpha: 1,
        duration: 1,
        ease: "power4.inOut"
      });
      gsapWithCSS.fromTo(currentTab.items, {
        autoAlpha: 0,
        xPercent: left ? -20 : 20
      }, {
        autoAlpha: 1,
        xPercent: 0,
        duration: 1,
        ease: "elastic.out(1, 0.7)",
        stagger: left ? -0.2 : 0.2,
        delay: 0.5
      });
      currentTab.items.forEach((item) => {
        gsapWithCSS.fromTo(item.numeral, {
          textContent: 0
        }, {
          textContent: item.originalNumber,
          duration: 2,
          snap: { textContent: 1 },
          ease: "power2.out",
          delay: 0.5
        });
      });
      this.currentTab = index;
    }
  };

  // js/SearchResults.js
  var SearchResults = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.create();
    }
    elements() {
      this.title = this.element.querySelector(".posts-search-title");
      this.posts = this.element.querySelectorAll(".posts-search-list");
    }
    create() {
      if (window.location.search.split("?query=")[1]) {
        const postSearchTerm = document.createElement("span");
        postSearchTerm.classList.add("post-search-term");
        postSearchTerm.innerHTML = window.location.search.split("?query=")[1];
        this.title.insertAdjacentElement("beforeend", postSearchTerm);
      }
      const postCount = document.createElement("span");
      postCount.classList.add("post-count");
      postCount.innerHTML = ` (${this.posts.length})`;
      this.title.insertAdjacentElement("beforeend", postCount);
    }
  };

  // js/ShrinkText.js
  var ShrinkText = class {
    constructor(element) {
      this.element = element;
      this.sizing();
    }
    sizing() {
      let newFontSize = 18 / 16;
      this.ticker = () => {
        const containerHeight = this.element.clientHeight;
        const scrollHeight = this.element.scrollHeight;
        if (scrollHeight > containerHeight) {
          newFontSize = newFontSize - 0.01;
          this.element.style.fontSize = `${newFontSize}rem`;
        }
      };
      gsapWithCSS.ticker.add(this.ticker);
    }
  };

  // js/Testimonials.js
  var Testimonials = class {
    constructor(element) {
      this.element = element;
      this.wrapper = this.element.querySelector(".testimonials-wrapper");
      this.elements();
      this.sizing();
      this.bind();
    }
    elements() {
      this.currentBreakpoint = null;
      this.currentPage = null;
      this.testimonials = this.element.querySelectorAll(".testimonial");
      this.next = this.element.querySelector(".testimonials-controls-next");
      this.prev = this.element.querySelector(".testimonials-controls-prev");
      this.indicators = this.element.querySelector(".testimonials-bullets");
    }
    sizing() {
      this.breakpoint = window.innerWidth < 768 ? "mobile" : window.innerWidth < 992 ? "tablet" : "desktop";
      this.itemsPerPage = this.breakpoint === "mobile" ? 1 : this.breakpoint === "tablet" ? 2 : 3;
      this.totalPages = Math.ceil(this.testimonials.length / this.itemsPerPage);
      this.testimonialWidth = this.testimonials[0].getBoundingClientRect().width;
      this.testimonialGap = parseInt(getComputedStyle(this.wrapper).columnGap);
      const changePagesCount = () => {
        this.indicators.innerHTML = "";
        for (let i2 = 0; i2 < this.totalPages; i2++) {
          const indicator = document.createElement("div");
          console.log("happens");
          indicator.classList.add("testimonials-bullet");
          this.indicators.appendChild(indicator);
        }
        this.indicatorsBullets = this.indicators.querySelectorAll(".testimonials-bullet");
        this.indicatorsBullets[0].classList.add("active", "from-left");
      };
      if (this.breakpoint !== this.currentBreakpoint) {
        this.currentBreakpoint = this.breakpoint;
        changePagesCount();
        this.update(0);
      }
    }
    create() {
      const testimonialOriginal = this.element.querySelector(".testimonial");
      for (let i2 = 0; i2 < 8; i2++) {
        const testimonial = testimonialOriginal.cloneNode(true);
        this.wrapper.appendChild(testimonial);
      }
    }
    bind() {
      this.next.addEventListener("click", () => {
        if (this.currentPage === this.totalPages - 1) {
          return;
        }
        this.update(Math.min(this.totalPages - 1, this.currentPage + 1));
      });
      this.prev.addEventListener("click", () => {
        if (this.currentPage === 0) {
          return;
        }
        this.update(Math.max(0, this.currentPage - 1));
      });
      window.addEventListener("resize", () => {
        this.sizing();
      });
    }
    update(newPage) {
      let page = Math.min(this.testimonials.length - this.itemsPerPage, newPage * this.itemsPerPage);
      console.log(page);
      this.indicatorsBullets[newPage].classList.add("active", newPage > this.currentPage ? "from-left" : "from-right");
      if (this.currentPage !== null) {
        this.indicatorsBullets[this.currentPage].classList.remove("active", "from-left", "from-right");
      }
      gsapWithCSS.to(this.testimonials, {
        x: page * (this.testimonialWidth + this.testimonialGap) * -1,
        ease: "elastic.out(1, 0.9)",
        duration: 2
      });
      this.currentPage = newPage;
    }
  };

  // js/FaqElements.js
  var FaqElements = class {
    constructor(element) {
      this.element = element;
      this.open = false;
      this.elements();
      this.bind();
    }
    elements() {
      this.items = this.element.querySelectorAll(".faq-item");
    }
    bind() {
      this.items.forEach((item) => {
        item.addEventListener("click", () => {
          this.toggle(item);
        });
      });
    }
    toggle(item) {
      this.open = !this.open;
      if (this.open) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    }
  };

  // js/Stagger.js
  var Stagger = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.animate();
    }
    elements() {
      this.directChildren = Array.from(this.element.children).filter(
        (child) => !child.classList.contains("stagger") && !child.classList.contains("stagger-left") && !child.classList.contains("stagger-right")
      );
      const staggerLeftChildren = this.element.querySelectorAll(".stagger-left > *");
      const staggerRightChildren = this.element.querySelectorAll(".stagger-right > *");
      const staggerChildren = this.element.querySelectorAll(".stagger > *");
      if (staggerLeftChildren.length > 0) {
        this.staggerType = "left";
        this.indirectChildren = staggerLeftChildren;
      } else if (staggerRightChildren.length > 0) {
        this.staggerType = "right";
        this.indirectChildren = staggerRightChildren;
      } else {
        this.staggerType = "normal";
        this.indirectChildren = staggerChildren;
      }
      this.allChildren = [...this.directChildren, ...this.indirectChildren];
    }
    animate() {
      if (this.directChildren.length > 0) {
        gsapWithCSS.set(this.directChildren, {
          opacity: 0,
          y: "2rem"
        });
        gsapWithCSS.utils.toArray(this.directChildren).forEach((child) => {
          gsapWithCSS.to(child, {
            opacity: 1,
            y: 0,
            duration: 2,
            ease: "elastic.out(1, 0.7)",
            scrollTrigger: {
              trigger: child,
              start: "top bottom",
              toggleActions: "play none none reset"
            }
          });
        });
      }
      if (this.indirectChildren.length > 0) {
        const xValue = this.staggerType === "left" ? "-2rem" : this.staggerType === "right" ? "2rem" : 0;
        const yValue = this.staggerType === "normal" ? "2rem" : 0;
        gsapWithCSS.set(this.indirectChildren, {
          opacity: 0,
          y: yValue,
          x: xValue
        });
        gsapWithCSS.to(this.indirectChildren, {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 2,
          ease: "elastic.out(1, 0.7)",
          scrollTrigger: {
            trigger: this.indirectChildren[0],
            start: "top bottom",
            end: "bottom top",
            toggleActions: "play none none reset"
          },
          stagger: {
            amount: 0.5
          }
        });
      }
    }
  };

  // js/HeadingWave.js
  var HeadingWave = class {
    constructor(element) {
      this.element = element;
      this.elements();
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this.split();
          this.animate();
        });
      } else {
        this.split();
        this.animate();
      }
    }
    elements() {
      this.heading = this.element.querySelector(".heading");
      this.headingUnits = this.heading.querySelectorAll(".heading-unit");
      this.hasColor = getComputedStyle(this.heading).getPropertyValue("--color1") !== "" && getComputedStyle(this.heading).getPropertyValue("--color2") !== "";
      console.log(this.element, this.hasColor);
      this.image = this.element.querySelector("img");
      this.text = this.element.querySelector(".media-content");
      this.slot = this.element.querySelector(".media-slot");
    }
    split() {
      this.splitText = new g.splitText(this.headingUnits, {
        type: this.hasColor ? "words, chars, lines" : "words, chars",
        linesClass: "line",
        charsClass: "char",
        smartWrap: true
      });
      console.log(this.splitText.chars.length);
      this.hasColor && this.splitText.lines.forEach((line) => {
        splitTextGradient(line, line.querySelectorAll(".char"));
      });
    }
    animate() {
      this.splitText.chars && gsapWithCSS.set(this.splitText.chars, {
        opacity: 0,
        scaleY: 0,
        transformOrigin: "center bottom"
      });
      this.image && gsapWithCSS.set(this.image, {
        opacity: 0,
        y: "2rem"
      });
      this.text && gsapWithCSS.set(this.text, {
        opacity: 0,
        y: "2rem"
      });
      this.slot && gsapWithCSS.set(this.slot, {
        opacity: 0,
        y: "2rem"
      });
      this.image && gsapWithCSS.to(this.image, {
        opacity: 1,
        duration: 1,
        y: 0,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.image,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
      this.text && gsapWithCSS.to(this.text, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.text,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
      this.slot && gsapWithCSS.to(this.slot, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.slot,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
      this.splitText.chars && gsapWithCSS.to(this.splitText.chars, {
        opacity: 1,
        scaleY: 1,
        ease: "elastic.out(1, 0.7)",
        stagger: {
          amount: 1
        },
        scrollTrigger: {
          trigger: this.splitText.chars,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
    }
  };

  // js/Image.js
  var Image = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.animate();
    }
    elements() {
      this.image = this.element.querySelector("img");
    }
    animate() {
      gsapWithCSS.set(this.element, {
        clipPath: "inset(100% 0% 0% 0%)"
      });
      gsapWithCSS.set(this.image, {
        scale: 0.8
      });
      gsapWithCSS.to(this.element, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.element,
          start: "top bottom",
          end: "top top",
          scrub: true
        }
      });
      gsapWithCSS.to(this.image, {
        scale: 1,
        duration: 1,
        ease: "power4.inOut",
        scrollTrigger: {
          trigger: this.element,
          start: "top bottom",
          end: "top top",
          scrub: true
        }
      });
    }
  };

  // node_modules/gsap/Observer.js
  function _defineProperties(target, props) {
    for (var i2 = 0; i2 < props.length; i2++) {
      var descriptor = props[i2];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  var gsap5;
  var _coreInitted5;
  var _clamp3;
  var _win3;
  var _doc3;
  var _docEl;
  var _body;
  var _isTouch;
  var _pointerType;
  var ScrollTrigger;
  var _root;
  var _normalizer;
  var _eventTypes;
  var _context3;
  var _getGSAP5 = function _getGSAP6() {
    return gsap5 || typeof window !== "undefined" && (gsap5 = window.gsap) && gsap5.registerPlugin && gsap5;
  };
  var _startup = 1;
  var _observers = [];
  var _scrollers = [];
  var _proxies = [];
  var _getTime = Date.now;
  var _bridge = function _bridge2(name, value) {
    return value;
  };
  var _integrate = function _integrate2() {
    var core = ScrollTrigger.core, data = core.bridge || {}, scrollers = core._scrollers, proxies = core._proxies;
    scrollers.push.apply(scrollers, _scrollers);
    proxies.push.apply(proxies, _proxies);
    _scrollers = scrollers;
    _proxies = proxies;
    _bridge = function _bridge3(name, value) {
      return data[name](value);
    };
  };
  var _getProxyProp = function _getProxyProp2(element, property) {
    return ~_proxies.indexOf(element) && _proxies[_proxies.indexOf(element) + 1][property];
  };
  var _isViewport = function _isViewport2(el) {
    return !!~_root.indexOf(el);
  };
  var _addListener = function _addListener2(element, type, func, passive, capture) {
    return element.addEventListener(type, func, {
      passive: passive !== false,
      capture: !!capture
    });
  };
  var _removeListener = function _removeListener2(element, type, func, capture) {
    return element.removeEventListener(type, func, !!capture);
  };
  var _scrollLeft = "scrollLeft";
  var _scrollTop = "scrollTop";
  var _onScroll = function _onScroll2() {
    return _normalizer && _normalizer.isPressed || _scrollers.cache++;
  };
  var _scrollCacheFunc = function _scrollCacheFunc2(f2, doNotCache) {
    var cachingFunc = function cachingFunc2(value) {
      if (value || value === 0) {
        _startup && (_win3.history.scrollRestoration = "manual");
        var isNormalizing = _normalizer && _normalizer.isPressed;
        value = cachingFunc2.v = Math.round(value) || (_normalizer && _normalizer.iOS ? 1 : 0);
        f2(value);
        cachingFunc2.cacheID = _scrollers.cache;
        isNormalizing && _bridge("ss", value);
      } else if (doNotCache || _scrollers.cache !== cachingFunc2.cacheID || _bridge("ref")) {
        cachingFunc2.cacheID = _scrollers.cache;
        cachingFunc2.v = f2();
      }
      return cachingFunc2.v + cachingFunc2.offset;
    };
    cachingFunc.offset = 0;
    return f2 && cachingFunc;
  };
  var _horizontal = {
    s: _scrollLeft,
    p: "left",
    p2: "Left",
    os: "right",
    os2: "Right",
    d: "width",
    d2: "Width",
    a: "x",
    sc: _scrollCacheFunc(function(value) {
      return arguments.length ? _win3.scrollTo(value, _vertical.sc()) : _win3.pageXOffset || _doc3[_scrollLeft] || _docEl[_scrollLeft] || _body[_scrollLeft] || 0;
    })
  };
  var _vertical = {
    s: _scrollTop,
    p: "top",
    p2: "Top",
    os: "bottom",
    os2: "Bottom",
    d: "height",
    d2: "Height",
    a: "y",
    op: _horizontal,
    sc: _scrollCacheFunc(function(value) {
      return arguments.length ? _win3.scrollTo(_horizontal.sc(), value) : _win3.pageYOffset || _doc3[_scrollTop] || _docEl[_scrollTop] || _body[_scrollTop] || 0;
    })
  };
  var _getTarget = function _getTarget2(t2, self) {
    return (self && self._ctx && self._ctx.selector || gsap5.utils.toArray)(t2)[0] || (typeof t2 === "string" && gsap5.config().nullTargetWarn !== false ? console.warn("Element not found:", t2) : null);
  };
  var _isWithin = function _isWithin2(element, list) {
    var i2 = list.length;
    while (i2--) {
      if (list[i2] === element || list[i2].contains(element)) {
        return true;
      }
    }
    return false;
  };
  var _getScrollFunc = function _getScrollFunc2(element, _ref) {
    var s2 = _ref.s, sc = _ref.sc;
    _isViewport(element) && (element = _doc3.scrollingElement || _docEl);
    var i2 = _scrollers.indexOf(element), offset = sc === _vertical.sc ? 1 : 2;
    !~i2 && (i2 = _scrollers.push(element) - 1);
    _scrollers[i2 + offset] || _addListener(element, "scroll", _onScroll);
    var prev = _scrollers[i2 + offset], func = prev || (_scrollers[i2 + offset] = _scrollCacheFunc(_getProxyProp(element, s2), true) || (_isViewport(element) ? sc : _scrollCacheFunc(function(value) {
      return arguments.length ? element[s2] = value : element[s2];
    })));
    func.target = element;
    prev || (func.smooth = gsap5.getProperty(element, "scrollBehavior") === "smooth");
    return func;
  };
  var _getVelocityProp = function _getVelocityProp2(value, minTimeRefresh, useDelta) {
    var v1 = value, v2 = value, t1 = _getTime(), t2 = t1, min = minTimeRefresh || 50, dropToZeroTime = Math.max(500, min * 3), update = function update2(value2, force) {
      var t3 = _getTime();
      if (force || t3 - t1 > min) {
        v2 = v1;
        v1 = value2;
        t2 = t1;
        t1 = t3;
      } else if (useDelta) {
        v1 += value2;
      } else {
        v1 = v2 + (value2 - v2) / (t3 - t2) * (t1 - t2);
      }
    }, reset = function reset2() {
      v2 = v1 = useDelta ? 0 : v1;
      t2 = t1 = 0;
    }, getVelocity = function getVelocity2(latestValue) {
      var tOld = t2, vOld = v2, t3 = _getTime();
      (latestValue || latestValue === 0) && latestValue !== v1 && update(latestValue);
      return t1 === t2 || t3 - t2 > dropToZeroTime ? 0 : (v1 + (useDelta ? vOld : -vOld)) / ((useDelta ? t3 : t1) - tOld) * 1e3;
    };
    return {
      update,
      reset,
      getVelocity
    };
  };
  var _getEvent = function _getEvent2(e2, preventDefault) {
    preventDefault && !e2._gsapAllow && e2.preventDefault();
    return e2.changedTouches ? e2.changedTouches[0] : e2;
  };
  var _getAbsoluteMax = function _getAbsoluteMax2(a2) {
    var max = Math.max.apply(Math, a2), min = Math.min.apply(Math, a2);
    return Math.abs(max) >= Math.abs(min) ? max : min;
  };
  var _setScrollTrigger = function _setScrollTrigger2() {
    ScrollTrigger = gsap5.core.globals().ScrollTrigger;
    ScrollTrigger && ScrollTrigger.core && _integrate();
  };
  var _initCore7 = function _initCore8(core) {
    gsap5 = core || _getGSAP5();
    if (!_coreInitted5 && gsap5 && typeof document !== "undefined" && document.body) {
      _win3 = window;
      _doc3 = document;
      _docEl = _doc3.documentElement;
      _body = _doc3.body;
      _root = [_win3, _doc3, _docEl, _body];
      _clamp3 = gsap5.utils.clamp;
      _context3 = gsap5.core.context || function() {
      };
      _pointerType = "onpointerenter" in _body ? "pointer" : "mouse";
      _isTouch = Observer.isTouch = _win3.matchMedia && _win3.matchMedia("(hover: none), (pointer: coarse)").matches ? 1 : "ontouchstart" in _win3 || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0 ? 2 : 0;
      _eventTypes = Observer.eventTypes = ("ontouchstart" in _docEl ? "touchstart,touchmove,touchcancel,touchend" : !("onpointerdown" in _docEl) ? "mousedown,mousemove,mouseup,mouseup" : "pointerdown,pointermove,pointercancel,pointerup").split(",");
      setTimeout(function() {
        return _startup = 0;
      }, 500);
      _setScrollTrigger();
      _coreInitted5 = 1;
    }
    return _coreInitted5;
  };
  _horizontal.op = _vertical;
  _scrollers.cache = 0;
  var Observer = /* @__PURE__ */ function() {
    function Observer2(vars) {
      this.init(vars);
    }
    var _proto = Observer2.prototype;
    _proto.init = function init4(vars) {
      _coreInitted5 || _initCore7(gsap5) || console.warn("Please gsap.registerPlugin(Observer)");
      ScrollTrigger || _setScrollTrigger();
      var tolerance = vars.tolerance, dragMinimum = vars.dragMinimum, type = vars.type, target = vars.target, lineHeight = vars.lineHeight, debounce2 = vars.debounce, preventDefault = vars.preventDefault, onStop = vars.onStop, onStopDelay = vars.onStopDelay, ignore = vars.ignore, wheelSpeed = vars.wheelSpeed, event = vars.event, onDragStart = vars.onDragStart, onDragEnd = vars.onDragEnd, onDrag = vars.onDrag, onPress = vars.onPress, onRelease = vars.onRelease, onRight = vars.onRight, onLeft = vars.onLeft, onUp = vars.onUp, onDown = vars.onDown, onChangeX = vars.onChangeX, onChangeY = vars.onChangeY, onChange = vars.onChange, onToggleX = vars.onToggleX, onToggleY = vars.onToggleY, onHover = vars.onHover, onHoverEnd = vars.onHoverEnd, onMove = vars.onMove, ignoreCheck = vars.ignoreCheck, isNormalizer = vars.isNormalizer, onGestureStart = vars.onGestureStart, onGestureEnd = vars.onGestureEnd, onWheel = vars.onWheel, onEnable = vars.onEnable, onDisable = vars.onDisable, onClick = vars.onClick, scrollSpeed = vars.scrollSpeed, capture = vars.capture, allowClicks = vars.allowClicks, lockAxis = vars.lockAxis, onLockAxis = vars.onLockAxis;
      this.target = target = _getTarget(target) || _docEl;
      this.vars = vars;
      ignore && (ignore = gsap5.utils.toArray(ignore));
      tolerance = tolerance || 1e-9;
      dragMinimum = dragMinimum || 0;
      wheelSpeed = wheelSpeed || 1;
      scrollSpeed = scrollSpeed || 1;
      type = type || "wheel,touch,pointer";
      debounce2 = debounce2 !== false;
      lineHeight || (lineHeight = parseFloat(_win3.getComputedStyle(_body).lineHeight) || 22);
      var id, onStopDelayedCall, dragged, moved, wheeled, locked, axis, self = this, prevDeltaX = 0, prevDeltaY = 0, passive = vars.passive || !preventDefault && vars.passive !== false, scrollFuncX = _getScrollFunc(target, _horizontal), scrollFuncY = _getScrollFunc(target, _vertical), scrollX = scrollFuncX(), scrollY = scrollFuncY(), limitToTouch = ~type.indexOf("touch") && !~type.indexOf("pointer") && _eventTypes[0] === "pointerdown", isViewport = _isViewport(target), ownerDoc = target.ownerDocument || _doc3, deltaX = [0, 0, 0], deltaY = [0, 0, 0], onClickTime = 0, clickCapture = function clickCapture2() {
        return onClickTime = _getTime();
      }, _ignoreCheck = function _ignoreCheck2(e2, isPointerOrTouch) {
        return (self.event = e2) && ignore && _isWithin(e2.target, ignore) || isPointerOrTouch && limitToTouch && e2.pointerType !== "touch" || ignoreCheck && ignoreCheck(e2, isPointerOrTouch);
      }, onStopFunc = function onStopFunc2() {
        self._vx.reset();
        self._vy.reset();
        onStopDelayedCall.pause();
        onStop && onStop(self);
      }, update = function update2() {
        var dx = self.deltaX = _getAbsoluteMax(deltaX), dy = self.deltaY = _getAbsoluteMax(deltaY), changedX = Math.abs(dx) >= tolerance, changedY = Math.abs(dy) >= tolerance;
        onChange && (changedX || changedY) && onChange(self, dx, dy, deltaX, deltaY);
        if (changedX) {
          onRight && self.deltaX > 0 && onRight(self);
          onLeft && self.deltaX < 0 && onLeft(self);
          onChangeX && onChangeX(self);
          onToggleX && self.deltaX < 0 !== prevDeltaX < 0 && onToggleX(self);
          prevDeltaX = self.deltaX;
          deltaX[0] = deltaX[1] = deltaX[2] = 0;
        }
        if (changedY) {
          onDown && self.deltaY > 0 && onDown(self);
          onUp && self.deltaY < 0 && onUp(self);
          onChangeY && onChangeY(self);
          onToggleY && self.deltaY < 0 !== prevDeltaY < 0 && onToggleY(self);
          prevDeltaY = self.deltaY;
          deltaY[0] = deltaY[1] = deltaY[2] = 0;
        }
        if (moved || dragged) {
          onMove && onMove(self);
          if (dragged) {
            onDragStart && dragged === 1 && onDragStart(self);
            onDrag && onDrag(self);
            dragged = 0;
          }
          moved = false;
        }
        locked && !(locked = false) && onLockAxis && onLockAxis(self);
        if (wheeled) {
          onWheel(self);
          wheeled = false;
        }
        id = 0;
      }, onDelta = function onDelta2(x, y, index) {
        deltaX[index] += x;
        deltaY[index] += y;
        self._vx.update(x);
        self._vy.update(y);
        debounce2 ? id || (id = requestAnimationFrame(update)) : update();
      }, onTouchOrPointerDelta = function onTouchOrPointerDelta2(x, y) {
        if (lockAxis && !axis) {
          self.axis = axis = Math.abs(x) > Math.abs(y) ? "x" : "y";
          locked = true;
        }
        if (axis !== "y") {
          deltaX[2] += x;
          self._vx.update(x, true);
        }
        if (axis !== "x") {
          deltaY[2] += y;
          self._vy.update(y, true);
        }
        debounce2 ? id || (id = requestAnimationFrame(update)) : update();
      }, _onDrag = function _onDrag2(e2) {
        if (_ignoreCheck(e2, 1)) {
          return;
        }
        e2 = _getEvent(e2, preventDefault);
        var x = e2.clientX, y = e2.clientY, dx = x - self.x, dy = y - self.y, isDragging = self.isDragging;
        self.x = x;
        self.y = y;
        if (isDragging || (dx || dy) && (Math.abs(self.startX - x) >= dragMinimum || Math.abs(self.startY - y) >= dragMinimum)) {
          dragged = isDragging ? 2 : 1;
          isDragging || (self.isDragging = true);
          onTouchOrPointerDelta(dx, dy);
        }
      }, _onPress = self.onPress = function(e2) {
        if (_ignoreCheck(e2, 1) || e2 && e2.button) {
          return;
        }
        self.axis = axis = null;
        onStopDelayedCall.pause();
        self.isPressed = true;
        e2 = _getEvent(e2);
        prevDeltaX = prevDeltaY = 0;
        self.startX = self.x = e2.clientX;
        self.startY = self.y = e2.clientY;
        self._vx.reset();
        self._vy.reset();
        _addListener(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, passive, true);
        self.deltaX = self.deltaY = 0;
        onPress && onPress(self);
      }, _onRelease = self.onRelease = function(e2) {
        if (_ignoreCheck(e2, 1)) {
          return;
        }
        _removeListener(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, true);
        var isTrackingDrag = !isNaN(self.y - self.startY), wasDragging = self.isDragging, isDragNotClick = wasDragging && (Math.abs(self.x - self.startX) > 3 || Math.abs(self.y - self.startY) > 3), eventData = _getEvent(e2);
        if (!isDragNotClick && isTrackingDrag) {
          self._vx.reset();
          self._vy.reset();
          if (preventDefault && allowClicks) {
            gsap5.delayedCall(0.08, function() {
              if (_getTime() - onClickTime > 300 && !e2.defaultPrevented) {
                if (e2.target.click) {
                  e2.target.click();
                } else if (ownerDoc.createEvent) {
                  var syntheticEvent = ownerDoc.createEvent("MouseEvents");
                  syntheticEvent.initMouseEvent("click", true, true, _win3, 1, eventData.screenX, eventData.screenY, eventData.clientX, eventData.clientY, false, false, false, false, 0, null);
                  e2.target.dispatchEvent(syntheticEvent);
                }
              }
            });
          }
        }
        self.isDragging = self.isGesturing = self.isPressed = false;
        onStop && wasDragging && !isNormalizer && onStopDelayedCall.restart(true);
        dragged && update();
        onDragEnd && wasDragging && onDragEnd(self);
        onRelease && onRelease(self, isDragNotClick);
      }, _onGestureStart = function _onGestureStart2(e2) {
        return e2.touches && e2.touches.length > 1 && (self.isGesturing = true) && onGestureStart(e2, self.isDragging);
      }, _onGestureEnd = function _onGestureEnd2() {
        return (self.isGesturing = false) || onGestureEnd(self);
      }, onScroll = function onScroll2(e2) {
        if (_ignoreCheck(e2)) {
          return;
        }
        var x = scrollFuncX(), y = scrollFuncY();
        onDelta((x - scrollX) * scrollSpeed, (y - scrollY) * scrollSpeed, 1);
        scrollX = x;
        scrollY = y;
        onStop && onStopDelayedCall.restart(true);
      }, _onWheel = function _onWheel2(e2) {
        if (_ignoreCheck(e2)) {
          return;
        }
        e2 = _getEvent(e2, preventDefault);
        onWheel && (wheeled = true);
        var multiplier = (e2.deltaMode === 1 ? lineHeight : e2.deltaMode === 2 ? _win3.innerHeight : 1) * wheelSpeed;
        onDelta(e2.deltaX * multiplier, e2.deltaY * multiplier, 0);
        onStop && !isNormalizer && onStopDelayedCall.restart(true);
      }, _onMove = function _onMove2(e2) {
        if (_ignoreCheck(e2)) {
          return;
        }
        var x = e2.clientX, y = e2.clientY, dx = x - self.x, dy = y - self.y;
        self.x = x;
        self.y = y;
        moved = true;
        onStop && onStopDelayedCall.restart(true);
        (dx || dy) && onTouchOrPointerDelta(dx, dy);
      }, _onHover = function _onHover2(e2) {
        self.event = e2;
        onHover(self);
      }, _onHoverEnd = function _onHoverEnd2(e2) {
        self.event = e2;
        onHoverEnd(self);
      }, _onClick = function _onClick2(e2) {
        return _ignoreCheck(e2) || _getEvent(e2, preventDefault) && onClick(self);
      };
      onStopDelayedCall = self._dc = gsap5.delayedCall(onStopDelay || 0.25, onStopFunc).pause();
      self.deltaX = self.deltaY = 0;
      self._vx = _getVelocityProp(0, 50, true);
      self._vy = _getVelocityProp(0, 50, true);
      self.scrollX = scrollFuncX;
      self.scrollY = scrollFuncY;
      self.isDragging = self.isGesturing = self.isPressed = false;
      _context3(this);
      self.enable = function(e2) {
        if (!self.isEnabled) {
          _addListener(isViewport ? ownerDoc : target, "scroll", _onScroll);
          type.indexOf("scroll") >= 0 && _addListener(isViewport ? ownerDoc : target, "scroll", onScroll, passive, capture);
          type.indexOf("wheel") >= 0 && _addListener(target, "wheel", _onWheel, passive, capture);
          if (type.indexOf("touch") >= 0 && _isTouch || type.indexOf("pointer") >= 0) {
            _addListener(target, _eventTypes[0], _onPress, passive, capture);
            _addListener(ownerDoc, _eventTypes[2], _onRelease);
            _addListener(ownerDoc, _eventTypes[3], _onRelease);
            allowClicks && _addListener(target, "click", clickCapture, true, true);
            onClick && _addListener(target, "click", _onClick);
            onGestureStart && _addListener(ownerDoc, "gesturestart", _onGestureStart);
            onGestureEnd && _addListener(ownerDoc, "gestureend", _onGestureEnd);
            onHover && _addListener(target, _pointerType + "enter", _onHover);
            onHoverEnd && _addListener(target, _pointerType + "leave", _onHoverEnd);
            onMove && _addListener(target, _pointerType + "move", _onMove);
          }
          self.isEnabled = true;
          self.isDragging = self.isGesturing = self.isPressed = moved = dragged = false;
          self._vx.reset();
          self._vy.reset();
          scrollX = scrollFuncX();
          scrollY = scrollFuncY();
          e2 && e2.type && _onPress(e2);
          onEnable && onEnable(self);
        }
        return self;
      };
      self.disable = function() {
        if (self.isEnabled) {
          _observers.filter(function(o2) {
            return o2 !== self && _isViewport(o2.target);
          }).length || _removeListener(isViewport ? ownerDoc : target, "scroll", _onScroll);
          if (self.isPressed) {
            self._vx.reset();
            self._vy.reset();
            _removeListener(isNormalizer ? target : ownerDoc, _eventTypes[1], _onDrag, true);
          }
          _removeListener(isViewport ? ownerDoc : target, "scroll", onScroll, capture);
          _removeListener(target, "wheel", _onWheel, capture);
          _removeListener(target, _eventTypes[0], _onPress, capture);
          _removeListener(ownerDoc, _eventTypes[2], _onRelease);
          _removeListener(ownerDoc, _eventTypes[3], _onRelease);
          _removeListener(target, "click", clickCapture, true);
          _removeListener(target, "click", _onClick);
          _removeListener(ownerDoc, "gesturestart", _onGestureStart);
          _removeListener(ownerDoc, "gestureend", _onGestureEnd);
          _removeListener(target, _pointerType + "enter", _onHover);
          _removeListener(target, _pointerType + "leave", _onHoverEnd);
          _removeListener(target, _pointerType + "move", _onMove);
          self.isEnabled = self.isPressed = self.isDragging = false;
          onDisable && onDisable(self);
        }
      };
      self.kill = self.revert = function() {
        self.disable();
        var i2 = _observers.indexOf(self);
        i2 >= 0 && _observers.splice(i2, 1);
        _normalizer === self && (_normalizer = 0);
      };
      _observers.push(self);
      isNormalizer && _isViewport(target) && (_normalizer = self);
      self.enable(event);
    };
    _createClass(Observer2, [{
      key: "velocityX",
      get: function get() {
        return this._vx.getVelocity();
      }
    }, {
      key: "velocityY",
      get: function get() {
        return this._vy.getVelocity();
      }
    }]);
    return Observer2;
  }();
  Observer.version = "3.13.0";
  Observer.create = function(vars) {
    return new Observer(vars);
  };
  Observer.register = _initCore7;
  Observer.getAll = function() {
    return _observers.slice();
  };
  Observer.getById = function(id) {
    return _observers.filter(function(o2) {
      return o2.vars.id === id;
    })[0];
  };
  _getGSAP5() && gsap5.registerPlugin(Observer);

  // node_modules/gsap/ScrollTrigger.js
  var gsap6;
  var _coreInitted6;
  var _win4;
  var _doc4;
  var _docEl2;
  var _body2;
  var _root2;
  var _resizeDelay;
  var _toArray2;
  var _clamp4;
  var _time2;
  var _syncInterval;
  var _refreshing;
  var _pointerIsDown;
  var _transformProp2;
  var _i;
  var _prevWidth;
  var _prevHeight;
  var _autoRefresh;
  var _sort;
  var _suppressOverwrites2;
  var _ignoreResize;
  var _normalizer2;
  var _ignoreMobileResize;
  var _baseScreenHeight;
  var _baseScreenWidth;
  var _fixIOSBug;
  var _context4;
  var _scrollRestoration;
  var _div100vh;
  var _100vh;
  var _isReverted;
  var _clampingMax;
  var _limitCallbacks;
  var _startup2 = 1;
  var _getTime2 = Date.now;
  var _time1 = _getTime2();
  var _lastScrollTime = 0;
  var _enabled = 0;
  var _parseClamp = function _parseClamp2(value, type, self) {
    var clamp4 = _isString3(value) && (value.substr(0, 6) === "clamp(" || value.indexOf("max") > -1);
    self["_" + type + "Clamp"] = clamp4;
    return clamp4 ? value.substr(6, value.length - 7) : value;
  };
  var _keepClamp = function _keepClamp2(value, clamp4) {
    return clamp4 && (!_isString3(value) || value.substr(0, 6) !== "clamp(") ? "clamp(" + value + ")" : value;
  };
  var _rafBugFix = function _rafBugFix2() {
    return _enabled && requestAnimationFrame(_rafBugFix2);
  };
  var _pointerDownHandler = function _pointerDownHandler2() {
    return _pointerIsDown = 1;
  };
  var _pointerUpHandler = function _pointerUpHandler2() {
    return _pointerIsDown = 0;
  };
  var _passThrough3 = function _passThrough4(v) {
    return v;
  };
  var _round7 = function _round8(value) {
    return Math.round(value * 1e5) / 1e5 || 0;
  };
  var _windowExists5 = function _windowExists6() {
    return typeof window !== "undefined";
  };
  var _getGSAP7 = function _getGSAP8() {
    return gsap6 || _windowExists5() && (gsap6 = window.gsap) && gsap6.registerPlugin && gsap6;
  };
  var _isViewport3 = function _isViewport4(e2) {
    return !!~_root2.indexOf(e2);
  };
  var _getViewportDimension = function _getViewportDimension2(dimensionProperty) {
    return (dimensionProperty === "Height" ? _100vh : _win4["inner" + dimensionProperty]) || _docEl2["client" + dimensionProperty] || _body2["client" + dimensionProperty];
  };
  var _getBoundsFunc = function _getBoundsFunc2(element) {
    return _getProxyProp(element, "getBoundingClientRect") || (_isViewport3(element) ? function() {
      _winOffsets.width = _win4.innerWidth;
      _winOffsets.height = _100vh;
      return _winOffsets;
    } : function() {
      return _getBounds(element);
    });
  };
  var _getSizeFunc = function _getSizeFunc2(scroller, isViewport, _ref) {
    var d2 = _ref.d, d22 = _ref.d2, a2 = _ref.a;
    return (a2 = _getProxyProp(scroller, "getBoundingClientRect")) ? function() {
      return a2()[d2];
    } : function() {
      return (isViewport ? _getViewportDimension(d22) : scroller["client" + d22]) || 0;
    };
  };
  var _getOffsetsFunc = function _getOffsetsFunc2(element, isViewport) {
    return !isViewport || ~_proxies.indexOf(element) ? _getBoundsFunc(element) : function() {
      return _winOffsets;
    };
  };
  var _maxScroll = function _maxScroll2(element, _ref2) {
    var s2 = _ref2.s, d2 = _ref2.d2, d3 = _ref2.d, a2 = _ref2.a;
    return Math.max(0, (s2 = "scroll" + d2) && (a2 = _getProxyProp(element, s2)) ? a2() - _getBoundsFunc(element)()[d3] : _isViewport3(element) ? (_docEl2[s2] || _body2[s2]) - _getViewportDimension(d2) : element[s2] - element["offset" + d2]);
  };
  var _iterateAutoRefresh = function _iterateAutoRefresh2(func, events) {
    for (var i2 = 0; i2 < _autoRefresh.length; i2 += 3) {
      (!events || ~events.indexOf(_autoRefresh[i2 + 1])) && func(_autoRefresh[i2], _autoRefresh[i2 + 1], _autoRefresh[i2 + 2]);
    }
  };
  var _isString3 = function _isString4(value) {
    return typeof value === "string";
  };
  var _isFunction3 = function _isFunction4(value) {
    return typeof value === "function";
  };
  var _isNumber5 = function _isNumber6(value) {
    return typeof value === "number";
  };
  var _isObject3 = function _isObject4(value) {
    return typeof value === "object";
  };
  var _endAnimation = function _endAnimation2(animation, reversed, pause) {
    return animation && animation.progress(reversed ? 0 : 1) && pause && animation.pause();
  };
  var _callback3 = function _callback4(self, func) {
    if (self.enabled) {
      var result = self._ctx ? self._ctx.add(function() {
        return func(self);
      }) : func(self);
      result && result.totalTime && (self.callbackAnimation = result);
    }
  };
  var _abs2 = Math.abs;
  var _left = "left";
  var _top = "top";
  var _right = "right";
  var _bottom = "bottom";
  var _width = "width";
  var _height = "height";
  var _Right = "Right";
  var _Left = "Left";
  var _Top = "Top";
  var _Bottom = "Bottom";
  var _padding = "padding";
  var _margin = "margin";
  var _Width = "Width";
  var _Height = "Height";
  var _px = "px";
  var _getComputedStyle = function _getComputedStyle2(element) {
    return _win4.getComputedStyle(element);
  };
  var _makePositionable = function _makePositionable2(element) {
    var position = _getComputedStyle(element).position;
    element.style.position = position === "absolute" || position === "fixed" ? position : "relative";
  };
  var _setDefaults3 = function _setDefaults4(obj, defaults2) {
    for (var p2 in defaults2) {
      p2 in obj || (obj[p2] = defaults2[p2]);
    }
    return obj;
  };
  var _getBounds = function _getBounds2(element, withoutTransforms) {
    var tween = withoutTransforms && _getComputedStyle(element)[_transformProp2] !== "matrix(1, 0, 0, 1, 0, 0)" && gsap6.to(element, {
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 0,
      rotation: 0,
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      skewX: 0,
      skewY: 0
    }).progress(1), bounds = element.getBoundingClientRect();
    tween && tween.progress(0).kill();
    return bounds;
  };
  var _getSize = function _getSize2(element, _ref3) {
    var d2 = _ref3.d2;
    return element["offset" + d2] || element["client" + d2] || 0;
  };
  var _getLabelRatioArray = function _getLabelRatioArray2(timeline2) {
    var a2 = [], labels = timeline2.labels, duration = timeline2.duration(), p2;
    for (p2 in labels) {
      a2.push(labels[p2] / duration);
    }
    return a2;
  };
  var _getClosestLabel = function _getClosestLabel2(animation) {
    return function(value) {
      return gsap6.utils.snap(_getLabelRatioArray(animation), value);
    };
  };
  var _snapDirectional = function _snapDirectional2(snapIncrementOrArray) {
    var snap3 = gsap6.utils.snap(snapIncrementOrArray), a2 = Array.isArray(snapIncrementOrArray) && snapIncrementOrArray.slice(0).sort(function(a3, b) {
      return a3 - b;
    });
    return a2 ? function(value, direction, threshold) {
      if (threshold === void 0) {
        threshold = 1e-3;
      }
      var i2;
      if (!direction) {
        return snap3(value);
      }
      if (direction > 0) {
        value -= threshold;
        for (i2 = 0; i2 < a2.length; i2++) {
          if (a2[i2] >= value) {
            return a2[i2];
          }
        }
        return a2[i2 - 1];
      } else {
        i2 = a2.length;
        value += threshold;
        while (i2--) {
          if (a2[i2] <= value) {
            return a2[i2];
          }
        }
      }
      return a2[0];
    } : function(value, direction, threshold) {
      if (threshold === void 0) {
        threshold = 1e-3;
      }
      var snapped = snap3(value);
      return !direction || Math.abs(snapped - value) < threshold || snapped - value < 0 === direction < 0 ? snapped : snap3(direction < 0 ? value - snapIncrementOrArray : value + snapIncrementOrArray);
    };
  };
  var _getLabelAtDirection = function _getLabelAtDirection2(timeline2) {
    return function(value, st) {
      return _snapDirectional(_getLabelRatioArray(timeline2))(value, st.direction);
    };
  };
  var _multiListener = function _multiListener2(func, element, types, callback) {
    return types.split(",").forEach(function(type) {
      return func(element, type, callback);
    });
  };
  var _addListener3 = function _addListener4(element, type, func, nonPassive, capture) {
    return element.addEventListener(type, func, {
      passive: !nonPassive,
      capture: !!capture
    });
  };
  var _removeListener3 = function _removeListener4(element, type, func, capture) {
    return element.removeEventListener(type, func, !!capture);
  };
  var _wheelListener = function _wheelListener2(func, el, scrollFunc) {
    scrollFunc = scrollFunc && scrollFunc.wheelHandler;
    if (scrollFunc) {
      func(el, "wheel", scrollFunc);
      func(el, "touchmove", scrollFunc);
    }
  };
  var _markerDefaults = {
    startColor: "green",
    endColor: "red",
    indent: 0,
    fontSize: "16px",
    fontWeight: "normal"
  };
  var _defaults2 = {
    toggleActions: "play",
    anticipatePin: 0
  };
  var _keywords = {
    top: 0,
    left: 0,
    center: 0.5,
    bottom: 1,
    right: 1
  };
  var _offsetToPx = function _offsetToPx2(value, size) {
    if (_isString3(value)) {
      var eqIndex = value.indexOf("="), relative = ~eqIndex ? +(value.charAt(eqIndex - 1) + 1) * parseFloat(value.substr(eqIndex + 1)) : 0;
      if (~eqIndex) {
        value.indexOf("%") > eqIndex && (relative *= size / 100);
        value = value.substr(0, eqIndex - 1);
      }
      value = relative + (value in _keywords ? _keywords[value] * size : ~value.indexOf("%") ? parseFloat(value) * size / 100 : parseFloat(value) || 0);
    }
    return value;
  };
  var _createMarker = function _createMarker2(type, name, container, direction, _ref4, offset, matchWidthEl, containerAnimation) {
    var startColor = _ref4.startColor, endColor = _ref4.endColor, fontSize = _ref4.fontSize, indent = _ref4.indent, fontWeight = _ref4.fontWeight;
    var e2 = _doc4.createElement("div"), useFixedPosition = _isViewport3(container) || _getProxyProp(container, "pinType") === "fixed", isScroller = type.indexOf("scroller") !== -1, parent = useFixedPosition ? _body2 : container, isStart = type.indexOf("start") !== -1, color = isStart ? startColor : endColor, css = "border-color:" + color + ";font-size:" + fontSize + ";color:" + color + ";font-weight:" + fontWeight + ";pointer-events:none;white-space:nowrap;font-family:sans-serif,Arial;z-index:1000;padding:4px 8px;border-width:0;border-style:solid;";
    css += "position:" + ((isScroller || containerAnimation) && useFixedPosition ? "fixed;" : "absolute;");
    (isScroller || containerAnimation || !useFixedPosition) && (css += (direction === _vertical ? _right : _bottom) + ":" + (offset + parseFloat(indent)) + "px;");
    matchWidthEl && (css += "box-sizing:border-box;text-align:left;width:" + matchWidthEl.offsetWidth + "px;");
    e2._isStart = isStart;
    e2.setAttribute("class", "gsap-marker-" + type + (name ? " marker-" + name : ""));
    e2.style.cssText = css;
    e2.innerText = name || name === 0 ? type + "-" + name : type;
    parent.children[0] ? parent.insertBefore(e2, parent.children[0]) : parent.appendChild(e2);
    e2._offset = e2["offset" + direction.op.d2];
    _positionMarker(e2, 0, direction, isStart);
    return e2;
  };
  var _positionMarker = function _positionMarker2(marker, start, direction, flipped) {
    var vars = {
      display: "block"
    }, side = direction[flipped ? "os2" : "p2"], oppositeSide = direction[flipped ? "p2" : "os2"];
    marker._isFlipped = flipped;
    vars[direction.a + "Percent"] = flipped ? -100 : 0;
    vars[direction.a] = flipped ? "1px" : 0;
    vars["border" + side + _Width] = 1;
    vars["border" + oppositeSide + _Width] = 0;
    vars[direction.p] = start + "px";
    gsap6.set(marker, vars);
  };
  var _triggers = [];
  var _ids = {};
  var _rafID;
  var _sync = function _sync2() {
    return _getTime2() - _lastScrollTime > 34 && (_rafID || (_rafID = requestAnimationFrame(_updateAll)));
  };
  var _onScroll3 = function _onScroll4() {
    if (!_normalizer2 || !_normalizer2.isPressed || _normalizer2.startX > _body2.clientWidth) {
      _scrollers.cache++;
      if (_normalizer2) {
        _rafID || (_rafID = requestAnimationFrame(_updateAll));
      } else {
        _updateAll();
      }
      _lastScrollTime || _dispatch3("scrollStart");
      _lastScrollTime = _getTime2();
    }
  };
  var _setBaseDimensions = function _setBaseDimensions2() {
    _baseScreenWidth = _win4.innerWidth;
    _baseScreenHeight = _win4.innerHeight;
  };
  var _onResize = function _onResize2(force) {
    _scrollers.cache++;
    (force === true || !_refreshing && !_ignoreResize && !_doc4.fullscreenElement && !_doc4.webkitFullscreenElement && (!_ignoreMobileResize || _baseScreenWidth !== _win4.innerWidth || Math.abs(_win4.innerHeight - _baseScreenHeight) > _win4.innerHeight * 0.25)) && _resizeDelay.restart(true);
  };
  var _listeners2 = {};
  var _emptyArray3 = [];
  var _softRefresh = function _softRefresh2() {
    return _removeListener3(ScrollTrigger2, "scrollEnd", _softRefresh2) || _refreshAll(true);
  };
  var _dispatch3 = function _dispatch4(type) {
    return _listeners2[type] && _listeners2[type].map(function(f2) {
      return f2();
    }) || _emptyArray3;
  };
  var _savedStyles = [];
  var _revertRecorded = function _revertRecorded2(media) {
    for (var i2 = 0; i2 < _savedStyles.length; i2 += 5) {
      if (!media || _savedStyles[i2 + 4] && _savedStyles[i2 + 4].query === media) {
        _savedStyles[i2].style.cssText = _savedStyles[i2 + 1];
        _savedStyles[i2].getBBox && _savedStyles[i2].setAttribute("transform", _savedStyles[i2 + 2] || "");
        _savedStyles[i2 + 3].uncache = 1;
      }
    }
  };
  var _revertAll = function _revertAll2(kill, media) {
    var trigger;
    for (_i = 0; _i < _triggers.length; _i++) {
      trigger = _triggers[_i];
      if (trigger && (!media || trigger._ctx === media)) {
        if (kill) {
          trigger.kill(1);
        } else {
          trigger.revert(true, true);
        }
      }
    }
    _isReverted = true;
    media && _revertRecorded(media);
    media || _dispatch3("revert");
  };
  var _clearScrollMemory = function _clearScrollMemory2(scrollRestoration, force) {
    _scrollers.cache++;
    (force || !_refreshingAll) && _scrollers.forEach(function(obj) {
      return _isFunction3(obj) && obj.cacheID++ && (obj.rec = 0);
    });
    _isString3(scrollRestoration) && (_win4.history.scrollRestoration = _scrollRestoration = scrollRestoration);
  };
  var _refreshingAll;
  var _refreshID = 0;
  var _queueRefreshID;
  var _queueRefreshAll = function _queueRefreshAll2() {
    if (_queueRefreshID !== _refreshID) {
      var id = _queueRefreshID = _refreshID;
      requestAnimationFrame(function() {
        return id === _refreshID && _refreshAll(true);
      });
    }
  };
  var _refresh100vh = function _refresh100vh2() {
    _body2.appendChild(_div100vh);
    _100vh = !_normalizer2 && _div100vh.offsetHeight || _win4.innerHeight;
    _body2.removeChild(_div100vh);
  };
  var _hideAllMarkers = function _hideAllMarkers2(hide) {
    return _toArray2(".gsap-marker-start, .gsap-marker-end, .gsap-marker-scroller-start, .gsap-marker-scroller-end").forEach(function(el) {
      return el.style.display = hide ? "none" : "block";
    });
  };
  var _refreshAll = function _refreshAll2(force, skipRevert) {
    _docEl2 = _doc4.documentElement;
    _body2 = _doc4.body;
    _root2 = [_win4, _doc4, _docEl2, _body2];
    if (_lastScrollTime && !force && !_isReverted) {
      _addListener3(ScrollTrigger2, "scrollEnd", _softRefresh);
      return;
    }
    _refresh100vh();
    _refreshingAll = ScrollTrigger2.isRefreshing = true;
    _scrollers.forEach(function(obj) {
      return _isFunction3(obj) && ++obj.cacheID && (obj.rec = obj());
    });
    var refreshInits = _dispatch3("refreshInit");
    _sort && ScrollTrigger2.sort();
    skipRevert || _revertAll();
    _scrollers.forEach(function(obj) {
      if (_isFunction3(obj)) {
        obj.smooth && (obj.target.style.scrollBehavior = "auto");
        obj(0);
      }
    });
    _triggers.slice(0).forEach(function(t2) {
      return t2.refresh();
    });
    _isReverted = false;
    _triggers.forEach(function(t2) {
      if (t2._subPinOffset && t2.pin) {
        var prop = t2.vars.horizontal ? "offsetWidth" : "offsetHeight", original = t2.pin[prop];
        t2.revert(true, 1);
        t2.adjustPinSpacing(t2.pin[prop] - original);
        t2.refresh();
      }
    });
    _clampingMax = 1;
    _hideAllMarkers(true);
    _triggers.forEach(function(t2) {
      var max = _maxScroll(t2.scroller, t2._dir), endClamp = t2.vars.end === "max" || t2._endClamp && t2.end > max, startClamp = t2._startClamp && t2.start >= max;
      (endClamp || startClamp) && t2.setPositions(startClamp ? max - 1 : t2.start, endClamp ? Math.max(startClamp ? max : t2.start + 1, max) : t2.end, true);
    });
    _hideAllMarkers(false);
    _clampingMax = 0;
    refreshInits.forEach(function(result) {
      return result && result.render && result.render(-1);
    });
    _scrollers.forEach(function(obj) {
      if (_isFunction3(obj)) {
        obj.smooth && requestAnimationFrame(function() {
          return obj.target.style.scrollBehavior = "smooth";
        });
        obj.rec && obj(obj.rec);
      }
    });
    _clearScrollMemory(_scrollRestoration, 1);
    _resizeDelay.pause();
    _refreshID++;
    _refreshingAll = 2;
    _updateAll(2);
    _triggers.forEach(function(t2) {
      return _isFunction3(t2.vars.onRefresh) && t2.vars.onRefresh(t2);
    });
    _refreshingAll = ScrollTrigger2.isRefreshing = false;
    _dispatch3("refresh");
  };
  var _lastScroll = 0;
  var _direction = 1;
  var _primary;
  var _updateAll = function _updateAll2(force) {
    if (force === 2 || !_refreshingAll && !_isReverted) {
      ScrollTrigger2.isUpdating = true;
      _primary && _primary.update(0);
      var l2 = _triggers.length, time = _getTime2(), recordVelocity = time - _time1 >= 50, scroll = l2 && _triggers[0].scroll();
      _direction = _lastScroll > scroll ? -1 : 1;
      _refreshingAll || (_lastScroll = scroll);
      if (recordVelocity) {
        if (_lastScrollTime && !_pointerIsDown && time - _lastScrollTime > 200) {
          _lastScrollTime = 0;
          _dispatch3("scrollEnd");
        }
        _time2 = _time1;
        _time1 = time;
      }
      if (_direction < 0) {
        _i = l2;
        while (_i-- > 0) {
          _triggers[_i] && _triggers[_i].update(0, recordVelocity);
        }
        _direction = 1;
      } else {
        for (_i = 0; _i < l2; _i++) {
          _triggers[_i] && _triggers[_i].update(0, recordVelocity);
        }
      }
      ScrollTrigger2.isUpdating = false;
    }
    _rafID = 0;
  };
  var _propNamesToCopy = [_left, _top, _bottom, _right, _margin + _Bottom, _margin + _Right, _margin + _Top, _margin + _Left, "display", "flexShrink", "float", "zIndex", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "gridArea", "justifySelf", "alignSelf", "placeSelf", "order"];
  var _stateProps = _propNamesToCopy.concat([_width, _height, "boxSizing", "max" + _Width, "max" + _Height, "position", _margin, _padding, _padding + _Top, _padding + _Right, _padding + _Bottom, _padding + _Left]);
  var _swapPinOut = function _swapPinOut2(pin, spacer, state) {
    _setState(state);
    var cache = pin._gsap;
    if (cache.spacerIsNative) {
      _setState(cache.spacerState);
    } else if (pin._gsap.swappedIn) {
      var parent = spacer.parentNode;
      if (parent) {
        parent.insertBefore(pin, spacer);
        parent.removeChild(spacer);
      }
    }
    pin._gsap.swappedIn = false;
  };
  var _swapPinIn = function _swapPinIn2(pin, spacer, cs, spacerState) {
    if (!pin._gsap.swappedIn) {
      var i2 = _propNamesToCopy.length, spacerStyle = spacer.style, pinStyle = pin.style, p2;
      while (i2--) {
        p2 = _propNamesToCopy[i2];
        spacerStyle[p2] = cs[p2];
      }
      spacerStyle.position = cs.position === "absolute" ? "absolute" : "relative";
      cs.display === "inline" && (spacerStyle.display = "inline-block");
      pinStyle[_bottom] = pinStyle[_right] = "auto";
      spacerStyle.flexBasis = cs.flexBasis || "auto";
      spacerStyle.overflow = "visible";
      spacerStyle.boxSizing = "border-box";
      spacerStyle[_width] = _getSize(pin, _horizontal) + _px;
      spacerStyle[_height] = _getSize(pin, _vertical) + _px;
      spacerStyle[_padding] = pinStyle[_margin] = pinStyle[_top] = pinStyle[_left] = "0";
      _setState(spacerState);
      pinStyle[_width] = pinStyle["max" + _Width] = cs[_width];
      pinStyle[_height] = pinStyle["max" + _Height] = cs[_height];
      pinStyle[_padding] = cs[_padding];
      if (pin.parentNode !== spacer) {
        pin.parentNode.insertBefore(spacer, pin);
        spacer.appendChild(pin);
      }
      pin._gsap.swappedIn = true;
    }
  };
  var _capsExp2 = /([A-Z])/g;
  var _setState = function _setState2(state) {
    if (state) {
      var style = state.t.style, l2 = state.length, i2 = 0, p2, value;
      (state.t._gsap || gsap6.core.getCache(state.t)).uncache = 1;
      for (; i2 < l2; i2 += 2) {
        value = state[i2 + 1];
        p2 = state[i2];
        if (value) {
          style[p2] = value;
        } else if (style[p2]) {
          style.removeProperty(p2.replace(_capsExp2, "-$1").toLowerCase());
        }
      }
    }
  };
  var _getState = function _getState2(element) {
    var l2 = _stateProps.length, style = element.style, state = [], i2 = 0;
    for (; i2 < l2; i2++) {
      state.push(_stateProps[i2], style[_stateProps[i2]]);
    }
    state.t = element;
    return state;
  };
  var _copyState = function _copyState2(state, override, omitOffsets) {
    var result = [], l2 = state.length, i2 = omitOffsets ? 8 : 0, p2;
    for (; i2 < l2; i2 += 2) {
      p2 = state[i2];
      result.push(p2, p2 in override ? override[p2] : state[i2 + 1]);
    }
    result.t = state.t;
    return result;
  };
  var _winOffsets = {
    left: 0,
    top: 0
  };
  var _parsePosition3 = function _parsePosition4(value, trigger, scrollerSize, direction, scroll, marker, markerScroller, self, scrollerBounds, borderWidth, useFixedPosition, scrollerMax, containerAnimation, clampZeroProp) {
    _isFunction3(value) && (value = value(self));
    if (_isString3(value) && value.substr(0, 3) === "max") {
      value = scrollerMax + (value.charAt(4) === "=" ? _offsetToPx("0" + value.substr(3), scrollerSize) : 0);
    }
    var time = containerAnimation ? containerAnimation.time() : 0, p1, p2, element;
    containerAnimation && containerAnimation.seek(0);
    isNaN(value) || (value = +value);
    if (!_isNumber5(value)) {
      _isFunction3(trigger) && (trigger = trigger(self));
      var offsets = (value || "0").split(" "), bounds, localOffset, globalOffset, display;
      element = _getTarget(trigger, self) || _body2;
      bounds = _getBounds(element) || {};
      if ((!bounds || !bounds.left && !bounds.top) && _getComputedStyle(element).display === "none") {
        display = element.style.display;
        element.style.display = "block";
        bounds = _getBounds(element);
        display ? element.style.display = display : element.style.removeProperty("display");
      }
      localOffset = _offsetToPx(offsets[0], bounds[direction.d]);
      globalOffset = _offsetToPx(offsets[1] || "0", scrollerSize);
      value = bounds[direction.p] - scrollerBounds[direction.p] - borderWidth + localOffset + scroll - globalOffset;
      markerScroller && _positionMarker(markerScroller, globalOffset, direction, scrollerSize - globalOffset < 20 || markerScroller._isStart && globalOffset > 20);
      scrollerSize -= scrollerSize - globalOffset;
    } else {
      containerAnimation && (value = gsap6.utils.mapRange(containerAnimation.scrollTrigger.start, containerAnimation.scrollTrigger.end, 0, scrollerMax, value));
      markerScroller && _positionMarker(markerScroller, scrollerSize, direction, true);
    }
    if (clampZeroProp) {
      self[clampZeroProp] = value || -1e-3;
      value < 0 && (value = 0);
    }
    if (marker) {
      var position = value + scrollerSize, isStart = marker._isStart;
      p1 = "scroll" + direction.d2;
      _positionMarker(marker, position, direction, isStart && position > 20 || !isStart && (useFixedPosition ? Math.max(_body2[p1], _docEl2[p1]) : marker.parentNode[p1]) <= position + 1);
      if (useFixedPosition) {
        scrollerBounds = _getBounds(markerScroller);
        useFixedPosition && (marker.style[direction.op.p] = scrollerBounds[direction.op.p] - direction.op.m - marker._offset + _px);
      }
    }
    if (containerAnimation && element) {
      p1 = _getBounds(element);
      containerAnimation.seek(scrollerMax);
      p2 = _getBounds(element);
      containerAnimation._caScrollDist = p1[direction.p] - p2[direction.p];
      value = value / containerAnimation._caScrollDist * scrollerMax;
    }
    containerAnimation && containerAnimation.seek(time);
    return containerAnimation ? value : Math.round(value);
  };
  var _prefixExp = /(webkit|moz|length|cssText|inset)/i;
  var _reparent = function _reparent2(element, parent, top, left) {
    if (element.parentNode !== parent) {
      var style = element.style, p2, cs;
      if (parent === _body2) {
        element._stOrig = style.cssText;
        cs = _getComputedStyle(element);
        for (p2 in cs) {
          if (!+p2 && !_prefixExp.test(p2) && cs[p2] && typeof style[p2] === "string" && p2 !== "0") {
            style[p2] = cs[p2];
          }
        }
        style.top = top;
        style.left = left;
      } else {
        style.cssText = element._stOrig;
      }
      gsap6.core.getCache(element).uncache = 1;
      parent.appendChild(element);
    }
  };
  var _interruptionTracker = function _interruptionTracker2(getValueFunc, initialValue, onInterrupt) {
    var last1 = initialValue, last2 = last1;
    return function(value) {
      var current = Math.round(getValueFunc());
      if (current !== last1 && current !== last2 && Math.abs(current - last1) > 3 && Math.abs(current - last2) > 3) {
        value = current;
        onInterrupt && onInterrupt();
      }
      last2 = last1;
      last1 = Math.round(value);
      return last1;
    };
  };
  var _shiftMarker = function _shiftMarker2(marker, direction, value) {
    var vars = {};
    vars[direction.p] = "+=" + value;
    gsap6.set(marker, vars);
  };
  var _getTweenCreator = function _getTweenCreator2(scroller, direction) {
    var getScroll = _getScrollFunc(scroller, direction), prop = "_scroll" + direction.p2, getTween = function getTween2(scrollTo, vars, initialValue, change1, change2) {
      var tween = getTween2.tween, onComplete = vars.onComplete, modifiers = {};
      initialValue = initialValue || getScroll();
      var checkForInterruption = _interruptionTracker(getScroll, initialValue, function() {
        tween.kill();
        getTween2.tween = 0;
      });
      change2 = change1 && change2 || 0;
      change1 = change1 || scrollTo - initialValue;
      tween && tween.kill();
      vars[prop] = scrollTo;
      vars.inherit = false;
      vars.modifiers = modifiers;
      modifiers[prop] = function() {
        return checkForInterruption(initialValue + change1 * tween.ratio + change2 * tween.ratio * tween.ratio);
      };
      vars.onUpdate = function() {
        _scrollers.cache++;
        getTween2.tween && _updateAll();
      };
      vars.onComplete = function() {
        getTween2.tween = 0;
        onComplete && onComplete.call(tween);
      };
      tween = getTween2.tween = gsap6.to(scroller, vars);
      return tween;
    };
    scroller[prop] = getScroll;
    getScroll.wheelHandler = function() {
      return getTween.tween && getTween.tween.kill() && (getTween.tween = 0);
    };
    _addListener3(scroller, "wheel", getScroll.wheelHandler);
    ScrollTrigger2.isTouch && _addListener3(scroller, "touchmove", getScroll.wheelHandler);
    return getTween;
  };
  var ScrollTrigger2 = /* @__PURE__ */ function() {
    function ScrollTrigger3(vars, animation) {
      _coreInitted6 || ScrollTrigger3.register(gsap6) || console.warn("Please gsap.registerPlugin(ScrollTrigger)");
      _context4(this);
      this.init(vars, animation);
    }
    var _proto = ScrollTrigger3.prototype;
    _proto.init = function init4(vars, animation) {
      this.progress = this.start = 0;
      this.vars && this.kill(true, true);
      if (!_enabled) {
        this.update = this.refresh = this.kill = _passThrough3;
        return;
      }
      vars = _setDefaults3(_isString3(vars) || _isNumber5(vars) || vars.nodeType ? {
        trigger: vars
      } : vars, _defaults2);
      var _vars = vars, onUpdate = _vars.onUpdate, toggleClass = _vars.toggleClass, id = _vars.id, onToggle = _vars.onToggle, onRefresh = _vars.onRefresh, scrub = _vars.scrub, trigger = _vars.trigger, pin = _vars.pin, pinSpacing = _vars.pinSpacing, invalidateOnRefresh = _vars.invalidateOnRefresh, anticipatePin = _vars.anticipatePin, onScrubComplete = _vars.onScrubComplete, onSnapComplete = _vars.onSnapComplete, once = _vars.once, snap3 = _vars.snap, pinReparent = _vars.pinReparent, pinSpacer = _vars.pinSpacer, containerAnimation = _vars.containerAnimation, fastScrollEnd = _vars.fastScrollEnd, preventOverlaps = _vars.preventOverlaps, direction = vars.horizontal || vars.containerAnimation && vars.horizontal !== false ? _horizontal : _vertical, isToggle = !scrub && scrub !== 0, scroller = _getTarget(vars.scroller || _win4), scrollerCache = gsap6.core.getCache(scroller), isViewport = _isViewport3(scroller), useFixedPosition = ("pinType" in vars ? vars.pinType : _getProxyProp(scroller, "pinType") || isViewport && "fixed") === "fixed", callbacks = [vars.onEnter, vars.onLeave, vars.onEnterBack, vars.onLeaveBack], toggleActions = isToggle && vars.toggleActions.split(" "), markers = "markers" in vars ? vars.markers : _defaults2.markers, borderWidth = isViewport ? 0 : parseFloat(_getComputedStyle(scroller)["border" + direction.p2 + _Width]) || 0, self = this, onRefreshInit = vars.onRefreshInit && function() {
        return vars.onRefreshInit(self);
      }, getScrollerSize = _getSizeFunc(scroller, isViewport, direction), getScrollerOffsets = _getOffsetsFunc(scroller, isViewport), lastSnap = 0, lastRefresh = 0, prevProgress = 0, scrollFunc = _getScrollFunc(scroller, direction), tweenTo, pinCache, snapFunc, scroll1, scroll2, start, end, markerStart, markerEnd, markerStartTrigger, markerEndTrigger, markerVars, executingOnRefresh, change, pinOriginalState, pinActiveState, pinState, spacer, offset, pinGetter, pinSetter, pinStart, pinChange, spacingStart, spacerState, markerStartSetter, pinMoves, markerEndSetter, cs, snap1, snap22, scrubTween, scrubSmooth, snapDurClamp, snapDelayedCall, prevScroll, prevAnimProgress, caMarkerSetter, customRevertReturn;
      self._startClamp = self._endClamp = false;
      self._dir = direction;
      anticipatePin *= 45;
      self.scroller = scroller;
      self.scroll = containerAnimation ? containerAnimation.time.bind(containerAnimation) : scrollFunc;
      scroll1 = scrollFunc();
      self.vars = vars;
      animation = animation || vars.animation;
      if ("refreshPriority" in vars) {
        _sort = 1;
        vars.refreshPriority === -9999 && (_primary = self);
      }
      scrollerCache.tweenScroll = scrollerCache.tweenScroll || {
        top: _getTweenCreator(scroller, _vertical),
        left: _getTweenCreator(scroller, _horizontal)
      };
      self.tweenTo = tweenTo = scrollerCache.tweenScroll[direction.p];
      self.scrubDuration = function(value) {
        scrubSmooth = _isNumber5(value) && value;
        if (!scrubSmooth) {
          scrubTween && scrubTween.progress(1).kill();
          scrubTween = 0;
        } else {
          scrubTween ? scrubTween.duration(value) : scrubTween = gsap6.to(animation, {
            ease: "expo",
            totalProgress: "+=0",
            inherit: false,
            duration: scrubSmooth,
            paused: true,
            onComplete: function onComplete() {
              return onScrubComplete && onScrubComplete(self);
            }
          });
        }
      };
      if (animation) {
        animation.vars.lazy = false;
        animation._initted && !self.isReverted || animation.vars.immediateRender !== false && vars.immediateRender !== false && animation.duration() && animation.render(0, true, true);
        self.animation = animation.pause();
        animation.scrollTrigger = self;
        self.scrubDuration(scrub);
        snap1 = 0;
        id || (id = animation.vars.id);
      }
      if (snap3) {
        if (!_isObject3(snap3) || snap3.push) {
          snap3 = {
            snapTo: snap3
          };
        }
        "scrollBehavior" in _body2.style && gsap6.set(isViewport ? [_body2, _docEl2] : scroller, {
          scrollBehavior: "auto"
        });
        _scrollers.forEach(function(o2) {
          return _isFunction3(o2) && o2.target === (isViewport ? _doc4.scrollingElement || _docEl2 : scroller) && (o2.smooth = false);
        });
        snapFunc = _isFunction3(snap3.snapTo) ? snap3.snapTo : snap3.snapTo === "labels" ? _getClosestLabel(animation) : snap3.snapTo === "labelsDirectional" ? _getLabelAtDirection(animation) : snap3.directional !== false ? function(value, st) {
          return _snapDirectional(snap3.snapTo)(value, _getTime2() - lastRefresh < 500 ? 0 : st.direction);
        } : gsap6.utils.snap(snap3.snapTo);
        snapDurClamp = snap3.duration || {
          min: 0.1,
          max: 2
        };
        snapDurClamp = _isObject3(snapDurClamp) ? _clamp4(snapDurClamp.min, snapDurClamp.max) : _clamp4(snapDurClamp, snapDurClamp);
        snapDelayedCall = gsap6.delayedCall(snap3.delay || scrubSmooth / 2 || 0.1, function() {
          var scroll = scrollFunc(), refreshedRecently = _getTime2() - lastRefresh < 500, tween = tweenTo.tween;
          if ((refreshedRecently || Math.abs(self.getVelocity()) < 10) && !tween && !_pointerIsDown && lastSnap !== scroll) {
            var progress = (scroll - start) / change, totalProgress = animation && !isToggle ? animation.totalProgress() : progress, velocity = refreshedRecently ? 0 : (totalProgress - snap22) / (_getTime2() - _time2) * 1e3 || 0, change1 = gsap6.utils.clamp(-progress, 1 - progress, _abs2(velocity / 2) * velocity / 0.185), naturalEnd = progress + (snap3.inertia === false ? 0 : change1), endValue, endScroll, _snap = snap3, onStart = _snap.onStart, _onInterrupt = _snap.onInterrupt, _onComplete = _snap.onComplete;
            endValue = snapFunc(naturalEnd, self);
            _isNumber5(endValue) || (endValue = naturalEnd);
            endScroll = Math.max(0, Math.round(start + endValue * change));
            if (scroll <= end && scroll >= start && endScroll !== scroll) {
              if (tween && !tween._initted && tween.data <= _abs2(endScroll - scroll)) {
                return;
              }
              if (snap3.inertia === false) {
                change1 = endValue - progress;
              }
              tweenTo(endScroll, {
                duration: snapDurClamp(_abs2(Math.max(_abs2(naturalEnd - totalProgress), _abs2(endValue - totalProgress)) * 0.185 / velocity / 0.05 || 0)),
                ease: snap3.ease || "power3",
                data: _abs2(endScroll - scroll),
                // record the distance so that if another snap tween occurs (conflict) we can prioritize the closest snap.
                onInterrupt: function onInterrupt() {
                  return snapDelayedCall.restart(true) && _onInterrupt && _onInterrupt(self);
                },
                onComplete: function onComplete() {
                  self.update();
                  lastSnap = scrollFunc();
                  if (animation && !isToggle) {
                    scrubTween ? scrubTween.resetTo("totalProgress", endValue, animation._tTime / animation._tDur) : animation.progress(endValue);
                  }
                  snap1 = snap22 = animation && !isToggle ? animation.totalProgress() : self.progress;
                  onSnapComplete && onSnapComplete(self);
                  _onComplete && _onComplete(self);
                }
              }, scroll, change1 * change, endScroll - scroll - change1 * change);
              onStart && onStart(self, tweenTo.tween);
            }
          } else if (self.isActive && lastSnap !== scroll) {
            snapDelayedCall.restart(true);
          }
        }).pause();
      }
      id && (_ids[id] = self);
      trigger = self.trigger = _getTarget(trigger || pin !== true && pin);
      customRevertReturn = trigger && trigger._gsap && trigger._gsap.stRevert;
      customRevertReturn && (customRevertReturn = customRevertReturn(self));
      pin = pin === true ? trigger : _getTarget(pin);
      _isString3(toggleClass) && (toggleClass = {
        targets: trigger,
        className: toggleClass
      });
      if (pin) {
        pinSpacing === false || pinSpacing === _margin || (pinSpacing = !pinSpacing && pin.parentNode && pin.parentNode.style && _getComputedStyle(pin.parentNode).display === "flex" ? false : _padding);
        self.pin = pin;
        pinCache = gsap6.core.getCache(pin);
        if (!pinCache.spacer) {
          if (pinSpacer) {
            pinSpacer = _getTarget(pinSpacer);
            pinSpacer && !pinSpacer.nodeType && (pinSpacer = pinSpacer.current || pinSpacer.nativeElement);
            pinCache.spacerIsNative = !!pinSpacer;
            pinSpacer && (pinCache.spacerState = _getState(pinSpacer));
          }
          pinCache.spacer = spacer = pinSpacer || _doc4.createElement("div");
          spacer.classList.add("pin-spacer");
          id && spacer.classList.add("pin-spacer-" + id);
          pinCache.pinState = pinOriginalState = _getState(pin);
        } else {
          pinOriginalState = pinCache.pinState;
        }
        vars.force3D !== false && gsap6.set(pin, {
          force3D: true
        });
        self.spacer = spacer = pinCache.spacer;
        cs = _getComputedStyle(pin);
        spacingStart = cs[pinSpacing + direction.os2];
        pinGetter = gsap6.getProperty(pin);
        pinSetter = gsap6.quickSetter(pin, direction.a, _px);
        _swapPinIn(pin, spacer, cs);
        pinState = _getState(pin);
      }
      if (markers) {
        markerVars = _isObject3(markers) ? _setDefaults3(markers, _markerDefaults) : _markerDefaults;
        markerStartTrigger = _createMarker("scroller-start", id, scroller, direction, markerVars, 0);
        markerEndTrigger = _createMarker("scroller-end", id, scroller, direction, markerVars, 0, markerStartTrigger);
        offset = markerStartTrigger["offset" + direction.op.d2];
        var content = _getTarget(_getProxyProp(scroller, "content") || scroller);
        markerStart = this.markerStart = _createMarker("start", id, content, direction, markerVars, offset, 0, containerAnimation);
        markerEnd = this.markerEnd = _createMarker("end", id, content, direction, markerVars, offset, 0, containerAnimation);
        containerAnimation && (caMarkerSetter = gsap6.quickSetter([markerStart, markerEnd], direction.a, _px));
        if (!useFixedPosition && !(_proxies.length && _getProxyProp(scroller, "fixedMarkers") === true)) {
          _makePositionable(isViewport ? _body2 : scroller);
          gsap6.set([markerStartTrigger, markerEndTrigger], {
            force3D: true
          });
          markerStartSetter = gsap6.quickSetter(markerStartTrigger, direction.a, _px);
          markerEndSetter = gsap6.quickSetter(markerEndTrigger, direction.a, _px);
        }
      }
      if (containerAnimation) {
        var oldOnUpdate = containerAnimation.vars.onUpdate, oldParams = containerAnimation.vars.onUpdateParams;
        containerAnimation.eventCallback("onUpdate", function() {
          self.update(0, 0, 1);
          oldOnUpdate && oldOnUpdate.apply(containerAnimation, oldParams || []);
        });
      }
      self.previous = function() {
        return _triggers[_triggers.indexOf(self) - 1];
      };
      self.next = function() {
        return _triggers[_triggers.indexOf(self) + 1];
      };
      self.revert = function(revert, temp) {
        if (!temp) {
          return self.kill(true);
        }
        var r2 = revert !== false || !self.enabled, prevRefreshing = _refreshing;
        if (r2 !== self.isReverted) {
          if (r2) {
            prevScroll = Math.max(scrollFunc(), self.scroll.rec || 0);
            prevProgress = self.progress;
            prevAnimProgress = animation && animation.progress();
          }
          markerStart && [markerStart, markerEnd, markerStartTrigger, markerEndTrigger].forEach(function(m) {
            return m.style.display = r2 ? "none" : "block";
          });
          if (r2) {
            _refreshing = self;
            self.update(r2);
          }
          if (pin && (!pinReparent || !self.isActive)) {
            if (r2) {
              _swapPinOut(pin, spacer, pinOriginalState);
            } else {
              _swapPinIn(pin, spacer, _getComputedStyle(pin), spacerState);
            }
          }
          r2 || self.update(r2);
          _refreshing = prevRefreshing;
          self.isReverted = r2;
        }
      };
      self.refresh = function(soft, force, position, pinOffset) {
        if ((_refreshing || !self.enabled) && !force) {
          return;
        }
        if (pin && soft && _lastScrollTime) {
          _addListener3(ScrollTrigger3, "scrollEnd", _softRefresh);
          return;
        }
        !_refreshingAll && onRefreshInit && onRefreshInit(self);
        _refreshing = self;
        if (tweenTo.tween && !position) {
          tweenTo.tween.kill();
          tweenTo.tween = 0;
        }
        scrubTween && scrubTween.pause();
        if (invalidateOnRefresh && animation) {
          animation.revert({
            kill: false
          }).invalidate();
          animation.getChildren && animation.getChildren(true, true, false).forEach(function(t2) {
            return t2.vars.immediateRender && t2.render(0, true, true);
          });
        }
        self.isReverted || self.revert(true, true);
        self._subPinOffset = false;
        var size = getScrollerSize(), scrollerBounds = getScrollerOffsets(), max = containerAnimation ? containerAnimation.duration() : _maxScroll(scroller, direction), isFirstRefresh = change <= 0.01 || !change, offset2 = 0, otherPinOffset = pinOffset || 0, parsedEnd = _isObject3(position) ? position.end : vars.end, parsedEndTrigger = vars.endTrigger || trigger, parsedStart = _isObject3(position) ? position.start : vars.start || (vars.start === 0 || !trigger ? 0 : pin ? "0 0" : "0 100%"), pinnedContainer = self.pinnedContainer = vars.pinnedContainer && _getTarget(vars.pinnedContainer, self), triggerIndex = trigger && Math.max(0, _triggers.indexOf(self)) || 0, i2 = triggerIndex, cs2, bounds, scroll, isVertical, override, curTrigger, curPin, oppositeScroll, initted, revertedPins, forcedOverflow, markerStartOffset, markerEndOffset;
        if (markers && _isObject3(position)) {
          markerStartOffset = gsap6.getProperty(markerStartTrigger, direction.p);
          markerEndOffset = gsap6.getProperty(markerEndTrigger, direction.p);
        }
        while (i2-- > 0) {
          curTrigger = _triggers[i2];
          curTrigger.end || curTrigger.refresh(0, 1) || (_refreshing = self);
          curPin = curTrigger.pin;
          if (curPin && (curPin === trigger || curPin === pin || curPin === pinnedContainer) && !curTrigger.isReverted) {
            revertedPins || (revertedPins = []);
            revertedPins.unshift(curTrigger);
            curTrigger.revert(true, true);
          }
          if (curTrigger !== _triggers[i2]) {
            triggerIndex--;
            i2--;
          }
        }
        _isFunction3(parsedStart) && (parsedStart = parsedStart(self));
        parsedStart = _parseClamp(parsedStart, "start", self);
        start = _parsePosition3(parsedStart, trigger, size, direction, scrollFunc(), markerStart, markerStartTrigger, self, scrollerBounds, borderWidth, useFixedPosition, max, containerAnimation, self._startClamp && "_startClamp") || (pin ? -1e-3 : 0);
        _isFunction3(parsedEnd) && (parsedEnd = parsedEnd(self));
        if (_isString3(parsedEnd) && !parsedEnd.indexOf("+=")) {
          if (~parsedEnd.indexOf(" ")) {
            parsedEnd = (_isString3(parsedStart) ? parsedStart.split(" ")[0] : "") + parsedEnd;
          } else {
            offset2 = _offsetToPx(parsedEnd.substr(2), size);
            parsedEnd = _isString3(parsedStart) ? parsedStart : (containerAnimation ? gsap6.utils.mapRange(0, containerAnimation.duration(), containerAnimation.scrollTrigger.start, containerAnimation.scrollTrigger.end, start) : start) + offset2;
            parsedEndTrigger = trigger;
          }
        }
        parsedEnd = _parseClamp(parsedEnd, "end", self);
        end = Math.max(start, _parsePosition3(parsedEnd || (parsedEndTrigger ? "100% 0" : max), parsedEndTrigger, size, direction, scrollFunc() + offset2, markerEnd, markerEndTrigger, self, scrollerBounds, borderWidth, useFixedPosition, max, containerAnimation, self._endClamp && "_endClamp")) || -1e-3;
        offset2 = 0;
        i2 = triggerIndex;
        while (i2--) {
          curTrigger = _triggers[i2];
          curPin = curTrigger.pin;
          if (curPin && curTrigger.start - curTrigger._pinPush <= start && !containerAnimation && curTrigger.end > 0) {
            cs2 = curTrigger.end - (self._startClamp ? Math.max(0, curTrigger.start) : curTrigger.start);
            if ((curPin === trigger && curTrigger.start - curTrigger._pinPush < start || curPin === pinnedContainer) && isNaN(parsedStart)) {
              offset2 += cs2 * (1 - curTrigger.progress);
            }
            curPin === pin && (otherPinOffset += cs2);
          }
        }
        start += offset2;
        end += offset2;
        self._startClamp && (self._startClamp += offset2);
        if (self._endClamp && !_refreshingAll) {
          self._endClamp = end || -1e-3;
          end = Math.min(end, _maxScroll(scroller, direction));
        }
        change = end - start || (start -= 0.01) && 1e-3;
        if (isFirstRefresh) {
          prevProgress = gsap6.utils.clamp(0, 1, gsap6.utils.normalize(start, end, prevScroll));
        }
        self._pinPush = otherPinOffset;
        if (markerStart && offset2) {
          cs2 = {};
          cs2[direction.a] = "+=" + offset2;
          pinnedContainer && (cs2[direction.p] = "-=" + scrollFunc());
          gsap6.set([markerStart, markerEnd], cs2);
        }
        if (pin && !(_clampingMax && self.end >= _maxScroll(scroller, direction))) {
          cs2 = _getComputedStyle(pin);
          isVertical = direction === _vertical;
          scroll = scrollFunc();
          pinStart = parseFloat(pinGetter(direction.a)) + otherPinOffset;
          if (!max && end > 1) {
            forcedOverflow = (isViewport ? _doc4.scrollingElement || _docEl2 : scroller).style;
            forcedOverflow = {
              style: forcedOverflow,
              value: forcedOverflow["overflow" + direction.a.toUpperCase()]
            };
            if (isViewport && _getComputedStyle(_body2)["overflow" + direction.a.toUpperCase()] !== "scroll") {
              forcedOverflow.style["overflow" + direction.a.toUpperCase()] = "scroll";
            }
          }
          _swapPinIn(pin, spacer, cs2);
          pinState = _getState(pin);
          bounds = _getBounds(pin, true);
          oppositeScroll = useFixedPosition && _getScrollFunc(scroller, isVertical ? _horizontal : _vertical)();
          if (pinSpacing) {
            spacerState = [pinSpacing + direction.os2, change + otherPinOffset + _px];
            spacerState.t = spacer;
            i2 = pinSpacing === _padding ? _getSize(pin, direction) + change + otherPinOffset : 0;
            if (i2) {
              spacerState.push(direction.d, i2 + _px);
              spacer.style.flexBasis !== "auto" && (spacer.style.flexBasis = i2 + _px);
            }
            _setState(spacerState);
            if (pinnedContainer) {
              _triggers.forEach(function(t2) {
                if (t2.pin === pinnedContainer && t2.vars.pinSpacing !== false) {
                  t2._subPinOffset = true;
                }
              });
            }
            useFixedPosition && scrollFunc(prevScroll);
          } else {
            i2 = _getSize(pin, direction);
            i2 && spacer.style.flexBasis !== "auto" && (spacer.style.flexBasis = i2 + _px);
          }
          if (useFixedPosition) {
            override = {
              top: bounds.top + (isVertical ? scroll - start : oppositeScroll) + _px,
              left: bounds.left + (isVertical ? oppositeScroll : scroll - start) + _px,
              boxSizing: "border-box",
              position: "fixed"
            };
            override[_width] = override["max" + _Width] = Math.ceil(bounds.width) + _px;
            override[_height] = override["max" + _Height] = Math.ceil(bounds.height) + _px;
            override[_margin] = override[_margin + _Top] = override[_margin + _Right] = override[_margin + _Bottom] = override[_margin + _Left] = "0";
            override[_padding] = cs2[_padding];
            override[_padding + _Top] = cs2[_padding + _Top];
            override[_padding + _Right] = cs2[_padding + _Right];
            override[_padding + _Bottom] = cs2[_padding + _Bottom];
            override[_padding + _Left] = cs2[_padding + _Left];
            pinActiveState = _copyState(pinOriginalState, override, pinReparent);
            _refreshingAll && scrollFunc(0);
          }
          if (animation) {
            initted = animation._initted;
            _suppressOverwrites2(1);
            animation.render(animation.duration(), true, true);
            pinChange = pinGetter(direction.a) - pinStart + change + otherPinOffset;
            pinMoves = Math.abs(change - pinChange) > 1;
            useFixedPosition && pinMoves && pinActiveState.splice(pinActiveState.length - 2, 2);
            animation.render(0, true, true);
            initted || animation.invalidate(true);
            animation.parent || animation.totalTime(animation.totalTime());
            _suppressOverwrites2(0);
          } else {
            pinChange = change;
          }
          forcedOverflow && (forcedOverflow.value ? forcedOverflow.style["overflow" + direction.a.toUpperCase()] = forcedOverflow.value : forcedOverflow.style.removeProperty("overflow-" + direction.a));
        } else if (trigger && scrollFunc() && !containerAnimation) {
          bounds = trigger.parentNode;
          while (bounds && bounds !== _body2) {
            if (bounds._pinOffset) {
              start -= bounds._pinOffset;
              end -= bounds._pinOffset;
            }
            bounds = bounds.parentNode;
          }
        }
        revertedPins && revertedPins.forEach(function(t2) {
          return t2.revert(false, true);
        });
        self.start = start;
        self.end = end;
        scroll1 = scroll2 = _refreshingAll ? prevScroll : scrollFunc();
        if (!containerAnimation && !_refreshingAll) {
          scroll1 < prevScroll && scrollFunc(prevScroll);
          self.scroll.rec = 0;
        }
        self.revert(false, true);
        lastRefresh = _getTime2();
        if (snapDelayedCall) {
          lastSnap = -1;
          snapDelayedCall.restart(true);
        }
        _refreshing = 0;
        animation && isToggle && (animation._initted || prevAnimProgress) && animation.progress() !== prevAnimProgress && animation.progress(prevAnimProgress || 0, true).render(animation.time(), true, true);
        if (isFirstRefresh || prevProgress !== self.progress || containerAnimation || invalidateOnRefresh || animation && !animation._initted) {
          animation && !isToggle && (animation._initted || prevProgress || animation.vars.immediateRender !== false) && animation.totalProgress(containerAnimation && start < -1e-3 && !prevProgress ? gsap6.utils.normalize(start, end, 0) : prevProgress, true);
          self.progress = isFirstRefresh || (scroll1 - start) / change === prevProgress ? 0 : prevProgress;
        }
        pin && pinSpacing && (spacer._pinOffset = Math.round(self.progress * pinChange));
        scrubTween && scrubTween.invalidate();
        if (!isNaN(markerStartOffset)) {
          markerStartOffset -= gsap6.getProperty(markerStartTrigger, direction.p);
          markerEndOffset -= gsap6.getProperty(markerEndTrigger, direction.p);
          _shiftMarker(markerStartTrigger, direction, markerStartOffset);
          _shiftMarker(markerStart, direction, markerStartOffset - (pinOffset || 0));
          _shiftMarker(markerEndTrigger, direction, markerEndOffset);
          _shiftMarker(markerEnd, direction, markerEndOffset - (pinOffset || 0));
        }
        isFirstRefresh && !_refreshingAll && self.update();
        if (onRefresh && !_refreshingAll && !executingOnRefresh) {
          executingOnRefresh = true;
          onRefresh(self);
          executingOnRefresh = false;
        }
      };
      self.getVelocity = function() {
        return (scrollFunc() - scroll2) / (_getTime2() - _time2) * 1e3 || 0;
      };
      self.endAnimation = function() {
        _endAnimation(self.callbackAnimation);
        if (animation) {
          scrubTween ? scrubTween.progress(1) : !animation.paused() ? _endAnimation(animation, animation.reversed()) : isToggle || _endAnimation(animation, self.direction < 0, 1);
        }
      };
      self.labelToScroll = function(label) {
        return animation && animation.labels && (start || self.refresh() || start) + animation.labels[label] / animation.duration() * change || 0;
      };
      self.getTrailing = function(name) {
        var i2 = _triggers.indexOf(self), a2 = self.direction > 0 ? _triggers.slice(0, i2).reverse() : _triggers.slice(i2 + 1);
        return (_isString3(name) ? a2.filter(function(t2) {
          return t2.vars.preventOverlaps === name;
        }) : a2).filter(function(t2) {
          return self.direction > 0 ? t2.end <= start : t2.start >= end;
        });
      };
      self.update = function(reset, recordVelocity, forceFake) {
        if (containerAnimation && !forceFake && !reset) {
          return;
        }
        var scroll = _refreshingAll === true ? prevScroll : self.scroll(), p2 = reset ? 0 : (scroll - start) / change, clipped = p2 < 0 ? 0 : p2 > 1 ? 1 : p2 || 0, prevProgress2 = self.progress, isActive, wasActive, toggleState, action, stateChanged, toggled, isAtMax, isTakingAction;
        if (recordVelocity) {
          scroll2 = scroll1;
          scroll1 = containerAnimation ? scrollFunc() : scroll;
          if (snap3) {
            snap22 = snap1;
            snap1 = animation && !isToggle ? animation.totalProgress() : clipped;
          }
        }
        if (anticipatePin && pin && !_refreshing && !_startup2 && _lastScrollTime) {
          if (!clipped && start < scroll + (scroll - scroll2) / (_getTime2() - _time2) * anticipatePin) {
            clipped = 1e-4;
          } else if (clipped === 1 && end > scroll + (scroll - scroll2) / (_getTime2() - _time2) * anticipatePin) {
            clipped = 0.9999;
          }
        }
        if (clipped !== prevProgress2 && self.enabled) {
          isActive = self.isActive = !!clipped && clipped < 1;
          wasActive = !!prevProgress2 && prevProgress2 < 1;
          toggled = isActive !== wasActive;
          stateChanged = toggled || !!clipped !== !!prevProgress2;
          self.direction = clipped > prevProgress2 ? 1 : -1;
          self.progress = clipped;
          if (stateChanged && !_refreshing) {
            toggleState = clipped && !prevProgress2 ? 0 : clipped === 1 ? 1 : prevProgress2 === 1 ? 2 : 3;
            if (isToggle) {
              action = !toggled && toggleActions[toggleState + 1] !== "none" && toggleActions[toggleState + 1] || toggleActions[toggleState];
              isTakingAction = animation && (action === "complete" || action === "reset" || action in animation);
            }
          }
          preventOverlaps && (toggled || isTakingAction) && (isTakingAction || scrub || !animation) && (_isFunction3(preventOverlaps) ? preventOverlaps(self) : self.getTrailing(preventOverlaps).forEach(function(t2) {
            return t2.endAnimation();
          }));
          if (!isToggle) {
            if (scrubTween && !_refreshing && !_startup2) {
              scrubTween._dp._time - scrubTween._start !== scrubTween._time && scrubTween.render(scrubTween._dp._time - scrubTween._start);
              if (scrubTween.resetTo) {
                scrubTween.resetTo("totalProgress", clipped, animation._tTime / animation._tDur);
              } else {
                scrubTween.vars.totalProgress = clipped;
                scrubTween.invalidate().restart();
              }
            } else if (animation) {
              animation.totalProgress(clipped, !!(_refreshing && (lastRefresh || reset)));
            }
          }
          if (pin) {
            reset && pinSpacing && (spacer.style[pinSpacing + direction.os2] = spacingStart);
            if (!useFixedPosition) {
              pinSetter(_round7(pinStart + pinChange * clipped));
            } else if (stateChanged) {
              isAtMax = !reset && clipped > prevProgress2 && end + 1 > scroll && scroll + 1 >= _maxScroll(scroller, direction);
              if (pinReparent) {
                if (!reset && (isActive || isAtMax)) {
                  var bounds = _getBounds(pin, true), _offset = scroll - start;
                  _reparent(pin, _body2, bounds.top + (direction === _vertical ? _offset : 0) + _px, bounds.left + (direction === _vertical ? 0 : _offset) + _px);
                } else {
                  _reparent(pin, spacer);
                }
              }
              _setState(isActive || isAtMax ? pinActiveState : pinState);
              pinMoves && clipped < 1 && isActive || pinSetter(pinStart + (clipped === 1 && !isAtMax ? pinChange : 0));
            }
          }
          snap3 && !tweenTo.tween && !_refreshing && !_startup2 && snapDelayedCall.restart(true);
          toggleClass && (toggled || once && clipped && (clipped < 1 || !_limitCallbacks)) && _toArray2(toggleClass.targets).forEach(function(el) {
            return el.classList[isActive || once ? "add" : "remove"](toggleClass.className);
          });
          onUpdate && !isToggle && !reset && onUpdate(self);
          if (stateChanged && !_refreshing) {
            if (isToggle) {
              if (isTakingAction) {
                if (action === "complete") {
                  animation.pause().totalProgress(1);
                } else if (action === "reset") {
                  animation.restart(true).pause();
                } else if (action === "restart") {
                  animation.restart(true);
                } else {
                  animation[action]();
                }
              }
              onUpdate && onUpdate(self);
            }
            if (toggled || !_limitCallbacks) {
              onToggle && toggled && _callback3(self, onToggle);
              callbacks[toggleState] && _callback3(self, callbacks[toggleState]);
              once && (clipped === 1 ? self.kill(false, 1) : callbacks[toggleState] = 0);
              if (!toggled) {
                toggleState = clipped === 1 ? 1 : 3;
                callbacks[toggleState] && _callback3(self, callbacks[toggleState]);
              }
            }
            if (fastScrollEnd && !isActive && Math.abs(self.getVelocity()) > (_isNumber5(fastScrollEnd) ? fastScrollEnd : 2500)) {
              _endAnimation(self.callbackAnimation);
              scrubTween ? scrubTween.progress(1) : _endAnimation(animation, action === "reverse" ? 1 : !clipped, 1);
            }
          } else if (isToggle && onUpdate && !_refreshing) {
            onUpdate(self);
          }
        }
        if (markerEndSetter) {
          var n2 = containerAnimation ? scroll / containerAnimation.duration() * (containerAnimation._caScrollDist || 0) : scroll;
          markerStartSetter(n2 + (markerStartTrigger._isFlipped ? 1 : 0));
          markerEndSetter(n2);
        }
        caMarkerSetter && caMarkerSetter(-scroll / containerAnimation.duration() * (containerAnimation._caScrollDist || 0));
      };
      self.enable = function(reset, refresh) {
        if (!self.enabled) {
          self.enabled = true;
          _addListener3(scroller, "resize", _onResize);
          isViewport || _addListener3(scroller, "scroll", _onScroll3);
          onRefreshInit && _addListener3(ScrollTrigger3, "refreshInit", onRefreshInit);
          if (reset !== false) {
            self.progress = prevProgress = 0;
            scroll1 = scroll2 = lastSnap = scrollFunc();
          }
          refresh !== false && self.refresh();
        }
      };
      self.getTween = function(snap4) {
        return snap4 && tweenTo ? tweenTo.tween : scrubTween;
      };
      self.setPositions = function(newStart, newEnd, keepClamp, pinOffset) {
        if (containerAnimation) {
          var st = containerAnimation.scrollTrigger, duration = containerAnimation.duration(), _change = st.end - st.start;
          newStart = st.start + _change * newStart / duration;
          newEnd = st.start + _change * newEnd / duration;
        }
        self.refresh(false, false, {
          start: _keepClamp(newStart, keepClamp && !!self._startClamp),
          end: _keepClamp(newEnd, keepClamp && !!self._endClamp)
        }, pinOffset);
        self.update();
      };
      self.adjustPinSpacing = function(amount) {
        if (spacerState && amount) {
          var i2 = spacerState.indexOf(direction.d) + 1;
          spacerState[i2] = parseFloat(spacerState[i2]) + amount + _px;
          spacerState[1] = parseFloat(spacerState[1]) + amount + _px;
          _setState(spacerState);
        }
      };
      self.disable = function(reset, allowAnimation) {
        if (self.enabled) {
          reset !== false && self.revert(true, true);
          self.enabled = self.isActive = false;
          allowAnimation || scrubTween && scrubTween.pause();
          prevScroll = 0;
          pinCache && (pinCache.uncache = 1);
          onRefreshInit && _removeListener3(ScrollTrigger3, "refreshInit", onRefreshInit);
          if (snapDelayedCall) {
            snapDelayedCall.pause();
            tweenTo.tween && tweenTo.tween.kill() && (tweenTo.tween = 0);
          }
          if (!isViewport) {
            var i2 = _triggers.length;
            while (i2--) {
              if (_triggers[i2].scroller === scroller && _triggers[i2] !== self) {
                return;
              }
            }
            _removeListener3(scroller, "resize", _onResize);
            isViewport || _removeListener3(scroller, "scroll", _onScroll3);
          }
        }
      };
      self.kill = function(revert, allowAnimation) {
        self.disable(revert, allowAnimation);
        scrubTween && !allowAnimation && scrubTween.kill();
        id && delete _ids[id];
        var i2 = _triggers.indexOf(self);
        i2 >= 0 && _triggers.splice(i2, 1);
        i2 === _i && _direction > 0 && _i--;
        i2 = 0;
        _triggers.forEach(function(t2) {
          return t2.scroller === self.scroller && (i2 = 1);
        });
        i2 || _refreshingAll || (self.scroll.rec = 0);
        if (animation) {
          animation.scrollTrigger = null;
          revert && animation.revert({
            kill: false
          });
          allowAnimation || animation.kill();
        }
        markerStart && [markerStart, markerEnd, markerStartTrigger, markerEndTrigger].forEach(function(m) {
          return m.parentNode && m.parentNode.removeChild(m);
        });
        _primary === self && (_primary = 0);
        if (pin) {
          pinCache && (pinCache.uncache = 1);
          i2 = 0;
          _triggers.forEach(function(t2) {
            return t2.pin === pin && i2++;
          });
          i2 || (pinCache.spacer = 0);
        }
        vars.onKill && vars.onKill(self);
      };
      _triggers.push(self);
      self.enable(false, false);
      customRevertReturn && customRevertReturn(self);
      if (animation && animation.add && !change) {
        var updateFunc = self.update;
        self.update = function() {
          self.update = updateFunc;
          _scrollers.cache++;
          start || end || self.refresh();
        };
        gsap6.delayedCall(0.01, self.update);
        change = 0.01;
        start = end = 0;
      } else {
        self.refresh();
      }
      pin && _queueRefreshAll();
    };
    ScrollTrigger3.register = function register(core) {
      if (!_coreInitted6) {
        gsap6 = core || _getGSAP7();
        _windowExists5() && window.document && ScrollTrigger3.enable();
        _coreInitted6 = _enabled;
      }
      return _coreInitted6;
    };
    ScrollTrigger3.defaults = function defaults2(config3) {
      if (config3) {
        for (var p2 in config3) {
          _defaults2[p2] = config3[p2];
        }
      }
      return _defaults2;
    };
    ScrollTrigger3.disable = function disable(reset, kill) {
      _enabled = 0;
      _triggers.forEach(function(trigger) {
        return trigger[kill ? "kill" : "disable"](reset);
      });
      _removeListener3(_win4, "wheel", _onScroll3);
      _removeListener3(_doc4, "scroll", _onScroll3);
      clearInterval(_syncInterval);
      _removeListener3(_doc4, "touchcancel", _passThrough3);
      _removeListener3(_body2, "touchstart", _passThrough3);
      _multiListener(_removeListener3, _doc4, "pointerdown,touchstart,mousedown", _pointerDownHandler);
      _multiListener(_removeListener3, _doc4, "pointerup,touchend,mouseup", _pointerUpHandler);
      _resizeDelay.kill();
      _iterateAutoRefresh(_removeListener3);
      for (var i2 = 0; i2 < _scrollers.length; i2 += 3) {
        _wheelListener(_removeListener3, _scrollers[i2], _scrollers[i2 + 1]);
        _wheelListener(_removeListener3, _scrollers[i2], _scrollers[i2 + 2]);
      }
    };
    ScrollTrigger3.enable = function enable() {
      _win4 = window;
      _doc4 = document;
      _docEl2 = _doc4.documentElement;
      _body2 = _doc4.body;
      if (gsap6) {
        _toArray2 = gsap6.utils.toArray;
        _clamp4 = gsap6.utils.clamp;
        _context4 = gsap6.core.context || _passThrough3;
        _suppressOverwrites2 = gsap6.core.suppressOverwrites || _passThrough3;
        _scrollRestoration = _win4.history.scrollRestoration || "auto";
        _lastScroll = _win4.pageYOffset || 0;
        gsap6.core.globals("ScrollTrigger", ScrollTrigger3);
        if (_body2) {
          _enabled = 1;
          _div100vh = document.createElement("div");
          _div100vh.style.height = "100vh";
          _div100vh.style.position = "absolute";
          _refresh100vh();
          _rafBugFix();
          Observer.register(gsap6);
          ScrollTrigger3.isTouch = Observer.isTouch;
          _fixIOSBug = Observer.isTouch && /(iPad|iPhone|iPod|Mac)/g.test(navigator.userAgent);
          _ignoreMobileResize = Observer.isTouch === 1;
          _addListener3(_win4, "wheel", _onScroll3);
          _root2 = [_win4, _doc4, _docEl2, _body2];
          if (gsap6.matchMedia) {
            ScrollTrigger3.matchMedia = function(vars) {
              var mm = gsap6.matchMedia(), p2;
              for (p2 in vars) {
                mm.add(p2, vars[p2]);
              }
              return mm;
            };
            gsap6.addEventListener("matchMediaInit", function() {
              return _revertAll();
            });
            gsap6.addEventListener("matchMediaRevert", function() {
              return _revertRecorded();
            });
            gsap6.addEventListener("matchMedia", function() {
              _refreshAll(0, 1);
              _dispatch3("matchMedia");
            });
            gsap6.matchMedia().add("(orientation: portrait)", function() {
              _setBaseDimensions();
              return _setBaseDimensions;
            });
          } else {
            console.warn("Requires GSAP 3.11.0 or later");
          }
          _setBaseDimensions();
          _addListener3(_doc4, "scroll", _onScroll3);
          var bodyHasStyle = _body2.hasAttribute("style"), bodyStyle = _body2.style, border = bodyStyle.borderTopStyle, AnimationProto = gsap6.core.Animation.prototype, bounds, i2;
          AnimationProto.revert || Object.defineProperty(AnimationProto, "revert", {
            value: function value() {
              return this.time(-0.01, true);
            }
          });
          bodyStyle.borderTopStyle = "solid";
          bounds = _getBounds(_body2);
          _vertical.m = Math.round(bounds.top + _vertical.sc()) || 0;
          _horizontal.m = Math.round(bounds.left + _horizontal.sc()) || 0;
          border ? bodyStyle.borderTopStyle = border : bodyStyle.removeProperty("border-top-style");
          if (!bodyHasStyle) {
            _body2.setAttribute("style", "");
            _body2.removeAttribute("style");
          }
          _syncInterval = setInterval(_sync, 250);
          gsap6.delayedCall(0.5, function() {
            return _startup2 = 0;
          });
          _addListener3(_doc4, "touchcancel", _passThrough3);
          _addListener3(_body2, "touchstart", _passThrough3);
          _multiListener(_addListener3, _doc4, "pointerdown,touchstart,mousedown", _pointerDownHandler);
          _multiListener(_addListener3, _doc4, "pointerup,touchend,mouseup", _pointerUpHandler);
          _transformProp2 = gsap6.utils.checkPrefix("transform");
          _stateProps.push(_transformProp2);
          _coreInitted6 = _getTime2();
          _resizeDelay = gsap6.delayedCall(0.2, _refreshAll).pause();
          _autoRefresh = [_doc4, "visibilitychange", function() {
            var w = _win4.innerWidth, h2 = _win4.innerHeight;
            if (_doc4.hidden) {
              _prevWidth = w;
              _prevHeight = h2;
            } else if (_prevWidth !== w || _prevHeight !== h2) {
              _onResize();
            }
          }, _doc4, "DOMContentLoaded", _refreshAll, _win4, "load", _refreshAll, _win4, "resize", _onResize];
          _iterateAutoRefresh(_addListener3);
          _triggers.forEach(function(trigger) {
            return trigger.enable(0, 1);
          });
          for (i2 = 0; i2 < _scrollers.length; i2 += 3) {
            _wheelListener(_removeListener3, _scrollers[i2], _scrollers[i2 + 1]);
            _wheelListener(_removeListener3, _scrollers[i2], _scrollers[i2 + 2]);
          }
        }
      }
    };
    ScrollTrigger3.config = function config3(vars) {
      "limitCallbacks" in vars && (_limitCallbacks = !!vars.limitCallbacks);
      var ms = vars.syncInterval;
      ms && clearInterval(_syncInterval) || (_syncInterval = ms) && setInterval(_sync, ms);
      "ignoreMobileResize" in vars && (_ignoreMobileResize = ScrollTrigger3.isTouch === 1 && vars.ignoreMobileResize);
      if ("autoRefreshEvents" in vars) {
        _iterateAutoRefresh(_removeListener3) || _iterateAutoRefresh(_addListener3, vars.autoRefreshEvents || "none");
        _ignoreResize = (vars.autoRefreshEvents + "").indexOf("resize") === -1;
      }
    };
    ScrollTrigger3.scrollerProxy = function scrollerProxy(target, vars) {
      var t2 = _getTarget(target), i2 = _scrollers.indexOf(t2), isViewport = _isViewport3(t2);
      if (~i2) {
        _scrollers.splice(i2, isViewport ? 6 : 2);
      }
      if (vars) {
        isViewport ? _proxies.unshift(_win4, vars, _body2, vars, _docEl2, vars) : _proxies.unshift(t2, vars);
      }
    };
    ScrollTrigger3.clearMatchMedia = function clearMatchMedia(query) {
      _triggers.forEach(function(t2) {
        return t2._ctx && t2._ctx.query === query && t2._ctx.kill(true, true);
      });
    };
    ScrollTrigger3.isInViewport = function isInViewport(element, ratio, horizontal) {
      var bounds = (_isString3(element) ? _getTarget(element) : element).getBoundingClientRect(), offset = bounds[horizontal ? _width : _height] * ratio || 0;
      return horizontal ? bounds.right - offset > 0 && bounds.left + offset < _win4.innerWidth : bounds.bottom - offset > 0 && bounds.top + offset < _win4.innerHeight;
    };
    ScrollTrigger3.positionInViewport = function positionInViewport(element, referencePoint, horizontal) {
      _isString3(element) && (element = _getTarget(element));
      var bounds = element.getBoundingClientRect(), size = bounds[horizontal ? _width : _height], offset = referencePoint == null ? size / 2 : referencePoint in _keywords ? _keywords[referencePoint] * size : ~referencePoint.indexOf("%") ? parseFloat(referencePoint) * size / 100 : parseFloat(referencePoint) || 0;
      return horizontal ? (bounds.left + offset) / _win4.innerWidth : (bounds.top + offset) / _win4.innerHeight;
    };
    ScrollTrigger3.killAll = function killAll(allowListeners) {
      _triggers.slice(0).forEach(function(t2) {
        return t2.vars.id !== "ScrollSmoother" && t2.kill();
      });
      if (allowListeners !== true) {
        var listeners = _listeners2.killAll || [];
        _listeners2 = {};
        listeners.forEach(function(f2) {
          return f2();
        });
      }
    };
    return ScrollTrigger3;
  }();
  ScrollTrigger2.version = "3.13.0";
  ScrollTrigger2.saveStyles = function(targets) {
    return targets ? _toArray2(targets).forEach(function(target) {
      if (target && target.style) {
        var i2 = _savedStyles.indexOf(target);
        i2 >= 0 && _savedStyles.splice(i2, 5);
        _savedStyles.push(target, target.style.cssText, target.getBBox && target.getAttribute("transform"), gsap6.core.getCache(target), _context4());
      }
    }) : _savedStyles;
  };
  ScrollTrigger2.revert = function(soft, media) {
    return _revertAll(!soft, media);
  };
  ScrollTrigger2.create = function(vars, animation) {
    return new ScrollTrigger2(vars, animation);
  };
  ScrollTrigger2.refresh = function(safe) {
    return safe ? _onResize(true) : (_coreInitted6 || ScrollTrigger2.register()) && _refreshAll(true);
  };
  ScrollTrigger2.update = function(force) {
    return ++_scrollers.cache && _updateAll(force === true ? 2 : 0);
  };
  ScrollTrigger2.clearScrollMemory = _clearScrollMemory;
  ScrollTrigger2.maxScroll = function(element, horizontal) {
    return _maxScroll(element, horizontal ? _horizontal : _vertical);
  };
  ScrollTrigger2.getScrollFunc = function(element, horizontal) {
    return _getScrollFunc(_getTarget(element), horizontal ? _horizontal : _vertical);
  };
  ScrollTrigger2.getById = function(id) {
    return _ids[id];
  };
  ScrollTrigger2.getAll = function() {
    return _triggers.filter(function(t2) {
      return t2.vars.id !== "ScrollSmoother";
    });
  };
  ScrollTrigger2.isScrolling = function() {
    return !!_lastScrollTime;
  };
  ScrollTrigger2.snapDirectional = _snapDirectional;
  ScrollTrigger2.addEventListener = function(type, callback) {
    var a2 = _listeners2[type] || (_listeners2[type] = []);
    ~a2.indexOf(callback) || a2.push(callback);
  };
  ScrollTrigger2.removeEventListener = function(type, callback) {
    var a2 = _listeners2[type], i2 = a2 && a2.indexOf(callback);
    i2 >= 0 && a2.splice(i2, 1);
  };
  ScrollTrigger2.batch = function(targets, vars) {
    var result = [], varsCopy = {}, interval = vars.interval || 0.016, batchMax = vars.batchMax || 1e9, proxyCallback = function proxyCallback2(type, callback) {
      var elements = [], triggers = [], delay = gsap6.delayedCall(interval, function() {
        callback(elements, triggers);
        elements = [];
        triggers = [];
      }).pause();
      return function(self) {
        elements.length || delay.restart(true);
        elements.push(self.trigger);
        triggers.push(self);
        batchMax <= elements.length && delay.progress(1);
      };
    }, p2;
    for (p2 in vars) {
      varsCopy[p2] = p2.substr(0, 2) === "on" && _isFunction3(vars[p2]) && p2 !== "onRefreshInit" ? proxyCallback(p2, vars[p2]) : vars[p2];
    }
    if (_isFunction3(batchMax)) {
      batchMax = batchMax();
      _addListener3(ScrollTrigger2, "refresh", function() {
        return batchMax = vars.batchMax();
      });
    }
    _toArray2(targets).forEach(function(target) {
      var config3 = {};
      for (p2 in varsCopy) {
        config3[p2] = varsCopy[p2];
      }
      config3.trigger = target;
      result.push(ScrollTrigger2.create(config3));
    });
    return result;
  };
  var _clampScrollAndGetDurationMultiplier = function _clampScrollAndGetDurationMultiplier2(scrollFunc, current, end, max) {
    current > max ? scrollFunc(max) : current < 0 && scrollFunc(0);
    return end > max ? (max - current) / (end - current) : end < 0 ? current / (current - end) : 1;
  };
  var _allowNativePanning = function _allowNativePanning2(target, direction) {
    if (direction === true) {
      target.style.removeProperty("touch-action");
    } else {
      target.style.touchAction = direction === true ? "auto" : direction ? "pan-" + direction + (Observer.isTouch ? " pinch-zoom" : "") : "none";
    }
    target === _docEl2 && _allowNativePanning2(_body2, direction);
  };
  var _overflow = {
    auto: 1,
    scroll: 1
  };
  var _nestedScroll = function _nestedScroll2(_ref5) {
    var event = _ref5.event, target = _ref5.target, axis = _ref5.axis;
    var node = (event.changedTouches ? event.changedTouches[0] : event).target, cache = node._gsap || gsap6.core.getCache(node), time = _getTime2(), cs;
    if (!cache._isScrollT || time - cache._isScrollT > 2e3) {
      while (node && node !== _body2 && (node.scrollHeight <= node.clientHeight && node.scrollWidth <= node.clientWidth || !(_overflow[(cs = _getComputedStyle(node)).overflowY] || _overflow[cs.overflowX]))) {
        node = node.parentNode;
      }
      cache._isScroll = node && node !== target && !_isViewport3(node) && (_overflow[(cs = _getComputedStyle(node)).overflowY] || _overflow[cs.overflowX]);
      cache._isScrollT = time;
    }
    if (cache._isScroll || axis === "x") {
      event.stopPropagation();
      event._gsapAllow = true;
    }
  };
  var _inputObserver = function _inputObserver2(target, type, inputs, nested) {
    return Observer.create({
      target,
      capture: true,
      debounce: false,
      lockAxis: true,
      type,
      onWheel: nested = nested && _nestedScroll,
      onPress: nested,
      onDrag: nested,
      onScroll: nested,
      onEnable: function onEnable() {
        return inputs && _addListener3(_doc4, Observer.eventTypes[0], _captureInputs, false, true);
      },
      onDisable: function onDisable() {
        return _removeListener3(_doc4, Observer.eventTypes[0], _captureInputs, true);
      }
    });
  };
  var _inputExp = /(input|label|select|textarea)/i;
  var _inputIsFocused;
  var _captureInputs = function _captureInputs2(e2) {
    var isInput = _inputExp.test(e2.target.tagName);
    if (isInput || _inputIsFocused) {
      e2._gsapAllow = true;
      _inputIsFocused = isInput;
    }
  };
  var _getScrollNormalizer = function _getScrollNormalizer2(vars) {
    _isObject3(vars) || (vars = {});
    vars.preventDefault = vars.isNormalizer = vars.allowClicks = true;
    vars.type || (vars.type = "wheel,touch");
    vars.debounce = !!vars.debounce;
    vars.id = vars.id || "normalizer";
    var _vars2 = vars, normalizeScrollX = _vars2.normalizeScrollX, momentum = _vars2.momentum, allowNestedScroll = _vars2.allowNestedScroll, onRelease = _vars2.onRelease, self, maxY, target = _getTarget(vars.target) || _docEl2, smoother = gsap6.core.globals().ScrollSmoother, smootherInstance = smoother && smoother.get(), content = _fixIOSBug && (vars.content && _getTarget(vars.content) || smootherInstance && vars.content !== false && !smootherInstance.smooth() && smootherInstance.content()), scrollFuncY = _getScrollFunc(target, _vertical), scrollFuncX = _getScrollFunc(target, _horizontal), scale = 1, initialScale = (Observer.isTouch && _win4.visualViewport ? _win4.visualViewport.scale * _win4.visualViewport.width : _win4.outerWidth) / _win4.innerWidth, wheelRefresh = 0, resolveMomentumDuration = _isFunction3(momentum) ? function() {
      return momentum(self);
    } : function() {
      return momentum || 2.8;
    }, lastRefreshID, skipTouchMove, inputObserver = _inputObserver(target, vars.type, true, allowNestedScroll), resumeTouchMove = function resumeTouchMove2() {
      return skipTouchMove = false;
    }, scrollClampX = _passThrough3, scrollClampY = _passThrough3, updateClamps = function updateClamps2() {
      maxY = _maxScroll(target, _vertical);
      scrollClampY = _clamp4(_fixIOSBug ? 1 : 0, maxY);
      normalizeScrollX && (scrollClampX = _clamp4(0, _maxScroll(target, _horizontal)));
      lastRefreshID = _refreshID;
    }, removeContentOffset = function removeContentOffset2() {
      content._gsap.y = _round7(parseFloat(content._gsap.y) + scrollFuncY.offset) + "px";
      content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + parseFloat(content._gsap.y) + ", 0, 1)";
      scrollFuncY.offset = scrollFuncY.cacheID = 0;
    }, ignoreDrag = function ignoreDrag2() {
      if (skipTouchMove) {
        requestAnimationFrame(resumeTouchMove);
        var offset = _round7(self.deltaY / 2), scroll = scrollClampY(scrollFuncY.v - offset);
        if (content && scroll !== scrollFuncY.v + scrollFuncY.offset) {
          scrollFuncY.offset = scroll - scrollFuncY.v;
          var y = _round7((parseFloat(content && content._gsap.y) || 0) - scrollFuncY.offset);
          content.style.transform = "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, " + y + ", 0, 1)";
          content._gsap.y = y + "px";
          scrollFuncY.cacheID = _scrollers.cache;
          _updateAll();
        }
        return true;
      }
      scrollFuncY.offset && removeContentOffset();
      skipTouchMove = true;
    }, tween, startScrollX, startScrollY, onStopDelayedCall, onResize = function onResize2() {
      updateClamps();
      if (tween.isActive() && tween.vars.scrollY > maxY) {
        scrollFuncY() > maxY ? tween.progress(1) && scrollFuncY(maxY) : tween.resetTo("scrollY", maxY);
      }
    };
    content && gsap6.set(content, {
      y: "+=0"
    });
    vars.ignoreCheck = function(e2) {
      return _fixIOSBug && e2.type === "touchmove" && ignoreDrag(e2) || scale > 1.05 && e2.type !== "touchstart" || self.isGesturing || e2.touches && e2.touches.length > 1;
    };
    vars.onPress = function() {
      skipTouchMove = false;
      var prevScale = scale;
      scale = _round7((_win4.visualViewport && _win4.visualViewport.scale || 1) / initialScale);
      tween.pause();
      prevScale !== scale && _allowNativePanning(target, scale > 1.01 ? true : normalizeScrollX ? false : "x");
      startScrollX = scrollFuncX();
      startScrollY = scrollFuncY();
      updateClamps();
      lastRefreshID = _refreshID;
    };
    vars.onRelease = vars.onGestureStart = function(self2, wasDragging) {
      scrollFuncY.offset && removeContentOffset();
      if (!wasDragging) {
        onStopDelayedCall.restart(true);
      } else {
        _scrollers.cache++;
        var dur = resolveMomentumDuration(), currentScroll, endScroll;
        if (normalizeScrollX) {
          currentScroll = scrollFuncX();
          endScroll = currentScroll + dur * 0.05 * -self2.velocityX / 0.227;
          dur *= _clampScrollAndGetDurationMultiplier(scrollFuncX, currentScroll, endScroll, _maxScroll(target, _horizontal));
          tween.vars.scrollX = scrollClampX(endScroll);
        }
        currentScroll = scrollFuncY();
        endScroll = currentScroll + dur * 0.05 * -self2.velocityY / 0.227;
        dur *= _clampScrollAndGetDurationMultiplier(scrollFuncY, currentScroll, endScroll, _maxScroll(target, _vertical));
        tween.vars.scrollY = scrollClampY(endScroll);
        tween.invalidate().duration(dur).play(0.01);
        if (_fixIOSBug && tween.vars.scrollY >= maxY || currentScroll >= maxY - 1) {
          gsap6.to({}, {
            onUpdate: onResize,
            duration: dur
          });
        }
      }
      onRelease && onRelease(self2);
    };
    vars.onWheel = function() {
      tween._ts && tween.pause();
      if (_getTime2() - wheelRefresh > 1e3) {
        lastRefreshID = 0;
        wheelRefresh = _getTime2();
      }
    };
    vars.onChange = function(self2, dx, dy, xArray, yArray) {
      _refreshID !== lastRefreshID && updateClamps();
      dx && normalizeScrollX && scrollFuncX(scrollClampX(xArray[2] === dx ? startScrollX + (self2.startX - self2.x) : scrollFuncX() + dx - xArray[1]));
      if (dy) {
        scrollFuncY.offset && removeContentOffset();
        var isTouch = yArray[2] === dy, y = isTouch ? startScrollY + self2.startY - self2.y : scrollFuncY() + dy - yArray[1], yClamped = scrollClampY(y);
        isTouch && y !== yClamped && (startScrollY += yClamped - y);
        scrollFuncY(yClamped);
      }
      (dy || dx) && _updateAll();
    };
    vars.onEnable = function() {
      _allowNativePanning(target, normalizeScrollX ? false : "x");
      ScrollTrigger2.addEventListener("refresh", onResize);
      _addListener3(_win4, "resize", onResize);
      if (scrollFuncY.smooth) {
        scrollFuncY.target.style.scrollBehavior = "auto";
        scrollFuncY.smooth = scrollFuncX.smooth = false;
      }
      inputObserver.enable();
    };
    vars.onDisable = function() {
      _allowNativePanning(target, true);
      _removeListener3(_win4, "resize", onResize);
      ScrollTrigger2.removeEventListener("refresh", onResize);
      inputObserver.kill();
    };
    vars.lockAxis = vars.lockAxis !== false;
    self = new Observer(vars);
    self.iOS = _fixIOSBug;
    _fixIOSBug && !scrollFuncY() && scrollFuncY(1);
    _fixIOSBug && gsap6.ticker.add(_passThrough3);
    onStopDelayedCall = self._dc;
    tween = gsap6.to(self, {
      ease: "power4",
      paused: true,
      inherit: false,
      scrollX: normalizeScrollX ? "+=0.1" : "+=0",
      scrollY: "+=0.1",
      modifiers: {
        scrollY: _interruptionTracker(scrollFuncY, scrollFuncY(), function() {
          return tween.pause();
        })
      },
      onUpdate: _updateAll,
      onComplete: onStopDelayedCall.vars.onComplete
    });
    return self;
  };
  ScrollTrigger2.sort = function(func) {
    if (_isFunction3(func)) {
      return _triggers.sort(func);
    }
    var scroll = _win4.pageYOffset || 0;
    ScrollTrigger2.getAll().forEach(function(t2) {
      return t2._sortY = t2.trigger ? scroll + t2.trigger.getBoundingClientRect().top : t2.start + _win4.innerHeight;
    });
    return _triggers.sort(func || function(a2, b) {
      return (a2.vars.refreshPriority || 0) * -1e6 + (a2.vars.containerAnimation ? 1e6 : a2._sortY) - ((b.vars.containerAnimation ? 1e6 : b._sortY) + (b.vars.refreshPriority || 0) * -1e6);
    });
  };
  ScrollTrigger2.observe = function(vars) {
    return new Observer(vars);
  };
  ScrollTrigger2.normalizeScroll = function(vars) {
    if (typeof vars === "undefined") {
      return _normalizer2;
    }
    if (vars === true && _normalizer2) {
      return _normalizer2.enable();
    }
    if (vars === false) {
      _normalizer2 && _normalizer2.kill();
      _normalizer2 = vars;
      return;
    }
    var normalizer = vars instanceof Observer ? vars : _getScrollNormalizer(vars);
    _normalizer2 && _normalizer2.target === normalizer.target && _normalizer2.kill();
    _isViewport3(normalizer.target) && (_normalizer2 = normalizer);
    return normalizer;
  };
  ScrollTrigger2.core = {
    // smaller file size way to leverage in ScrollSmoother and Observer
    _getVelocityProp,
    _inputObserver,
    _scrollers,
    _proxies,
    bridge: {
      // when normalizeScroll sets the scroll position (ss = setScroll)
      ss: function ss() {
        _lastScrollTime || _dispatch3("scrollStart");
        _lastScrollTime = _getTime2();
      },
      // a way to get the _refreshing value in Observer
      ref: function ref() {
        return _refreshing;
      }
    }
  };
  _getGSAP7() && gsap6.registerPlugin(ScrollTrigger2);

  // js/Balls.js
  var Balls = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.animate();
    }
    elements() {
      this.balls = this.element.querySelectorAll("[data-target='ball']");
    }
    animate() {
      gsapWithCSS.set(this.balls, {
        xPercent: -100,
        autoAlpha: 0,
        rotate: -180
      });
      gsapWithCSS.to(this.balls, {
        xPercent: 0,
        rotate: 0,
        autoAlpha: 1,
        duration: 2,
        ease: "elastic.out(1, 0.7)",
        stagger: {
          each: 0.3
        },
        scrollTrigger: {
          trigger: this.element,
          start: "top bottom",
          end: "bottom top",
          toggleActions: "play none none reset"
        }
      });
    }
  };

  // node_modules/rough-notation/lib/rough-notation.esm.js
  var t = "http://www.w3.org/2000/svg";
  var e = class {
    constructor(t2) {
      this.seed = t2;
    }
    next() {
      return this.seed ? (2 ** 31 - 1 & (this.seed = Math.imul(48271, this.seed))) / 2 ** 31 : Math.random();
    }
  };
  function s(t2, e2, s2, i2, n2) {
    return { type: "path", ops: c(t2, e2, s2, i2, n2) };
  }
  function i(t2, e2, i2) {
    const n2 = (t2 || []).length;
    if (n2 > 2) {
      const s2 = [];
      for (let e3 = 0; e3 < n2 - 1; e3++) s2.push(...c(t2[e3][0], t2[e3][1], t2[e3 + 1][0], t2[e3 + 1][1], i2));
      return e2 && s2.push(...c(t2[n2 - 1][0], t2[n2 - 1][1], t2[0][0], t2[0][1], i2)), { type: "path", ops: s2 };
    }
    return 2 === n2 ? s(t2[0][0], t2[0][1], t2[1][0], t2[1][1], i2) : { type: "path", ops: [] };
  }
  function n(t2, e2, s2, n2, o2) {
    return function(t3, e3) {
      return i(t3, true, e3);
    }([[t2, e2], [t2 + s2, e2], [t2 + s2, e2 + n2], [t2, e2 + n2]], o2);
  }
  function o(t2, e2, s2, i2, n2) {
    return function(t3, e3, s3, i3) {
      const [n3, o2] = l(i3.increment, t3, e3, i3.rx, i3.ry, 1, i3.increment * h(0.1, h(0.4, 1, s3), s3), s3);
      let r2 = f(n3, null, s3);
      if (!s3.disableMultiStroke) {
        const [n4] = l(i3.increment, t3, e3, i3.rx, i3.ry, 1.5, 0, s3), o3 = f(n4, null, s3);
        r2 = r2.concat(o3);
      }
      return { estimatedPoints: o2, opset: { type: "path", ops: r2 } };
    }(t2, e2, n2, function(t3, e3, s3) {
      const i3 = Math.sqrt(2 * Math.PI * Math.sqrt((Math.pow(t3 / 2, 2) + Math.pow(e3 / 2, 2)) / 2)), n3 = Math.max(s3.curveStepCount, s3.curveStepCount / Math.sqrt(200) * i3), o2 = 2 * Math.PI / n3;
      let r2 = Math.abs(t3 / 2), h2 = Math.abs(e3 / 2);
      const c2 = 1 - s3.curveFitting;
      return r2 += a(r2 * c2, s3), h2 += a(h2 * c2, s3), { increment: o2, rx: r2, ry: h2 };
    }(s2, i2, n2)).opset;
  }
  function r(t2) {
    return t2.randomizer || (t2.randomizer = new e(t2.seed || 0)), t2.randomizer.next();
  }
  function h(t2, e2, s2, i2 = 1) {
    return s2.roughness * i2 * (r(s2) * (e2 - t2) + t2);
  }
  function a(t2, e2, s2 = 1) {
    return h(-t2, t2, e2, s2);
  }
  function c(t2, e2, s2, i2, n2, o2 = false) {
    const r2 = o2 ? n2.disableMultiStrokeFill : n2.disableMultiStroke, h2 = u(t2, e2, s2, i2, n2, true, false);
    if (r2) return h2;
    const a2 = u(t2, e2, s2, i2, n2, true, true);
    return h2.concat(a2);
  }
  function u(t2, e2, s2, i2, n2, o2, h2) {
    const c2 = Math.pow(t2 - s2, 2) + Math.pow(e2 - i2, 2), u2 = Math.sqrt(c2);
    let f2 = 1;
    f2 = u2 < 200 ? 1 : u2 > 500 ? 0.4 : -16668e-7 * u2 + 1.233334;
    let l2 = n2.maxRandomnessOffset || 0;
    l2 * l2 * 100 > c2 && (l2 = u2 / 10);
    const g3 = l2 / 2, d2 = 0.2 + 0.2 * r(n2);
    let p2 = n2.bowing * n2.maxRandomnessOffset * (i2 - e2) / 200, _2 = n2.bowing * n2.maxRandomnessOffset * (t2 - s2) / 200;
    p2 = a(p2, n2, f2), _2 = a(_2, n2, f2);
    const m = [], w = () => a(g3, n2, f2), v = () => a(l2, n2, f2);
    return o2 && (h2 ? m.push({ op: "move", data: [t2 + w(), e2 + w()] }) : m.push({ op: "move", data: [t2 + a(l2, n2, f2), e2 + a(l2, n2, f2)] })), h2 ? m.push({ op: "bcurveTo", data: [p2 + t2 + (s2 - t2) * d2 + w(), _2 + e2 + (i2 - e2) * d2 + w(), p2 + t2 + 2 * (s2 - t2) * d2 + w(), _2 + e2 + 2 * (i2 - e2) * d2 + w(), s2 + w(), i2 + w()] }) : m.push({ op: "bcurveTo", data: [p2 + t2 + (s2 - t2) * d2 + v(), _2 + e2 + (i2 - e2) * d2 + v(), p2 + t2 + 2 * (s2 - t2) * d2 + v(), _2 + e2 + 2 * (i2 - e2) * d2 + v(), s2 + v(), i2 + v()] }), m;
  }
  function f(t2, e2, s2) {
    const i2 = t2.length, n2 = [];
    if (i2 > 3) {
      const o2 = [], r2 = 1 - s2.curveTightness;
      n2.push({ op: "move", data: [t2[1][0], t2[1][1]] });
      for (let e3 = 1; e3 + 2 < i2; e3++) {
        const s3 = t2[e3];
        o2[0] = [s3[0], s3[1]], o2[1] = [s3[0] + (r2 * t2[e3 + 1][0] - r2 * t2[e3 - 1][0]) / 6, s3[1] + (r2 * t2[e3 + 1][1] - r2 * t2[e3 - 1][1]) / 6], o2[2] = [t2[e3 + 1][0] + (r2 * t2[e3][0] - r2 * t2[e3 + 2][0]) / 6, t2[e3 + 1][1] + (r2 * t2[e3][1] - r2 * t2[e3 + 2][1]) / 6], o2[3] = [t2[e3 + 1][0], t2[e3 + 1][1]], n2.push({ op: "bcurveTo", data: [o2[1][0], o2[1][1], o2[2][0], o2[2][1], o2[3][0], o2[3][1]] });
      }
      if (e2 && 2 === e2.length) {
        const t3 = s2.maxRandomnessOffset;
        n2.push({ op: "lineTo", data: [e2[0] + a(t3, s2), e2[1] + a(t3, s2)] });
      }
    } else 3 === i2 ? (n2.push({ op: "move", data: [t2[1][0], t2[1][1]] }), n2.push({ op: "bcurveTo", data: [t2[1][0], t2[1][1], t2[2][0], t2[2][1], t2[2][0], t2[2][1]] })) : 2 === i2 && n2.push(...c(t2[0][0], t2[0][1], t2[1][0], t2[1][1], s2));
    return n2;
  }
  function l(t2, e2, s2, i2, n2, o2, r2, h2) {
    const c2 = [], u2 = [], f2 = a(0.5, h2) - Math.PI / 2;
    u2.push([a(o2, h2) + e2 + 0.9 * i2 * Math.cos(f2 - t2), a(o2, h2) + s2 + 0.9 * n2 * Math.sin(f2 - t2)]);
    for (let r3 = f2; r3 < 2 * Math.PI + f2 - 0.01; r3 += t2) {
      const t3 = [a(o2, h2) + e2 + i2 * Math.cos(r3), a(o2, h2) + s2 + n2 * Math.sin(r3)];
      c2.push(t3), u2.push(t3);
    }
    return u2.push([a(o2, h2) + e2 + i2 * Math.cos(f2 + 2 * Math.PI + 0.5 * r2), a(o2, h2) + s2 + n2 * Math.sin(f2 + 2 * Math.PI + 0.5 * r2)]), u2.push([a(o2, h2) + e2 + 0.98 * i2 * Math.cos(f2 + r2), a(o2, h2) + s2 + 0.98 * n2 * Math.sin(f2 + r2)]), u2.push([a(o2, h2) + e2 + 0.9 * i2 * Math.cos(f2 + 0.5 * r2), a(o2, h2) + s2 + 0.9 * n2 * Math.sin(f2 + 0.5 * r2)]), [u2, c2];
  }
  function g2(t2, e2) {
    return { maxRandomnessOffset: 2, roughness: "highlight" === t2 ? 3 : 1.5, bowing: 1, stroke: "#000", strokeWidth: 1.5, curveTightness: 0, curveFitting: 0.95, curveStepCount: 9, fillStyle: "hachure", fillWeight: -1, hachureAngle: -41, hachureGap: -1, dashOffset: -1, dashGap: -1, zigzagOffset: -1, combineNestedSvgPaths: false, disableMultiStroke: "double" !== t2, disableMultiStrokeFill: false, seed: e2 };
  }
  function d(e2, r2, h2, a2, c2, u2) {
    const f2 = [];
    let l2 = h2.strokeWidth || 2;
    const d2 = function(t2) {
      const e3 = t2.padding;
      if (e3 || 0 === e3) {
        if ("number" == typeof e3) return [e3, e3, e3, e3];
        if (Array.isArray(e3)) {
          const t3 = e3;
          if (t3.length) switch (t3.length) {
            case 4:
              return [...t3];
            case 1:
              return [t3[0], t3[0], t3[0], t3[0]];
            case 2:
              return [...t3, ...t3];
            case 3:
              return [...t3, t3[1]];
            default:
              return [t3[0], t3[1], t3[2], t3[3]];
          }
        }
      }
      return [5, 5, 5, 5];
    }(h2), p2 = void 0 === h2.animate || !!h2.animate, _2 = h2.iterations || 2, m = h2.rtl ? 1 : 0, w = g2("single", u2);
    switch (h2.type) {
      case "underline": {
        const t2 = r2.y + r2.h + d2[2];
        for (let e3 = m; e3 < _2 + m; e3++) e3 % 2 ? f2.push(s(r2.x + r2.w, t2, r2.x, t2, w)) : f2.push(s(r2.x, t2, r2.x + r2.w, t2, w));
        break;
      }
      case "strike-through": {
        const t2 = r2.y + r2.h / 2;
        for (let e3 = m; e3 < _2 + m; e3++) e3 % 2 ? f2.push(s(r2.x + r2.w, t2, r2.x, t2, w)) : f2.push(s(r2.x, t2, r2.x + r2.w, t2, w));
        break;
      }
      case "box": {
        const t2 = r2.x - d2[3], e3 = r2.y - d2[0], s2 = r2.w + (d2[1] + d2[3]), i2 = r2.h + (d2[0] + d2[2]);
        for (let o2 = 0; o2 < _2; o2++) f2.push(n(t2, e3, s2, i2, w));
        break;
      }
      case "bracket": {
        const t2 = Array.isArray(h2.brackets) ? h2.brackets : h2.brackets ? [h2.brackets] : ["right"], e3 = r2.x - 2 * d2[3], s2 = r2.x + r2.w + 2 * d2[1], n2 = r2.y - 2 * d2[0], o2 = r2.y + r2.h + 2 * d2[2];
        for (const h3 of t2) {
          let t3;
          switch (h3) {
            case "bottom":
              t3 = [[e3, r2.y + r2.h], [e3, o2], [s2, o2], [s2, r2.y + r2.h]];
              break;
            case "top":
              t3 = [[e3, r2.y], [e3, n2], [s2, n2], [s2, r2.y]];
              break;
            case "left":
              t3 = [[r2.x, n2], [e3, n2], [e3, o2], [r2.x, o2]];
              break;
            case "right":
              t3 = [[r2.x + r2.w, n2], [s2, n2], [s2, o2], [r2.x + r2.w, o2]];
          }
          t3 && f2.push(i(t3, false, w));
        }
        break;
      }
      case "crossed-off": {
        const t2 = r2.x, e3 = r2.y, i2 = t2 + r2.w, n2 = e3 + r2.h;
        for (let o2 = m; o2 < _2 + m; o2++) o2 % 2 ? f2.push(s(i2, n2, t2, e3, w)) : f2.push(s(t2, e3, i2, n2, w));
        for (let o2 = m; o2 < _2 + m; o2++) o2 % 2 ? f2.push(s(t2, n2, i2, e3, w)) : f2.push(s(i2, e3, t2, n2, w));
        break;
      }
      case "circle": {
        const t2 = g2("double", u2), e3 = r2.w + (d2[1] + d2[3]), s2 = r2.h + (d2[0] + d2[2]), i2 = r2.x - d2[3] + e3 / 2, n2 = r2.y - d2[0] + s2 / 2, h3 = Math.floor(_2 / 2), a3 = _2 - 2 * h3;
        for (let r3 = 0; r3 < h3; r3++) f2.push(o(i2, n2, e3, s2, t2));
        for (let t3 = 0; t3 < a3; t3++) f2.push(o(i2, n2, e3, s2, w));
        break;
      }
      case "highlight": {
        const t2 = g2("highlight", u2);
        l2 = 0.95 * r2.h;
        const e3 = r2.y + r2.h / 2;
        for (let i2 = m; i2 < _2 + m; i2++) i2 % 2 ? f2.push(s(r2.x + r2.w, e3, r2.x, e3, t2)) : f2.push(s(r2.x, e3, r2.x + r2.w, e3, t2));
        break;
      }
    }
    if (f2.length) {
      const s2 = function(t2) {
        const e3 = [];
        for (const s3 of t2) {
          let t3 = "";
          for (const i3 of s3.ops) {
            const s4 = i3.data;
            switch (i3.op) {
              case "move":
                t3.trim() && e3.push(t3.trim()), t3 = `M${s4[0]} ${s4[1]} `;
                break;
              case "bcurveTo":
                t3 += `C${s4[0]} ${s4[1]}, ${s4[2]} ${s4[3]}, ${s4[4]} ${s4[5]} `;
                break;
              case "lineTo":
                t3 += `L${s4[0]} ${s4[1]} `;
            }
          }
          t3.trim() && e3.push(t3.trim());
        }
        return e3;
      }(f2), i2 = [], n2 = [];
      let o2 = 0;
      const r3 = (t2, e3, s3) => t2.setAttribute(e3, s3);
      for (const a3 of s2) {
        const s3 = document.createElementNS(t, "path");
        if (r3(s3, "d", a3), r3(s3, "fill", "none"), r3(s3, "stroke", h2.color || "currentColor"), r3(s3, "stroke-width", "" + l2), p2) {
          const t2 = s3.getTotalLength();
          i2.push(t2), o2 += t2;
        }
        e2.appendChild(s3), n2.push(s3);
      }
      if (p2) {
        let t2 = 0;
        for (let e3 = 0; e3 < n2.length; e3++) {
          const s3 = n2[e3], r4 = i2[e3], h3 = o2 ? c2 * (r4 / o2) : 0, u3 = a2 + t2, f3 = s3.style;
          f3.strokeDashoffset = "" + r4, f3.strokeDasharray = "" + r4, f3.animation = `rough-notation-dash ${h3}ms ease-out ${u3}ms forwards`, t2 += h3;
        }
      }
    }
  }
  var p = class {
    constructor(t2, e2) {
      this._state = "unattached", this._resizing = false, this._seed = Math.floor(Math.random() * 2 ** 31), this._lastSizes = [], this._animationDelay = 0, this._resizeListener = () => {
        this._resizing || (this._resizing = true, setTimeout(() => {
          this._resizing = false, "showing" === this._state && this.haveRectsChanged() && this.show();
        }, 400));
      }, this._e = t2, this._config = JSON.parse(JSON.stringify(e2)), this.attach();
    }
    get animate() {
      return this._config.animate;
    }
    set animate(t2) {
      this._config.animate = t2;
    }
    get animationDuration() {
      return this._config.animationDuration;
    }
    set animationDuration(t2) {
      this._config.animationDuration = t2;
    }
    get iterations() {
      return this._config.iterations;
    }
    set iterations(t2) {
      this._config.iterations = t2;
    }
    get color() {
      return this._config.color;
    }
    set color(t2) {
      this._config.color !== t2 && (this._config.color = t2, this.refresh());
    }
    get strokeWidth() {
      return this._config.strokeWidth;
    }
    set strokeWidth(t2) {
      this._config.strokeWidth !== t2 && (this._config.strokeWidth = t2, this.refresh());
    }
    get padding() {
      return this._config.padding;
    }
    set padding(t2) {
      this._config.padding !== t2 && (this._config.padding = t2, this.refresh());
    }
    attach() {
      if ("unattached" === this._state && this._e.parentElement) {
        !function() {
          if (!window.__rno_kf_s) {
            const t2 = window.__rno_kf_s = document.createElement("style");
            t2.textContent = "@keyframes rough-notation-dash { to { stroke-dashoffset: 0; } }", document.head.appendChild(t2);
          }
        }();
        const e2 = this._svg = document.createElementNS(t, "svg");
        e2.setAttribute("class", "rough-annotation");
        const s2 = e2.style;
        s2.position = "absolute", s2.top = "0", s2.left = "0", s2.overflow = "visible", s2.pointerEvents = "none", s2.width = "100px", s2.height = "100px";
        const i2 = "highlight" === this._config.type;
        if (this._e.insertAdjacentElement(i2 ? "beforebegin" : "afterend", e2), this._state = "not-showing", i2) {
          const t2 = window.getComputedStyle(this._e).position;
          (!t2 || "static" === t2) && (this._e.style.position = "relative");
        }
        this.attachListeners();
      }
    }
    detachListeners() {
      window.removeEventListener("resize", this._resizeListener), this._ro && this._ro.unobserve(this._e);
    }
    attachListeners() {
      this.detachListeners(), window.addEventListener("resize", this._resizeListener, { passive: true }), !this._ro && "ResizeObserver" in window && (this._ro = new window.ResizeObserver((t2) => {
        for (const e2 of t2) e2.contentRect && this._resizeListener();
      })), this._ro && this._ro.observe(this._e);
    }
    haveRectsChanged() {
      if (this._lastSizes.length) {
        const t2 = this.rects();
        if (t2.length !== this._lastSizes.length) return true;
        for (let e2 = 0; e2 < t2.length; e2++) if (!this.isSameRect(t2[e2], this._lastSizes[e2])) return true;
      }
      return false;
    }
    isSameRect(t2, e2) {
      const s2 = (t3, e3) => Math.round(t3) === Math.round(e3);
      return s2(t2.x, e2.x) && s2(t2.y, e2.y) && s2(t2.w, e2.w) && s2(t2.h, e2.h);
    }
    isShowing() {
      return "not-showing" !== this._state;
    }
    refresh() {
      this.isShowing() && !this.pendingRefresh && (this.pendingRefresh = Promise.resolve().then(() => {
        this.isShowing() && this.show(), delete this.pendingRefresh;
      }));
    }
    show() {
      switch (this._state) {
        case "unattached":
          break;
        case "showing":
          this.hide(), this._svg && this.render(this._svg, true);
          break;
        case "not-showing":
          this.attach(), this._svg && this.render(this._svg, false);
      }
    }
    hide() {
      if (this._svg) for (; this._svg.lastChild; ) this._svg.removeChild(this._svg.lastChild);
      this._state = "not-showing";
    }
    remove() {
      this._svg && this._svg.parentElement && this._svg.parentElement.removeChild(this._svg), this._svg = void 0, this._state = "unattached", this.detachListeners();
    }
    render(t2, e2) {
      let s2 = this._config;
      e2 && (s2 = JSON.parse(JSON.stringify(this._config)), s2.animate = false);
      const i2 = this.rects();
      let n2 = 0;
      i2.forEach((t3) => n2 += t3.w);
      const o2 = s2.animationDuration || 800;
      let r2 = 0;
      for (let e3 = 0; e3 < i2.length; e3++) {
        const h2 = o2 * (i2[e3].w / n2);
        d(t2, i2[e3], s2, r2 + this._animationDelay, h2, this._seed), r2 += h2;
      }
      this._lastSizes = i2, this._state = "showing";
    }
    rects() {
      const t2 = [];
      if (this._svg) if (this._config.multiline) {
        const e2 = this._e.getClientRects();
        for (let s2 = 0; s2 < e2.length; s2++) t2.push(this.svgRect(this._svg, e2[s2]));
      } else t2.push(this.svgRect(this._svg, this._e.getBoundingClientRect()));
      return t2;
    }
    svgRect(t2, e2) {
      const s2 = t2.getBoundingClientRect(), i2 = e2;
      return { x: (i2.x || i2.left) - (s2.x || s2.left), y: (i2.y || i2.top) - (s2.y || s2.top), w: i2.width, h: i2.height };
    }
  };
  function _(t2, e2) {
    return new p(t2, e2);
  }

  // js/Annotations.js
  var Annotations = class {
    constructor(element) {
      this.element = element;
      this.elements();
      this.init();
    }
    elements() {
    }
    init() {
      const annotationType = this.element.dataset.annotation;
      const annotationColor = this.element.dataset.annotation_color ? this.element.dataset.annotation_color : "#2C2B32";
      const annotationThickness = this.element.dataset.annotation_thickness ? parseFloat(this.element.dataset.annotation_thickness) : 1;
      const annotationPadding = this.element.dataset.annotation_padding ? parseFloat(this.element.dataset.annotation_padding) : 5;
      const bracketsDirections = this.element.dataset.brackets_directions ? this.element.dataset.brackets_directions.split(",").map((item) => item.trim()) : ["top"];
      this.repeat = this.element.dataset.annotation_repeat === "" ? true : false;
      let annotationConfig = {
        color: annotationColor,
        strokeWidth: annotationThickness,
        iterations: 5,
        padding: annotationPadding
      };
      switch (annotationType) {
        case "underline":
          this.annotation = _(this.element, { ...annotationConfig, type: "underline" });
          break;
        case "circle":
          this.annotation = _(this.element, { ...annotationConfig, type: "circle" });
          break;
        case "box":
          this.annotation = _(this.element, { ...annotationConfig, type: "box" });
          break;
        case "highlight":
          this.annotation = _(this.element, { ...annotationConfig, type: "highlight" });
          break;
        case "bracket":
          this.annotation = _(this.element, { ...annotationConfig, type: "bracket", brackets: bracketsDirections });
          break;
        case "strikethrough":
          this.annotation = _(this.element, { ...annotationConfig, type: "strike-through" });
          break;
        case "crossed-off":
          this.annotation = _(this.element, { ...annotationConfig, type: "crossed-off" });
          break;
      }
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target._annotationInstance.annotation.show();
            if (!entry.target._annotationInstance.repeat) {
              this.observer.unobserve(entry.target);
            }
          } else {
            if (entry.target._annotationInstance.repeat) {
              entry.target._annotationInstance.annotation.hide();
            }
          }
        });
      }, {
        threshold: 0.3
      });
      this.element._annotationInstance = this;
      this.observer.observe(this.element);
    }
  };

  // js/modules.js
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      gsapWithCSS.registerPlugin(ScrollTrigger2, SplitText);
      const g3 = {};
      window.g = g3;
      g3.scrollTrigger = ScrollTrigger2;
      g3.splitText = SplitText;
      g3.pxToRem = (px) => {
        return px / 16 * 1 + "rem";
      };
      handleLazyLoad();
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t2) => Math.min(1, 1.001 - Math.pow(2, -10 * t2)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false
      });
      console.log("mm?");
      function raf(time) {
        if (window.innerWidth < 992 && lenis.isStopped) {
          lenis.stop();
          console.log("stop lenis");
        } else if (window.innerWidth >= 992 && lenis.isStarted) {
          lenis.start();
          console.log("start lenis");
        }
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      lenis.stop();
      $(document).ready(function() {
        lenis.start();
      });
      window.lenis = lenis;
      getFontSize();
      window.addEventListener("resize", () => {
        getFontSize();
      });
      const buttonElements = document.querySelectorAll("[data-button-text]");
      buttonElements.forEach((element) => {
        new Button(element);
      });
      const rollerElements = document.querySelectorAll("[data-roller]");
      rollerElements.forEach((element) => {
        new Roller(element);
      });
      const hexElements = document.querySelectorAll(".bg-hex");
      hexElements.forEach((element) => {
        new Hex(element);
      });
      const shrinkText = document.querySelectorAll("[data-shrink]");
      shrinkText.forEach((element) => {
        console.log("shrink text");
        new ShrinkText(element);
      });
      const testimonialElements = document.querySelectorAll("[testimonial]");
      testimonialElements.forEach((element) => {
        new Testimonials(element);
      });
      const faqElements = document.querySelectorAll("[faq]");
      faqElements.forEach((element) => {
        new FaqElements(element);
      });
      const movingHexElements = document.querySelectorAll("[moving-hex]");
      movingHexElements.forEach((element) => {
        new MovingHex(element);
      });
      const movingHexAnimationElements = document.querySelectorAll("[data-animation='moving-hex']");
      movingHexAnimationElements.forEach((element) => {
        new MovingHex(element);
      });
      const dictionElements = document.querySelectorAll("[data-animation='diction']");
      dictionElements.forEach((element) => {
        new Diction(element);
      });
      const megamenuElements = document.querySelectorAll("[megamenu]");
      megamenuElements.forEach((element) => {
        new Megamenu(element);
      });
      const videoModalElements = document.querySelectorAll("[data-video]");
      videoModalElements.forEach((element) => {
        new Video(element);
      });
      const parallaxElements = document.querySelectorAll("[data-animation='parallax']");
      parallaxElements.forEach((element) => {
        new Parallax(element);
      });
      const membershipsElements = document.querySelectorAll("[data-animation='memberships']");
      membershipsElements.forEach((element) => {
        new Memberships(element);
      });
      const interactiveHexElements = document.querySelectorAll("[data-animation='interactivehex']");
      interactiveHexElements.forEach((element) => {
        new InteractiveHex(element);
      });
      const staggerElements = document.querySelectorAll("[data-animation='stagger']");
      staggerElements.forEach((element) => {
        new Stagger(element);
      });
      const headingWaveElements = document.querySelectorAll("[data-animation='headingWave']");
      headingWaveElements.forEach((element) => {
        new HeadingWave(element);
      });
      const imageElements = document.querySelectorAll("[data-animation='image']");
      imageElements.forEach((element) => {
        new Image(element);
      });
      const ballsElements = document.querySelectorAll("[data-animation='balls']");
      ballsElements.forEach((element) => {
        new Balls(element);
      });
      const annotationElements = document.querySelectorAll("[data-annotation]");
      annotationElements.forEach((element) => {
        new Annotations(element);
      });
      const searchResultsElements = document.querySelectorAll("[search-results]");
      searchResultsElements.forEach((element) => {
        console.log("one");
        new SearchResults(element);
      });
    });
  }
  function getFontSize() {
    const breakpoint = window.innerWidth < 768 ? "small" : window.innerWidth < 992 ? "medium" : "desktop";
    let fontSize = breakpoint === "small" ? Math.max(9, document.body.clientWidth / 767 * 16) : breakpoint === "medium" ? Math.max(14, document.body.clientWidth / 991 * 16) : Math.max(14, Math.min(document.body.clientWidth / 1290 * 16, 1680 / 1290 * 16));
    document.documentElement.style.setProperty("--fontSize", fontSize + "px");
  }
  function handleLazyLoad(config3 = {}) {
    let lazyImages = gsapWithCSS.utils.toArray("img[loading='lazy']"), timeout = gsapWithCSS.delayedCall(config3.timeout || 1, ScrollTrigger2.refresh).pause(), lazyMode = config3.lazy !== false, imgLoaded = lazyImages.length, onImgLoad = () => lazyMode ? timeout.restart(true) : --imgLoaded || ScrollTrigger2.refresh();
    lazyImages.forEach((img, i2) => {
      lazyMode || (img.loading = "eager");
      img.naturalWidth ? onImgLoad() : img.addEventListener("load", onImgLoad);
    });
  }
  function splitTextGradient(parent, chars) {
    const color1 = getComputedStyle(parent).getPropertyValue("--color1");
    const color2 = getComputedStyle(parent).getPropertyValue("--color2");
    const color = gsapWithCSS.utils.interpolate(color1, color2);
    gsapWithCSS.set(chars, {
      color: (index, target, targets) => color(index / (targets.length - 1))
    });
  }
})();
/*! Bundled license information:

gsap/gsap-core.js:
  (*!
   * GSAP 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/CSSPlugin.js:
  (*!
   * CSSPlugin 3.13.0
   * https://gsap.com
   *
   * Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/SplitText.js:
  (*!
   * SplitText 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2025, GreenSock. All rights reserved. Subject to the terms at https://gsap.com/standard-license.
   * @author: Jack Doyle
   *)

gsap/utils/paths.js:
  (*!
   * paths 3.13.0
   * https://gsap.com
   *
   * Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/CustomEase.js:
  (*!
   * CustomEase 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/CustomBounce.js:
  (*!
   * CustomBounce 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/Observer.js:
  (*!
   * Observer 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)

gsap/ScrollTrigger.js:
  (*!
   * ScrollTrigger 3.13.0
   * https://gsap.com
   *
   * @license Copyright 2008-2025, GreenSock. All rights reserved.
   * Subject to the terms at https://gsap.com/standard-license
   * @author: Jack Doyle, jack@greensock.com
  *)
*/
