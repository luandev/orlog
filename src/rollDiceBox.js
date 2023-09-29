import Matter, { Body, Common } from "matter-js";
// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse;

// create an engine
var engine = Engine.create();
let rolls = 0;

// remove gravity to have the dice subject to collision only
engine.gravity.y = 0;
engine.gravity.x = 0;

// create a renderer
var render = Render.create({
  element: document.getElementById("renderArea"),
  engine: engine,
});

// create two boxes and a ground
const boxes = [...Array(6)].map((_, index) => {
  return Bodies.rectangle(
    Common.random(200, 500),
    Common.random(200, 500),
    80,
    80
  );
});
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
var ground2 = Bodies.rectangle(400, 0, 810, 30, { isStatic: true });
var ground3 = Bodies.rectangle(0, 400, 30, 810, { isStatic: true });
var ground4 = Bodies.rectangle(800, 400, 30, 810, { isStatic: true });
const mouseConstraint = MouseConstraint.create(engine, {
  element: document.getElementById("renderArea"),
});

// add all of the bodies to the world
Composite.add(engine.world, [
  ...boxes,
  ground,
  ground2,
  ground3,
  ground4,
  mouseConstraint,
]);

Events.on(mouseConstraint, "mousedown", function (event) {

  if(boxes.every((box) => box.isStatic) || rolls > 2) {
    return;
  }

  if (mouseConstraint.body) {
    mouseConstraint.body.isStatic = true;
    return;
  }

  boxes.forEach((box) => {
    var getMagnitude = () => Common.random(-1, 1) * 0.1 * box.mass;
    Body.applyForce(
      box,
      {
        x: box.position.x + Common.random() * getMagnitude(),
        y: box.position.y + Common.random() * getMagnitude(),
      },
      {
        x: getMagnitude() + Common.random() * getMagnitude(),
        y: getMagnitude() + Common.random() * getMagnitude(),
      }
    );
  });

  rolls ++;
});

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);
