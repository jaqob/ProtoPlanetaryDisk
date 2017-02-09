var lastTime = 0;
var count = 0;
var lastTimeCount = 0;
var fps = 0;
var zoom = 1;
var keyMap = [];
//var globalMaxMass = 0;
var maxMassObject = new Object(0, 0, 0, 0, 0);
var dT = 1;
var speed = 1;
var trackIndex = 0;
var G = 20;

var offsetDeltaX = 0;
var offsetDeltaY = 0;

var objects = [];
var c;
var ctx;

var showTracks = false;
var PIx2 = Math.PI*2


/*
var c = document.getElementById("myCanvas");
c.width  = window.innerWidth;
c.height = window.innerHeight;
var ctx = c.getContext("2d");



createProtoDisk();
calculateViewportOffset(maxMassObject);
update();
*/
function startSimulation()
{
  G = document.getElementById("inputG").value;
  var nrObjects = document.getElementById("nrObjects").value;

  var div = document.getElementById("configDiv");

  div.style.display = "none";

  c = document.getElementById("myCanvas");
  c.width  = window.innerWidth;
  c.height = window.innerHeight;
  ctx = c.getContext("2d");



  createProtoDisk(nrObjects);
  calculateViewportOffset(maxMassObject);
  update();
}

function createProtoDisk(nrObjects)
{
  var startX = 0;
  var startY = 0;

  var particle = new Object(5, startX, startY, 0, 0);
  objects.push(particle);

  for (var i = 0; i < nrObjects; i++){
    var rand = Math.random()*2*Math.PI;
    var rand2 = Math.random();
    var x = (5+200*rand2)*Math.cos(rand);
    var y = (5+200*rand2)*Math.sin(rand);
    var distance = Math.sqrt(x*x+y*y);
    var particle = new Object(Math.random(), startX+x, startY+y, -y*(distance/100000), x*(distance/100000));
    objects.push(particle);
  }
}

function update()
{
  dT = (performance.now() - lastTime)/(1000 / 60);
  lastTime = performance.now();

  //If FPS lower than 6
  if (dT > 10)
  {
    dT = 10;
  }

  count++;
  var since = performance.now() - lastTimeCount;

  if (since >= 1000)
  {
    lastTimeCount = performance.now();
    fps = count;
    count = 0;

  }
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.font = "12px Arial";
  ctx.fillStyle = "white";

  ctx.fillText("FPS: " + fps,10,10);
  ctx.fillText("Zoom level: " + (1/zoom)*100 + "%",10,20);
  ctx.fillText("Speed: " + speed + "x",10,30);
  ctx.fillText("Objects: " + objects.length,10,40);
  ctx.fillText("Maximum mass: " + Math.trunc(maxMassObject.mass),10,50);
  ctx.fillText("G: " + G,10,60);



  for (var index = 0; index < objects.length; index++)
  {
    var o = objects[index];
    var tx = (o.x/zoom+offsetDeltaX)
    var ty = (o.y/zoom+offsetDeltaY)
    if(tx < 0 || tx > c.width ||  ty < 0 || ty > c.height)
    {

    }
    else {
    ctx.beginPath();
    ctx.strokeStyle = '#FF6A6A';
    ctx.fillStyle = '#FF6A6A';
    ctx.arc(tx,ty,o.radius/zoom,0,PIx2);
    ctx.fill();
    ctx.stroke();
    ctx.closePath();


    if(o.mass > 5 && showTracks)
    {
      ctx.strokeStyle = '#FFFFFF';
      ctx.beginPath();

      for (var index2 = 0; index2 < o.trackX.length; index2++)
      {
        ctx.moveTo(o.trackX[index2%trackIndex]/zoom+offsetDeltaX, o.trackY[index2%trackIndex]/zoom+offsetDeltaY);
        ctx.lineTo(o.trackX[index2%trackIndex]/zoom+offsetDeltaX+0.4, o.trackY[index2%trackIndex]/zoom+offsetDeltaY+0.4);
      }
      ctx.closePath();
      ctx.stroke();
    }
    }

  }

  gravity();
  updatePosition(dT);

  maxMassObject = findMaxMassObject();
  globalMaxMass = maxMassObject.mass;
  calculateViewportOffset(maxMassObject);

  requestAnimationFrame(update);
}

function pausecomp(millis)
{
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}

function gravity()
{
  var tempObjects = [];
  var distance;
  var acceleration;
  for (var i = 0; i < objects.length; i++)
  {
    var o1 = objects[i];
    for (var j = 0; j < objects.length; j++) {
      var o2 = objects[j];
      if(i!=j && !o1.merged)
      {
        var dx = o2.x - o1.x;
        var dy = o2.y - o1.y;

        distance = Math.sqrt(dx*dx + dy*dy);

        if(distance<(o1.radius+o2.radius) && !o1.merged && !o2.merged)
        {
          var newObject = new Object(0,0,0,0,0);
          newObject.x=(o1.x*o1.mass+o2.x*o2.mass)/(o1.mass+o2.mass);
          newObject.y=(o1.y*o1.mass+o2.y*o2.mass)/(o1.mass+o2.mass);
          newObject.vx=(o1.vx*o1.mass+o2.vx*o2.mass)/(o1.mass+o2.mass);
          newObject.vy=(o1.vy*o1.mass+o2.vy*o2.mass)/(o1.mass+o2.mass);
          newObject.radius=Math.pow(((3*(o1.mass+o2.mass))/(4*Math.PI)),1/3);
          newObject.mass = (o1.mass+o2.mass);

          if(o1.mass > 5 || o2.mass > 5)
          {
            newObject.trackX = o1.mass > o2.mass ? o1.trackX : o2.trackX;
            newObject.trackY = o1.mass > o2.mass ? o1.trackY : o2.trackY;
          }

          o1.merged=true;
          o2.merged=true;
          tempObjects.push(newObject);
        }

        acceleration = G*o2.mass/(distance*distance);

        o1.ax+=(acceleration*(dx/distance));
        o1.ay+=(acceleration*(dy/distance));
      }
    }
  }

  for (var i = 0; i < objects.length; i++)
  {
    if(objects[i].merged)
    {
      objects.splice(i,1);
      i--;
    }
  }

  if(tempObjects.length>0)
  {
    objects.push.apply(objects, tempObjects);
  }
}

function updatePosition(dT)
{
  if(trackIndex > 1000)
  {
    trackIndex = 0;
  }

  for (var index = 0; index < objects.length; index++)
  {
    var o = objects[index];

    o.vx+=o.ax*0.0001*dT*speed;
    o.vy+=o.ay*0.0001*dT*speed;
    o.ax=0;
    o.ay=0;

    if(showTracks)
    {
    o.trackX[trackIndex] = o.x;
    o.trackY[trackIndex] = o.y;
    }

    o.x=o.x+o.vx*dT*speed;
    o.y=o.y+o.vy*dT*speed;
  }

  trackIndex++;

}

function findMaxMassObject()
{
  var maxMass = 0;

  for (var index = 0; index < objects.length; index++)
  {
    if(objects[index].mass > maxMass)
    {
      maxMass = objects[index].mass;
      maxIndex = index;
    }
  }
  return objects[maxIndex];
}


function calculateViewportOffset(object)
{
  offsetDeltaX = c.width/2 - object.x/zoom;
  offsetDeltaY = c.height/2 - object.y/zoom;
}

document.onkeyup = document.onkeydown = function (e)
{
  keyMap[e.keyCode] = e.type == 'keydown';
  //console.log("UP:" + map[38] + " DOWN:" + map[40] + " LEFT:" + map[39] + " RIGHT:" + map[37]);
  if (keyMap[38])
  {
    zoom=zoom*2;
  }

  if (keyMap[40])
  {
    zoom=zoom/2;
  }

  if (keyMap[37])
  {
    speed=speed/2;
  }

  if (keyMap[39])
  {
    speed=speed*2;
  }

  if (keyMap[67])
  {
    calculateViewportOffset(maxMassObject);
  }

  if (keyMap[84])
  {
    showTracks = !showTracks;
	
    if(showTracks)
    {
      trackIndex = 0;
      //Clear tracks
      for (var index = 0; index < objects.length; index++)
      {
        objects[index].trackX.length = 0;
        objects[index].trackY.length = 0;
      }
    }
  }
}
