'use strict'
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
let paused = false
let heldKeys = {}
function nullCheck(val, def) {
  if (val != null) {
    return val // return the value if value is defined
  } else return def // return default value otherwise
}
window.addEventListener('keyup', (e) => {
  heldKeys[e.keyCode] = false;
  if (e.keyCode == 32) {
    switch (paused) {
      case false:
        paused = true
        break;
      case true:
        paused = false
        break;
      default:
        paused = false
        break;
    }
  }
})
window.addEventListener('keydown', (e) => { heldKeys[e.keyCode] = true; })
function keyDown(key) {
  if (heldKeys[key] == null) heldKeys[key] = false 
  return heldKeys[key]
}
let camera = {
  x: 0,
  y: 0,
  vel: {
    x: 0,
    y: 0
  }
}
function gameControl() {
  if (keyDown(37) || keyDown(65)) {
    camera.vel.x += 0.2
  }
  if (keyDown(38) || keyDown(87)) {
    camera.vel.y += 0.2
  }
  if (keyDown(39) || keyDown(68)) {
    camera.vel.x -= 0.2
  }
  if (keyDown(40) || keyDown(83)) {
    camera.vel.y -= 0.2
  }
  camera.x += camera.vel.x
  camera.y += camera.vel.y
  camera.vel.x *= 0.99
  camera.vel.y *= 0.99
}
function drawUI() {
  if (paused == true) {
    ctx.fillStyle = '#ffd966'
    ctx.strokeStyle = '#af8916'
    ctx.lineWidth = 7.5/2.5
    ctx.textAlign = 'center'
    ctx.font = '48px ubuntu';
    ctx.fillText('Simulation Paused', canvas.width/2, 58)
    ctx.strokeText('Simulation Paused', canvas.width/2, 58)
  }
}

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
    this.bondHalfLife = -1 // the time it takes for half of all bonds formed by this particle to randomly break on their own in seconds. set to -1 to disable
    this.id = -1 // DO NOT CHANGE
    this.substitutionPriority = 1 // particles with a lower substitution priority than other particles can be replaced by them in a molecule
  }
  splitBond(part1, part2) {
    part2.bonds.splice(part2.bonds.indexOf(part1))
    part1.bonds.splice(part1.bonds.indexOf(part2))
    part1.energy += 12 // add energy to both particles to prevent them from bonding again
    part2.energy += 12
  }
  bond(part1, part2) {
    if (!part1.bonds.includes(part2)) part1.bonds.push(part2)
    if (!part2.bonds.includes(part1)) part2.bonds.push(part1)
  }
  move() {
    this.x += this.vel.x
    this.y += this.vel.y
    this.vel.x *= 0.999
    this.vel.y *= 0.999
    if (this.energy > 0) {
      this.x += ((this.energy * Math.random()) - (this.energy / 2))/(this.bonds.length+1) // vibrate less if bonded
      this.y += ((this.energy * Math.random()) - (this.energy / 2))/(this.bonds.length+1)
      this.energy *= 0.99
    }
    if (this.reactivity > 0) { // do not get pulled towards bonds if completely unreactive
      let me = this
      this.bonds.forEach(function(other){
        if (!other.bonds.includes(me)) other.bonds.push(me) // add itself to the bonds list of the bonded particle if it isnt in said list already
        if (dist(me, other) <= 100) {
          me.vel.x *= 0.99
          me.vel.y *= 0.99
        }
        let force = dist(me, other)
        if (force <= 50) force = -50
        force *= 0.0025
        force /= 1.5
        force *= (me.bondStrength + other.bondStrength) / 2
        me.vel.x -= ((me.x-other.x)/30)*force
        me.vel.y -= ((me.y-other.y)/30)*force
        if (dist(me, other) > 200) {
          if ((Math.random()*Math.random()*Math.random()) > (me.bondStrength+other.bondStrength)/2 || dist(me, other) >= 250) {
            me.splitBond(me, other)
          }
          if (dist(me, other) >= 250) {
            me.splitBond(me, other)
          }
        }
        if (Math.random() < (Math.log(2)/me.bondHalfLife)/60) {
          me.splitBond(me, other)
        }
      })
    }
  }
  interact() {
    let me = this
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
            if (me.reactivity > 0 && other.reactivity > 0 && dist(me, other) < 200) {
              if ((1-(Math.random()*Math.random()*Math.random())) < (me.reactivity+other.reactivity)/2 && me.bonds.length < me.maxBonds && other.bonds.length < other.maxBonds) {
                me.bond(me, other)
              }
            }
          }
          if (dist(me, other) < 150) { // substitution in molecules
            if (other.substitutionPriority < me.substitutionPriority && (1-(Math.random()*Math.random()*Math.random()))<(me.reactivity+other.reactivity)/2 && Math.random() <= 1/200 && me.maxBonds >= other.maxBonds) {
              let swapBonds = []
              me.bonds.forEach(function(part){
                if (other.substitutionPriority - me.substitutionPriority <= 1.5 && swapBonds.length < other.maxBonds) swapBonds.push(part)
                me.splitBond(me, part)
              })
              let substituteBonds = []
              other.bonds.forEach(function(part){
                substituteBonds.push(part)
                other.splitBond(other, part)
              })
              substituteBonds.forEach(function(part){
                me.bond(me, part)
              })
              if (other.substitutionPriority - me.substitutionPriorit <= 1.5) {
                swapBonds.forEach(function(part){
                  other.bond(other, part)
                })
              }
            }
          }
          if (dist(me, other) < 150) { // particle theft in molecules
            if (other.substitutionPriority < me.substitutionPriority && (1-(Math.random()*Math.random()*Math.random()))<(me.reactivity+other.reactivity)/2 && Math.random() <= 1/200 && me.bonds.length < me.maxBonds) {
              let split = false
              if (other.bonds.length >= other.maxBonds) split = true
              if (split == true) {
                other.splitBond(other, other.bonds[0])
              }
              me.bond(me, other)
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
          if (!me.bonds.includes(other)) {
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
      ctx.lineWidth = 7.5/2
      if (other.color == me.color) { // make a simple line between both particles if the 2 particles are the some color
        ctx.strokeStyle = me.color
        ctx.moveTo(me.x+camera.x, me.y+camera.y);
        ctx.lineTo(other.x+camera.x, other.y+camera.y);
        ctx.stroke();
        ctx.closePath();
      } else { // otherwise make 2 lines, which together look like a line that changes color halfway between both particles
        ctx.strokeStyle = me.color
        ctx.moveTo(me.x+camera.x, me.y+camera.y);
        ctx.lineTo(((me.x+other.x)/2)+camera.x, ((me.y+other.y)/2)+camera.y);
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(((me.x+other.x)/2)+camera.x, ((me.y+other.y)/2)+camera.y);
        ctx.strokeStyle = other.color
        ctx.lineTo(other.x+camera.x, other.y+camera.y);
        ctx.stroke();
        ctx.closePath();
      }
    })
    // draw the particle itself
    ctx.beginPath();
    ctx.arc(this.x+camera.x, this.y+camera.y, 7.5, 0, Math.PI*2, false)
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
  }
}

function spawnPart(prop = {x:0,y:0,energy:0,reactivity:0,color:'#ffffff',bondProps:{max:1,strength:0.9}}) {
  let o = new Particle({
    x: nullCheck(prop.x, 0),
    y: nullCheck(prop.y, 0)
  })
  if (prop.bondProps == null) prop.bondProps = {}
  o.energy = nullCheck(prop.energy, 0)
  o.reactivity = nullCheck(prop.reactivity, 0)
  o.color = nullCheck(prop.color, '#ffffff')
  o.maxBonds = nullCheck(prop.bondProps.max, 1)
  o.bondStrength = nullCheck(prop.bondProps.strength, 1)
  o.bondHalfLife = nullCheck(prop.bondProps.halfLife, -1)
  o.substitutionPriority = nullCheck(prop.bondProps.substitutionPriority, 1)
  o.id = Date.now()
  particles.push(o)
}

for (let i = 0; i<40; i++) {
  spawnPart({ // spawn 40 white particles on the screen
    x: canvas.width*Math.random(),
    y: canvas.height*Math.random(),
    energy: 30*Math.random(),
    reactivity: 0.9,
    color: '#ffffff',
    bondProps: {
      max: 1,
      strength: 1.35,
      substitutionPriority: 0
    }
  })
}
for (let i = 0; i<20; i++) {
  spawnPart({ // spawn 20 red particles on the screen
    x: canvas.width*Math.random(),
    y: canvas.height*Math.random(),
    energy: 30*Math.random(),
    reactivity: 0.7,
    color: '#ff0000',
    bondProps: {
      max: 2,
      strength: 1.05
    }
  })
}
for (let i = 0; i<10; i++) {
  spawnPart({ // spawn 10 blue particles on the screen
    x: canvas.width*Math.random(),
    y: canvas.height*Math.random(),
    energy: 30*Math.random(),
    reactivity: 0.3,
    color: '#0000ff',
    bondProps: {
      max: 3,
      strength: 1.7
    }
  })
}
for (let i = 0; i<10; i++) {
  spawnPart({ // spawn 10 dark grey particles on the screen
    x: canvas.width*Math.random(),
    y: canvas.height*Math.random(),
    energy: 30*Math.random(),
    reactivity: 0.1,
    color: '#383838',
    bondProps: {
      max: 4,
      strength: 1.35
    }
  })
}
for (let i = 0; i<10; i++) {
  spawnPart({ // spawn 10 light blue particles on the screen
    x: canvas.width*Math.random(),
    y: canvas.height*Math.random(),
    energy: 30*Math.random(),
    reactivity: 0,
    color: '#d9ffff',
    bondProps: {
      max: 0,
      strength: 0
    }
  })
}
for (let i = 0; i<20; i++) {
  spawnPart({ // spawn 20 green particles on the screen
    x: canvas.width*Math.random(),
    y: canvas.height*Math.random(),
    energy: 30*Math.random(),
    reactivity: 0.99,
    color: '#90e050',
    bondProps: {
      max: 1,
      strength: 1.95,
      substitutionPriority: 2
    }
  })
}
for (let i = 0; i<4; i++) {
  spawnPart({ // spawn 4 desatured light blue particles on the screen
    x: canvas.width*Math.random(),
    y: canvas.height*Math.random(),
    energy: 30*Math.random(),
    reactivity: 0.075,
    color: '#819a9a',
    bondProps: {
      max: 4,
      strength: 1.2,
      substitutionPriority: 1.1
    }
  })
}

// var is deprecated ik
var bringToLife = (() => {
  if (canvas.width != window.innerWidth) canvas.width = window.innerWidth // update canvas size if it is changed
  if (canvas.height != window.innerHeight) canvas.height = window.innerHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height) // clear the canvas every frame
  if (paused != true) { // dont do any movement or interactions if the simulation is paused
    particles.forEach(function(part){ // do the movement and interactions of the particles
      part.move()
      part.interact()
    })
  }
  particles.forEach(function(part){ // draw them after doing everything
    part.draw()
  })
  gameControl() // stuff like camera movement
  drawUI() // draw the UI after everything else is drawn
})
setInterval(bringToLife, 1000/60); // run at 60 fps
