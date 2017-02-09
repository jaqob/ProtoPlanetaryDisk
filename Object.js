function Object(radius, x, y, vx, vy){
	this.radius = radius;
	this.x = x;				//x coordinate
	this.y = y;				//y coordinate
	this.vx = vx;			//x component of velocity
	this.vy = vy;			//y component of velocity
	this.ax = 0;
	this.ay = 0;
	this.mass = 4/3*Math.PI*Math.pow(radius,3);
	this.merged=false;
	this.trackX = [];
	this.trackY = [];
	this.trackIndex = 0;

}
