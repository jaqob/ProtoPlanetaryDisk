'use strict';
var lastTime = 0;
var count = 0;
var lastTimeCount = 0;
var fps = 0;
var zoom = 1;
var keyMap = [];
var maxMassObject = new Object(0, 0, 0, 0, 0);
var dT = 1;
var speed = 1;
var G = 20;

var offsetDeltaX = 0;
var offsetDeltaY = 0;

var objects = [];
var c;
var ctx;

var showTracks = false;
var PIx2 = Math.PI * 2;
var avgSpeed;
var centerObjectIndex;
var objectInFocus = new Object(0, 0, 0, 0, 0);
var started = false;


function startSimulation()
{
    G = document.getElementById("inputG").value;
    var nrObjects = document.getElementById("nrObjects").value;
    avgSpeed = document.getElementById("avgSpeed").value / 10000;

    var div = document.getElementById("configDiv");

    div.style.display = "none";

    c = document.getElementById("myCanvas");
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    ctx = c.getContext("2d");

    createProtoDisk(nrObjects, avgSpeed);
	
	        //objects.push(new Object(18, 0, 0, 0, 0));
	        //objects.push(new Object(9, 200, 200, -1, 0));
			//objects.push(new Object(4, 400, 100, -1, 0));

	
	
    objectInFocus = findMaxMassObject();
    objectInFocus.color = '#FFFFFF';
    calculateViewportOffset(objectInFocus);
    started = true;
		
    update();
}

function createProtoDisk(nrObjects, avgSpeed)
{
    var startX = 0;
    var startY = 0;

    objects.push(new Object(5, startX, startY, 0, 0));

    for (var i = 0; i < nrObjects; i++)
    {
        var rand = Math.random() * 2 * Math.PI;
        var rand2 = Math.random();
        var x = (5 + 200 * rand2) * Math.cos(rand);
        var y = (5 + 200 * rand2) * Math.sin(rand);
        var distance = Math.sqrt(x * x + y * y);
        objects.push(new Object(Math.random(), startX + x, startY + y, -y * (Math.pow(distance,-1/2)) * avgSpeed, x * (Math.pow(distance,-1/2)) * avgSpeed));
    }
}

function update()
{	
    dT = (performance.now() - lastTime) / (1000 / 60);
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

    ctx.fillText("FPS: " + fps, 10, 10);
    ctx.fillText("Zoom level: " + (1 / zoom) * 100 + "%", 10, 20);
    ctx.fillText("Speed: " + speed + "x", 10, 30);
    ctx.fillText("Objects: " + objects.length, 10, 40);
    ctx.fillText("Maximum mass: " + Math.trunc(maxMassObject.mass), 10, 50);
    ctx.fillText("G: " + G, 10, 60);

    for (var index = 0; index < objects.length; index++)
    {
        var o = objects[index];
        var tx = Math.trunc((o.x / zoom + offsetDeltaX));
        var ty = Math.trunc((o.y / zoom + offsetDeltaY));
        if (tx < 0 || tx > c.width || ty < 0 || ty > c.height)
        {}
        else
        {
            ctx.beginPath();
            ctx.strokeStyle = o.color;
            ctx.fillStyle = o.color;
            ctx.arc(tx, ty, o.radius / zoom, 0, PIx2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();

            if (o.mass > 5 && showTracks)
            {
                ctx.strokeStyle = '#FFFFFF';
                ctx.beginPath();
				if(false)
				{
                for (var index2 = 0; index2 < o.trackX.length-1; index2++)
                {
                    ctx.moveTo(Math.trunc(o.trackX[index2] / zoom + offsetDeltaX), Math.trunc(o.trackY[index2] / zoom + offsetDeltaY));
                    ctx.lineTo(Math.trunc(o.trackX[index2+1] / zoom + offsetDeltaX), Math.trunc(o.trackY[index2+1] / zoom + offsetDeltaY));
                }
				}
				else
				{
					
				for (var index2 = 0; index2 < o.trackX.length-1; index2++)
				{							
					var tempTrackOffsetX1 = (objectInFocus.trackX[index2]-objectInFocus.x)/zoom;
					var tempTrackOffsetY1 = (objectInFocus.trackY[index2]-objectInFocus.y)/zoom;
					var tempTrackOffsetX2 = (objectInFocus.trackX[index2+1]-objectInFocus.x)/zoom;
					var tempTrackOffsetY2 = (objectInFocus.trackY[index2+1]-objectInFocus.y)/zoom;

					ctx.moveTo(Math.trunc(o.trackX[index2] / zoom + offsetDeltaX)-tempTrackOffsetX1, Math.trunc(o.trackY[index2] / zoom + offsetDeltaY)-tempTrackOffsetY1);
                    ctx.lineTo(Math.trunc(o.trackX[index2+1] / zoom + offsetDeltaX)-tempTrackOffsetX2, Math.trunc(o.trackY[index2+1] / zoom + offsetDeltaY)-tempTrackOffsetY2);
			}}
                ctx.closePath();
                ctx.stroke();
            }
        }

    }
    gravity();
    updatePosition(dT);

    maxMassObject = findMaxMassObject();

    calculateViewportOffset(objectInFocus);

    requestAnimationFrame(update);
}

function pausecomp(millis)
{
    var date = new Date();
    var curDate = null;
    do
    {
        curDate = new Date();
    }
    while (curDate - date < millis);
}

function gravity()
{
    var tempObjects = [];
    var distance;
    var acceleration;
    var dx,
    dy,
    o1,
    o2;

    //Uneccesary optimization
    var objectsLength = objects.length;

        for (var i = 0; i < objectsLength; i++)
        {
            o1 = objects[i];
            for (var j = 0; j < objectsLength; j++)
            {
                o2 = objects[j];
                if (i != j && !o1.merged)
                {
                    dx = (o2.x - o1.x);
                    dy = (o2.y - o1.y);
                    distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < (o1.radius + o2.radius) && !o1.merged && !o2.merged)
                    {
                        createNewObject(o1, o2, tempObjects);
                    }

                    acceleration = G * o2.mass / (distance * distance);
                    o1.ax += (acceleration * (dx / distance));
                    o1.ay += (acceleration * (dy / distance));
                }
            }
        }
        for (var i = 0; i < objects.length; i++)
        {
            if (objects[i].merged)
            {
                objects.splice(i, 1);
                i--;
            }
        }

        if (tempObjects.length > 0)
        {
            objects.push.apply(objects, tempObjects);
        }
}

function createNewObject(o1, o2, tempObjects)
{
    var newObject = new Object(0, 0, 0, 0, 0);
    newObject.mass = o1.mass + o2.mass;
    newObject.x = (o1.x * o1.mass + o2.x * o2.mass) / (newObject.mass);
    newObject.y = (o1.y * o1.mass + o2.y * o2.mass) / (newObject.mass);
    newObject.vx = (o1.vx * o1.mass + o2.vx * o2.mass) / (newObject.mass);
    newObject.vy = (o1.vy * o1.mass + o2.vy * o2.mass) / (newObject.mass);
    newObject.radius = Math.pow(((3 * (newObject.mass)) / (4 * Math.PI)), 1 / 3);

    if (o1.mass > 5 || o2.mass > 5)
    {
        newObject.trackX = o1.mass > o2.mass ? o1.trackX : o2.trackX;
        newObject.trackY = o1.mass > o2.mass ? o1.trackY : o2.trackY;
    }
    if (o1 == objectInFocus || o2 == objectInFocus)
    {
        objectInFocus = newObject;
        objectInFocus.color = '#FFFFFF';
    }

    o1.merged = true;
    o2.merged = true;
    tempObjects.push(newObject);
}

function updatePosition(dT)
{
    for (var index = 0; index < objects.length; index++)
    {
        var o = objects[index];

        o.vx += o.ax * 0.0001 * dT * speed;
        o.vy += o.ay * 0.0001 * dT * speed;
        o.ax = 0;
        o.ay = 0;

        if (showTracks && count%4==0)
        {			
			o.trackX.push(o.x);
            o.trackY.push(o.y);
			if(o.trackX.length > 1000)
			{
				o.trackX.shift();
				o.trackY.shift();
			}
        }

        o.x = o.x + o.vx * dT * speed;
        o.y = o.y + o.vy * dT * speed;
    }
}

function findMaxMassObject()
{
    var maxMass = 0;
    var maxIndex = 0;

    for (var index = 0; index < objects.length; index++)
    {
        if (objects[index].mass > maxMass)
        {
            maxMass = objects[index].mass;
            maxIndex = index;
        }
    }
    return objects[maxIndex];
}

function calculateViewportOffset(object)
{
    offsetDeltaX = c.width / 2 - object.x / zoom;
    offsetDeltaY = c.height / 2 - object.y / zoom;
}

document.onmousedown = function (e)
{

    if (!started)
    {
        return;
    }

    objectInFocus.color = '#FF6A6A';

    var minDist = 3000;
    var minIndex = 0;

    for (var index = 0; index < objects.length; index++)
    {
        objects[index].color = '#FF6A6A';
        var dx = (e.clientX - offsetDeltaX - objects[index].x / zoom);
        var dy = (e.clientY - offsetDeltaY - objects[index].y / zoom);
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDist)
        {
            minDist = distance;
            minIndex = index;
        }
    }

    objectInFocus = objects[minIndex];
    objectInFocus.color = '#FFFFFF';
}

document.onkeyup = document.onkeydown = function (e)
{
    keyMap[e.keyCode] = e.type == 'keydown';
    if (keyMap[38])
    {
        zoom = zoom * 2;
    }

    if (keyMap[40])
    {
        zoom = zoom / 2;
    }

    if (keyMap[37])
    {
        speed=speed/2;
    }

    if (keyMap[39])
    {
        speed = speed * 2;
    }

    if (keyMap[67])
    {
        objectInFocus.color = '#FF6A6A';
        objectInFocus = findMaxMassObject();
        objectInFocus.color = '#FFFFFF';
        calculateViewportOffset(objectInFocus);
    }

    if (keyMap[84])
    {
        showTracks = !showTracks;

        if (showTracks)
        {
            //Clear tracks
            for (var index = 0; index < objects.length; index++)
            {
                objects[index].trackX.length = 0;
                objects[index].trackY.length = 0;
            }
        }
    }
};
