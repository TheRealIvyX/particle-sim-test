var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth
canvas.height = window.innerHeight

let particles = []
function dist(o1,o2) {
  return Math.sqrt(Math.pow(o1.x-o2.x,2) + Math.pow(o1.y-o2.y,2))
}

class Vector {
    constructor(x, y) { // code "borrowed" from arras.io
        this.x = x;
        this.y = y;
    }

    update() {
        this.len = this.length;
        this.dir = this.direction;
    }

    get length() {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    get direction() {
        return Math.atan2(this.y, this.x);
    }
}

class Particle {
  constructor(pos) {
    this.x = pos.x
    this.y = pos.y
    this.vel = new Vector(0, 0) // velocity
    this.reactivity = 0 // higher reactivity = higher chance to bond instead of repelling when within bonding range. range: 0 - 1
    this.energy = 0 // more energy = more shaking, but can also do more stuff ig
    this.bonds = [] // list of particles that this specific particle is bonded to.
    this.bondStrength = 1 // strength of bonds it forms. less stability = less force required to break the bond. range: 0 - 1
    this.selfBondStrength = 1 // strength of bonds it forms with particles of its own type. range: 0 - 1
    this.color = '#ffffff'
    this.maxBonds = 1 // max amount of bonds the particle can have
  }
  move() {
    this.x += this.vel.x
    this.y += this.vel.y
    if (this.energy > 0) {
      this.x += (this.energy * Math.random()) - (this.energy / 2)
      this.y += (this.energy * Math.random()) - (this.energy / 2)
      this.energy *= 0.999 // dissisipate energy and vibrate
    }
    if (this.reactivity > 0) { // do not get pulled towards bonds if completely unreactive
      this.bonds.forEach(function(other){
        if (!other.bonds.includes(this)) other.bonds.push(this) // add itself to the bonds list of the bonded particle if it isnt in said list already
        this.x += (this.x - other.x)/(3/((this.bondStrength+other.bondStrength)/2))
        this.y += (this.y - other.y)/(3/((this.bondStrength+other.bondStrength)/2))
        this.energy
      })
    }
  }
  interact() {
    particles.forEach(function(other){
      if (other != this) {
        if (dist(this, other) < 3000) { // attract particles to each other
          let force = 500
          console.log(force)
          force = force / dist(this, other) / dist(this, other)
          this.x += ((this.x-other.x)/dist(this, other))*force
          this.y += ((this.y-other.y)/dist(this, other))*force
        }
      }
    })
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 7.5, 0, Math.PI*2, false)
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

function spawnPart(prop) {
  let o = new Particle({
    x: prop.x,
    y: prop.y
  })
  o.energy = prop.energy
  particles.push(o)
}
spawnPart({
  x: 240,
  y: 160,
  energy: 3
})

// var is deprecated ik
var bringToLife = (() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  particles.forEach(function(part){
    part.move()
    part.interact()
    part.draw()
  })
})
setInterval(bringToLife, 1000/60); // run at 60 fps
