'use strict'
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
    this.bondStrength = 0.8 // strength of bonds it forms. less stability = less force required to break the bond. range: 0 - 1
    this.color = '#ffffff'
    this.maxBonds = 1 // max amount of bonds the particle can have
  }
  move() {
    this.x += this.vel.x
    this.y += this.vel.y
    this.vel.x *= 0.999
    this.vel.y *= 0.999
    if (this.energy > 0) {
      this.vel.x += ((this.energy * Math.random()) - (this.energy / 2))/(this.bonds.length+2) // vibrate less if bonded
      this.vel.y += ((this.energy * Math.random()) - (this.energy / 2))/(this.bonds.length+2)
      if (this.bonds.length == 0) {
        this.energy *= 0.99
      } else this.energy *= 0.999
    }
    if (this.reactivity > 0) { // do not get pulled towards bonds if completely unreactive
      let me = this
      this.bonds.forEach(function(other){
        if (!other.bonds.includes(me)) other.bonds.push(me) // add itself to the bonds list of the bonded particle if it isnt in said list already
        if (dist <= 200) {
          let force = dist(me, other)
          if (force <= 2) force = -3
          force *= 0.01
          me.vel.x -= ((me.x-other.x)/30)*force
          me.vel.y -= ((me.y-other.y)/30)*force
        } else {
          if ((Math.random()*Math.random()*Math.random()) > (me.bondStrength+other.bondStrength)/2) {
            other.bonds.splice(other.bonds.indexOf(me))
            me.bonds.splice(other.bonds.indexOf(other))
            me.energy += 2
            other.energy += 2
          }
        }
      })
    }
  }
  interact() {
    let me = this
    let change = {
      x: 0,
      y: 0,
      energy: 0
    }
    particles.forEach(function(other){
      if (other != me) {
        if (!me.bonds.includes(other)) { // only apply attractive/repulsive forces if the particles aren't bonded to each other
          if (dist(me, other) < 600 && dist(me, other) >= 300) { // weak long-range inter-molecular attraction
            let force = 5000
            force = force / dist(me, other) / dist(me, other)
            if (force > 2) force = 2
            force *= 0.01
            me.vel.x -= ((me.x-other.x)/dist(me, other))*force
            me.vel.y -= ((me.y-other.y)/dist(me, other))*force
            me.energy -= force*3 // increase/decrease own energy
            other.energy += force*1
          }
          if (dist(me, other) < 300) { // strong short-range inter-molecular repulsion
            let force = 5000
            force = force / dist(me, other) / dist(me, other)
            force *= 0.01
            me.vel.x += ((me.x-other.x)/dist(me, other))*force
            me.vel.y += ((me.y-other.y)/dist(me, other))*force
            me.energy -= force*9 // increase/decrease own energy
            other.energy += force*3
            if ((me.reactivity+other.reactivity)/2 > 0) {
              if (Math.random() > (me.reactivity+other.reactivity)/2 && me.bonds.length < me.maxBonds && other.bonds.length < other.maxBonds) {
                if (!me.bonds.includes(other)) me.bonds.push(other) // bond
                if (!other.bonds.includes(me)) other.bonds.push(me)
              }
            }
          }
          if (dist(me, other) < 30) { // extreme very short range repulsion to avoid particles intersecting
            let force = 15000
            force = force / dist(me, other) / dist(me, other)
            if (force >= 10) force = 10
            force *= 0.01
            me.vel.x += ((me.x-other.x)/dist(me, other))*force
            me.vel.y += ((me.y-other.y)/dist(me, other))*force
            me.energy += force*10
            other.energy += force*10
          }
        }
      }
    })
  }
  draw() {
    // draw all of its bonds
    let me = this
    this.bonds.forEach(function(other){
      ctx.beginPath();
      ctx.linewidth = 7.5/2
      if (other.color == me.color) { // make a simple line between both particles if the 2 particles are the some color
        ctx.strokeStyle = me.color
        ctx.moveTo(me.x, me.y);
        ctx.moveTo(other.x, other.y);
        ctx.stroke();
        ctx.closePath();
      } else { // otherwise make 2 lines, which together look like a line that changes color halfway between both particles
        ctx.strokeStyle = me.color
        ctx.moveTo(me.x, me.y);
        ctx.moveTo((me.x+other.x)/2, (me.y+other.y)/2);
        ctx.stroke();
        ctx.strokeStyle = other.color
        ctx.moveTo(other.x, other.y);
        ctx.stroke();
        ctx.closePath();
      }
    })
    // draw the particle itself
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
  o.reactivity = prop.reactivity
  particles.push(o)
}
for (let i = 0; i<100; i++) {
  spawnPart({ // spawn 100 particles on the screen
    x: canvas.width*Math.random(),
    y: canvas.height*Math.random(),
    energy: 30*Math.random(), // give them a random energy just to see what happens
    reactivity: 0.1
  })
}

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
