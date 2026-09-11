let _buttonMode;                 // CENTER or CORNER
let _buttonTextAlign;

function buttonMode(mode) {
  if (mode !== CENTER && mode !== CORNER) {
    console.warn('buttonMode: expected CENTER or CORNER');
    return;
  }
  _buttonMode = mode;
}

function buttonTextAlign(h, v = h) {
  _buttonTextAlign = [h, v];
}

// helper: resolve x/y/w/h into consistent bounds regardless of mode
function _buttonBounds(x, y, w, h, mode) {
  if (mode === CORNER) {
    return { left: x, top: y, right: x + w, bottom: y + h, cx: x + w / 2, cy: y + h / 2 };
  }
  return { left: x - w / 2, top: y - h / 2, right: x + w / 2, bottom: y + h / 2, cx: x, cy: y };
}

class Button {
  constructor(x, y, w, h, label, onClick, options = {}) {
    this.x = x; this.y = y;
    this.w = w; this.h = h;
    this.label = label;
    this.onClick = onClick;
    this.hovered = false;

    this.default = {
      textSize: 20,
      textColor: PALETTE.ink,
      bgColor: PALETTE.menuBg,
      hoverColor: PALETTE.surfaceRaised,
      stroke: PALETTE.menuStroke,
      strokeWeight: 2,
      cornerRadius: 4,
      mode: null,       // override buttonMode() for this instance
      textAlign: null,   // override buttonTextAlign() for this instance

      behaviors: []
    };
    this.style = { ...this.default, ...options };

    // Each factory runs ONCE here, closing over `this` (the button)
    // plus whatever private variables it declares internally.
    // The returned function is what actually runs on each behave() call.
    this.behaviors = this.style.behaviors.map(factory => factory(this));
  }

  contains(px, py) {
    const mode = this.style.mode || _buttonMode;
    const b = _buttonBounds(this.x, this.y, this.w, this.h, mode);
    return px > b.left && px < b.right && py > b.top && py < b.bottom;
  }

  update() {
    this.hovered = this.contains(mouseX, mouseY);
  }

  draw() {
    push();
    const mode = this.style.mode || _buttonMode;
    const align = this.style.textAlign || _buttonTextAlign;
    const b = _buttonBounds(this.x, this.y, this.w, this.h, mode);

    fill(...this.style.bgColor);
    if (this.hovered) fill(...this.style.hoverColor);
    strokeWeight(this.style.strokeWeight);
    stroke(...this.style.stroke);

    rectMode(mode);
    rect(this.x, this.y, this.w, this.h, this.style.cornerRadius);

    fill(...this.style.textColor);
    noStroke();
    textAlign(...align);
    textSize(this.style.textSize);

    // position label according to alignment within the button's bounds
    const pad = 8;
    let tx = b.cx, ty = b.cy;
    if (align[0] === LEFT) tx = b.left + pad;
    else if (align[0] === RIGHT) tx = b.right - pad;
    if (align[1] === TOP) ty = b.top + pad;
    else if (align[1] === BOTTOM) ty = b.bottom - pad;

    text(this.label, tx, ty);
    pop();
  }

  behave() {
    for (const run of this.behaviors) {
      run();
    }
  }

  handleClick(px = mouseX, py = mouseY) {
    if (this.contains(px, py)) this.onClick();
  }
}

//Behavior Factories

function wobble({ speed = 0.1, distance = 5} = {}) {
  return function attachTo(btn) {
    let angle = 0;
    return function runWobble() {
      angle += speed;
      btn.x += Math.sin(angle) * distance;
    };
  }
}

function springX({ targetX, speed = 0.1, damping = 0.8 } = {}) {
  return function attachTo(btn) {
    let vx = 0;
    return function runSpringX() {
      const dx = targetX - btn.x;
      if(abs(dx) > 0.1 || abs(vx) > 0.1) {
        vx += dx * speed;
        vx *= damping;
        btn.x += vx;
      }
    };
  }
}
