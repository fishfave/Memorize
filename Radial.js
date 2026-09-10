class RadialMenu {
  constructor(options, clickFunction) {
    this.options = options;
    this.gap = TWO_PI / this.options.length;
    this.toMouse = createVector(0, 0);

    this.currentSpans = new Array(this.options.length).fill(this.gap);

    this.selectedIndex = 0; // NEW: which segment is currently under the mouse

    // --- tuning knobs ---
    this.maxBoost = 5;
    this.sharpness = 5;
    this.smoothing = 0.1;

    // --- position and siz ---
    this.posX = width/2;
    this.posY = height/2;
    this.outerRad = 0.4*(min(width,height));
    this.innerRad = 0.4*this.outerRad;
    

    this.clickFunction = clickFunction;
    this.active = true;
  }

  handleClick(){
    this.clickFunction(this.options[this.selectedIndex]);
  }

  show(x = this.posX, y = this.posY, outerRad = this.outerRad, innerRad = this.innerRad) {
    this.updateToMouse();
    let ang = this.toMouse.heading();
    if (ang < 0) ang += TWO_PI;

    this.selectedIndex = this.angleToIndex(ang);

    let n = this.options.length;
    let weights = this.options.map((_, i) => {
      let d = this.indexDiff(i, this.selectedIndex, n);
      let closeness = 1 - d / (n / 2);
      return 1 + Math.pow(closeness, this.sharpness) * this.maxBoost;
    });

    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let targetSpans = weights.map((w) => (w / totalWeight) * TWO_PI);

    for (let i = 0; i < n; i++) {
      this.currentSpans[i] = lerp(
        this.currentSpans[i],
        targetSpans[i],
        this.smoothing
      );
    }

    let start = 0;
    for (let i = 0; i < n; i++) {
      let end = start + this.currentSpans[i];

      if (i === this.selectedIndex) {
        fill(...PALETTE.menuSelected);
      } else if (i % 2) {
        fill(...PALETTE.menuBg);
      } else {
        fill(...PALETTE.menuBgAlt);
      }
      this.drawDonutSegment(x, y, innerRad, outerRad, start, end);
      start = end;
    }

    // fill(0);
    // textAlign(CENTER, CENTER);
    // textSize(20);
    // text(this.options[this.selectedIndex], x, y);
  }

  // draws one wedge of a donut: an arc along the outside, then back along the inside
  drawDonutSegment(x, y, innerRad, outerRad, start, end) {
    let resolution = 3; // vertices along the arc; raise for smoother curves on big segments

    beginShape();
    // outer edge, start -> end
    for (let i = 0; i <= resolution; i++) {
      let a = lerp(start, end, i / resolution);
      vertex(x + cos(a) * outerRad, y + sin(a) * outerRad);
    }
    // inner edge, end -> start (walking back)
    for (let i = 0; i <= resolution; i++) {
      let a = lerp(end, start, i / resolution);
      vertex(x + cos(a) * innerRad, y + sin(a) * innerRad);
    }
    endShape(CLOSE);
  }

  // walks the current spans to find which segment contains angle `ang`
  angleToIndex(ang) {
    let start = 0;
    for (let i = 0; i < this.currentSpans.length; i++) {
      let end = start + this.currentSpans[i];
      if (ang > start && ang <= end) return i;
      start = end;
    }
    return this.currentSpans.length - 1; // fallback, e.g. ang === 0
  }

  // shortest distance between two indices around a ring of size n
  indexDiff(i, j, n) {
    let d = Math.abs(i - j) % n;
    return Math.min(d, n - d);
  }

  updateToMouse() {
    this.toMouse.set(mouseX - this.posX, mouseY - this.posY);
  }
}