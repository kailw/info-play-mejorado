
let fpsMeasure = getFPSMeasure();

/**
 * The Particle class is responsible for undertaking the calculations based on properties
 * provided by the Simulation class.
 * 
 * @class Particle
 * @author Liam Egan <liam@wethecollective.com>
 * @version 0.1.0
 * @created July 4th, 2017
 */
class Particle {

  /**
   * Creates an instance of Particle.
   * 
   * @constructor
   * @param {BarfyStars} emitter         The emitter class that provides the properties.
   * @memberOf Particle
   */
  constructor(emitter, startPosition) {
    this.emitter = emitter;
    this.element = document.createElement('span');
    this.element.className = this.emitter.particleClasses;

    let randomFactor = new Vector(Math.random(), Math.random());
    let gravityMultiplier = this.gravityFactor === 0 ? 2 : (-1.-this.gravityFactor);
    this.momentum = new Vector(
      (this.momentumfactor * -1) + (randomFactor.x * (this.momentumfactor * 2)), 
      (this.momentumfactor * -1) + (randomFactor.y * (this.momentumfactor * gravityMultiplier))
    );
    if( !(startPosition instanceof Vector) ) {
      startPosition = new Vector(0,0);
    }
    this.position = startPosition;

    this.scale = this.scaleInitial + Math.random() * this.scaleFactor;
    this.opacity = 1;
    this.gravity = new Vector(0, this.gravityFactor);
    this.rotation = this.momentum.x;

    this.run();
  }

  /**
   * Runs the simulation for the particle.
   *  
   * @memberOf Particle
   */
  run() {
    let pos = this.position.clone();
    this.momentum.scale(this.friction).add(this.gravity);
    pos.add(this.momentum);
    this.rotation += this.momentum.x;
    this.scale *= this.friction - 0.03;
    this.opacity *= this.friction;
    this.position = pos;

    this.element.style.transform = `translate(${ this.position.x }px, ${ this.position.y }px) scale(${ this.scale }) rotate(${ this.rotation }deg)`;
    this.element.style.opacity = this.opacity;

    if(this.scale < this.removeAt || fpsMeasure.average60 < 5) {
      this.emitter.removeParticle(this);
    }
  }

  /**
   * Getters and setters
   */

  /**
   * (getter/setter) The momentum factor for the particle.
   * If not provided, tries to find the value on the emitter.
   * 
   * @memberOf Particle
   * @default 5.0
   */
  set momentumfactor(value) {
    if( !isNaN(value) ) {
      this._momentumfactor = value;
    }
  }
  get momentumfactor() {
    return this._momentumfactor || this.emitter.momentum || 5.0;
  }

  /**
   * (getter/setter) The friction of the particle.
   * 
   * @memberOf Particle
   * @default 0.999
   */
  set friction(value) {
    if( !isNaN(value) ) {
      this._friction = value;
    }
  }
  get friction() {
    return this._friction || this.emitter.friction || 0.999;
  }

  /**
   * (getter) The scaleInitial property is the initial scale of the particle.
   * This property is derived from the emitter.
   * 
   * @readonly
   * @memberOf Particle
   * @default 0.5
   */
  get scaleInitial() {
    return this.emitter.scaleInitial || 0.5;
  }

  /**
   * (getter) scaleFactor is the amount of scaling that happens on the particle initially.
   * This property is derived from the emitter.
   * 
   * @readonly
   * @memberOf Particle
   * @default 0.8
   */
  get scaleFactor() {
    return this.emitter.scaleFactor || 0.8;
  }

  /**
   * (getter) removeAt determines the point, in scale, at which the particle is removed.
   * This property is derived from the emitter.
   * 
   * @readonly
   * @memberOf Particle
   * @default 0.05
   */
  get removeAt() {
    return this.emitter.removeAt || 0.05;
  }

  /**
   * (getter) the gravity determines the speed at which the particle falls.
   * This property is derived from the emitter.
   * 
   * @readonly
   * @memberOf Particle
   * @default 0.05
   */
  get gravityFactor() {
    return isNaN(this.emitter.gravity) || this.emitter.gravity === null ? 0.4 : this.emitter.gravity;
  }
}

class WTCBarfyStars extends HTMLDivElement {
  constructor() {
    super();

    try {
      if(this.dataset.config) {
        let config = JSON.parse(this.dataset.config);
        this.momentum = config.momentum;
        this.gravity = config.gravity;
        this.friction = config.friction;
        this.numParticles = config.numParticles;
        this.numUniqueParticles = config.numUniqueParticles;
        this.scaleInitial = config.scaleInitial;
        this.scaleFactor = config.scaleFactor;
        this.removeAt = config.removeAt;
        this.extraStyles = config.extraStyles;
        this.triggerAtMouse = config.triggerAtMouse;
      }

      this.working = true;
      this.configured = true;
    } catch (error) {
      console.log(error);
    }
    
    // Create a shadow root
    this.shadow = this.attachShadow({mode: 'open'});
    
    // Create spans
    this.wrapper = document.createElement('div');
    this.wrapper.setAttribute('class','wrapper');
    
    // Create some CSS to apply to the shadow dom
    var style = document.createElement('style');
    style.innerText = this.getStyles();
    
    this.shadow.appendChild(style);
    this.shadow.appendChild(this.wrapper);
    this.wrapper.innerHTML = this.innerHTML;
    
    // Bind the event listeners
    this._onResize = this._onResize.bind(this);
    this._onPointerEnter = this._onPointerEnter.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);

    if(this.configured) {
      this.addEventListener('pointerenter', this._onPointerEnter);
      this.addEventListener('pointerleave', this._onPointerLeave);
      if(this.triggerAtMouse) {
        this.mousePos = new Vector(0,0);
        window.addEventListener('pointermove', this._onPointerMove);
      }
    }
  }
  
  getStyles() {
    return `
      .wrapper {
        position: relative;
      }

      .BSParticle {
        display: block;
        height: 1px;
        left: 50%;
        position: absolute;
        pointer-events: none;
        top: 50%;
        width: 1px;
        z-index: 3;
      }
      .BSParticle::after {
        background: #3C6EB7;
        background-size: 100% 100%;
        // box-shadow: 10px 10px 10px rgba(255,255,255,0.2);
        content: '';
        display: block;
        height: 102px;
        position: absolute;
        transform: translate(-51px, -51px);
        width: 102px;
      }
      .BSParticle--2::after {
        background: #59C3C3;
      }
      .BSParticle--3::after {
        background: yellow;
      }
      .BSParticle--4::after {
        background: red;
      }
      .BSParticle--5::after {
        background: #467A19;
      }
    ` + this.extraStyles;
  }
  
  
  run() {
    this.particles.forEach((particle)=> {
      particle.run();
    });

    if(this.running) {
      requestAnimationFrame(this.run.bind(this));
    }
  }

  addParticles() {
    let rect = this.getBoundingClientRect();
    this.pos = new Vector(rect.left + (rect.right - rect.left) * .5, rect.top + (rect.bottom - rect.top) * .5);
    if(this.working) {
      for(let i = 0; i < this.numParticles; i++ ) {
        this.addParticle();
      }
      this.running = true;
    }
  }
  addParticle() {
    if(fpsMeasure.average60 > 20) {
      let particle;
      if(this.triggerAtMouse) {
        let pos = this.mousePos.subtractNew(this.pos);
        particle = new Particle(this, pos);
      } else {
        particle = new Particle(this);
      }
      this.particles.push(particle);
      this.wrapper.appendChild(particle.element);
    }
  }
  removeParticle(particle) {
    setTimeout(()=> {
      for(let i = this.particles.length -1; i >= 0; i--) {
        if(this.particles[i] === particle) {
          this.particles.splice(i, 1);
        }
      }
      if(this.particles.length <= 0) {
        this.running = false;
      }
      try {
        this.wrapper.removeChild(particle.element);
      } catch (error) {
        // console.log(error);
      }
    }, 0);
  }
  
  /*
   * EVENT LISTENERS
   */
  _onResize(e) {
    clearTimeout(this.cssTimeout);
    // this.ammendCSS();
  }
  _onPointerEnter(e) {
    if(this.touching) return true;
    this.touching = true;
    this.addParticles();
  }
  _onPointerLeave(e) {
    this.touching = false;
  }
  _onPointerMove(e) {
    this.mousePos.x = e.clientX;
    this.mousePos.y = e.clientY;
  }
  disconnectedCallback() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onPointerMove);
  }
  
  /*
   * PROPERTIES
   */
  
  set touching(value) {
    this._touching = value === true;
  }
  get touching() {
    return this._touching === true;
  }
  
  set configured(value) {
    this._configured = value === true;
  }
  get configured() {
    return this._configured === true;
  }
  
  set triggerAtMouse(value) {
    this._triggerAtMouse = value === true;
  }
  get triggerAtMouse() {
    return this._triggerAtMouse === true;
  }

  set working(value) {
    this._working = value === true;
  }
  get working() {
    return this._working === true;
  }

  set running(value) {
    let oldValue = this.running;
    this._running = value === true;
    if(this._running === true && oldValue === false) {
      this.run();
    }
  }
  get running() {
    return this._running === true;
  }

  set wrapper(value) {
    if(value instanceof HTMLElement) {
      this._wrapper = value;
    }
  }
  get wrapper() {
    return this._wrapper || null;
    
  }

  get particles() {
    if(!this._particles) {
      this._particles = [];
    }
    return this._particles;
  }

  get particleClasses() {
    let c = this.particleBaseClassName;
    return c + ' ' + c + '--' + Math.ceil(Math.random() * this.numUniqueParticles);
  }

  set numUniqueParticles(value) {
    if( !isNaN(value) ) this._numUniqueParticles = value;
  }
  get numUniqueParticles() {
    return this._numUniqueParticles || 5;
  }

  set particleBaseClassName(value) {
    if(typeof value == 'string') this._particleBaseClassName = value;
  }
  get particleBaseClassName() {
    return this._particleBaseClassName || 'BSParticle';
  }

  set action(value) {
    this._action = ['hover', 'click', 'callback'].indexOf(value);
    if(this._action < 0) this._action = 0;
  }
  get action() {
    return this._action || 0;
  }

  set wrapperClassname(value) {
    if(typeof value == 'string' && value.length > 3) {
      this._wrapperClassname = value;
    }
  }
  get wrapperClassname() {
    return (this._wrapperClassname || 'starburst') + (' ' + this.additionalClasses);
  }

  set momentum(value) {
    if( !isNaN(value) ) this._momentum = value;
  }
  get momentum() {
    return this._momentum || null;
  }

  set gravity(value) {
    if( !isNaN(value) ) this._gravity = value;
  }
  get gravity() {
    return isNaN(this._gravity) || this._gravity === null ? null : this._gravity;
  }

  set friction(value) {
    if( !isNaN(value) ) this._friction = value;
  }
  get friction() {
    return this._friction || null;
  }

  set numParticles(value) {
    if( !isNaN(value) ) this._numParticles = value;
  }
  get numParticles() {
    return this._numParticles || 20;
  }

  set scaleInitial(value) {
    if( !isNaN(value) ) this._scaleInitial = value;
  }
  get scaleInitial() {
    return this._scaleInitial || null;
  }

  set scaleFactor(value) {
    if( !isNaN(value) ) this._scaleFactor = value;
  }
  get scaleFactor() {
    return this._scaleFactor || null;
  }

  set removeAt(value) {
    if( !isNaN(value) ) this._removeAt = value;
  }
  get removeAt() {
    return this._removeAt || null;
  }

  set extraStyles(value) {
    if(typeof value == 'string') this._extraStyles = value;
  }
  get extraStyles() {
    return this._extraStyles || '';
  }
  
  set mousePos(value) {
    if(value instanceof Vector) this._mousePos = value;
  }
  get mousePos() {
    return this._mousePos || null;
  }
}


customElements.define('wtc-barfy-stars', WTCBarfyStars, { extends: 'div' });