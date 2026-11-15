// Transparent left virtual joystick + right-screen touch look for Painted Valley (Android APK / Mobile WebView)
export class TouchControls {
  constructor(canvas, { onAction } = {}) {
    this.canvas = canvas;
    this.onAction = onAction || (() => {});
    this.move = { x: 0, y: 0 };
    this.look = { x: 0, y: 0 };
    this.sprint = false;
    this.jumpPressed = false;
    this.active = false;

    this.joyTouchId = null;
    this.lookTouchId = null;
    this.joyOrigin = { x: 0, y: 0 };
    this.lastLook = { x: 0, y: 0 };
    this.maxRadius = 56;
    this.lookSensitivity = 0.0045;

    this._buildDOM();
    this._bindEvents();
  }

  _buildDOM() {
    const style = document.createElement('style');
    style.textContent = `
      #pv-touch-ui {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 50;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }
      #pv-joy-zone {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 48%;
        height: 75%;
        pointer-events: auto;
        touch-action: none;
      }
      #pv-look-zone {
        position: absolute;
        right: 0;
        top: 0;
        width: 52%;
        height: 100%;
        pointer-events: auto;
        touch-action: none;
      }
      #pv-joy-base {
        position: absolute;
        left: 36px;
        bottom: 36px;
        width: 112px;
        height: 112px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
        border: 1.5px solid rgba(255, 255, 255, 0.28);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s ease;
        opacity: 0.65;
        pointer-events: none;
      }
      #pv-joy-base.active {
        opacity: 0.95;
        background: rgba(255, 255, 255, 0.16);
        border-color: rgba(255, 255, 255, 0.45);
      }
      #pv-joy-knob {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.28);
        border: 1.5px solid rgba(255, 255, 255, 0.55);
        transform: translate3d(0px, 0px, 0px);
        pointer-events: none;
      }
      #pv-action-bar {
        position: absolute;
        right: 24px;
        bottom: 32px;
        display: flex;
        gap: 12px;
        pointer-events: auto;
      }
      .pv-btn {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        border: 1.5px solid rgba(255, 255, 255, 0.30);
        color: rgba(255, 255, 255, 0.85);
        font: 600 11px/1 system-ui, -apple-system, sans-serif;
        letter-spacing: 0.04em;
        display: grid;
        place-items: center;
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        touch-action: manipulation;
      }
      .pv-btn:active {
        background: rgba(255, 255, 255, 0.28);
      }
    `;
    document.head.appendChild(style);

    const ui = document.createElement('div');
    ui.id = 'pv-touch-ui';
    ui.innerHTML = `
      <div id="pv-joy-zone">
        <div id="pv-joy-base">
          <div id="pv-joy-knob"></div>
        </div>
      </div>
      <div id="pv-look-zone"></div>
      <div id="pv-action-bar">
        <button class="pv-btn" data-key="KeyT" title="Time of Day">SUN</button>
        <button class="pv-btn" data-key="KeyV" title="Toggle 1st/3rd Person">VIEW</button>
        <button class="pv-btn" data-jump="1" title="Jump">JUMP</button>
      </div>
    `;
    document.body.appendChild(ui);

    this.joyZone = ui.querySelector('#pv-joy-zone');
    this.lookZone = ui.querySelector('#pv-look-zone');
    this.joyBase = ui.querySelector('#pv-joy-base');
    this.joyKnob = ui.querySelector('#pv-joy-knob');
    this.actionBar = ui.querySelector('#pv-action-bar');
  }

  _unlockGameStart() {
    document.body.classList.add('playing');
    window.dispatchEvent(new CustomEvent('pv-touch-start'));
  }

  _bindEvents() {
    // Left transparent joystick
    this.joyZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._unlockGameStart();
      if (this.joyTouchId !== null) return;
      const t = e.changedTouches[0];
      this.joyTouchId = t.identifier;
      const rect = this.joyBase.getBoundingClientRect();
      this.joyOrigin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      this.joyBase.classList.add('active');
      this._updateJoystick(t.clientX, t.clientY);
    }, { passive: false });

    this.joyZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyTouchId) {
          this._updateJoystick(t.clientX, t.clientY);
        }
      }
    }, { passive: false });

    const endJoy = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.joyTouchId) {
          this.joyTouchId = null;
          this.move.x = 0;
          this.move.y = 0;
          this.sprint = false;
          this.active = false;
          this.joyBase.classList.remove('active');
          this.joyKnob.style.transform = 'translate3d(0px, 0px, 0px)';
        }
      }
    };
    this.joyZone.addEventListener('touchend', endJoy, { passive: false });
    this.joyZone.addEventListener('touchcancel', endJoy, { passive: false });

    // Right half camera look
    this.lookZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this._unlockGameStart();
      if (this.lookTouchId !== null) return;
      const t = e.changedTouches[0];
      this.lookTouchId = t.identifier;
      this.lastLook = { x: t.clientX, y: t.clientY };
    }, { passive: false });

    this.lookZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.lookTouchId) {
          const dx = t.clientX - this.lastLook.x;
          const dy = t.clientY - this.lastLook.y;
          this.lastLook = { x: t.clientX, y: t.clientY };
          this.look.x += dx * this.lookSensitivity;
          this.look.y += dy * this.lookSensitivity;
        }
      }
    }, { passive: false });

    const endLook = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.lookTouchId) {
          this.lookTouchId = null;
        }
      }
    };
    this.lookZone.addEventListener('touchend', endLook, { passive: false });
    this.lookZone.addEventListener('touchcancel', endLook, { passive: false });

    // Action buttons (Jump, View, Time of Day)
    this.actionBar.querySelectorAll('.pv-btn').forEach((btn) => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._unlockGameStart();
        if (btn.dataset.jump) {
          this.jumpPressed = true;
        } else if (btn.dataset.key) {
          window.dispatchEvent(new KeyboardEvent('keydown', { code: btn.dataset.key }));
          setTimeout(() => {
            window.dispatchEvent(new KeyboardEvent('keyup', { code: btn.dataset.key }));
          }, 60);
        }
      }, { passive: false });
    });
  }

  _updateJoystick(clientX, clientY) {
    const dx = clientX - this.joyOrigin.x;
    const dy = clientY - this.joyOrigin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, this.maxRadius);
    const angle = Math.atan2(dy, dx);
    const kx = Math.cos(angle) * clamped;
    const ky = Math.sin(angle) * clamped;

    this.joyKnob.style.transform = `translate3d(${kx.toFixed(1)}px, ${ky.toFixed(1)}px, 0px)`;

    const norm = clamped / this.maxRadius;
    if (norm < 0.10) {
      this.move.x = 0;
      this.move.y = 0;
      this.sprint = false;
      this.active = false;
    } else {
      // In Painted Valley Input.read: x is right (+1), y is forward (+1 = up on screen, so -sin)
      this.move.x = (kx / this.maxRadius);
      this.move.y = -(ky / this.maxRadius);
      this.sprint = norm > 0.88; // Push joystick to rim to sprint automatically
      this.active = true;
    }
  }

  consume(state) {
    if (this.active || Math.hypot(this.move.x, this.move.y) > 0.01) {
      state.move = { x: this.move.x, y: this.move.y };
      state.walk = false;
      if (this.sprint) state.sprint = true;
      state.device = 'pad';
    }
    if (this.look.x !== 0 || this.look.y !== 0) {
      state.look.x += this.look.x;
      state.look.y += this.look.y;
      this.look.x = 0;
      this.look.y = 0;
      state.device = 'pad';
    }
    if (this.jumpPressed) {
      state.jump = true;
      this.jumpPressed = false;
      state.device = 'pad';
    }
    return state;
  }
}
