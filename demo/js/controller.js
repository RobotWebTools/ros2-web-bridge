'use strict';

function WebRosController(ros, ros2dmap) {
  this.ros = ros;

  this.currentVelocity = {
    linear: {x: 0.0, y: 0.0, z: 0.0},
    angular: {x: 0.0, y: 0.0, z: 0.0}
  };
  this.zeroVelocity = {
    linear: {x: 0.0, y: 0.0, z: 0.0},
    angular: {x: 0.0, y: 0.0, z: 0.0}
  };
  this.defaultVelocity = {
    linear: {x: 0.10, y: 0.0, z: 0.0},
    angular: {x: 0.0, y: 0.0, z: 0.0}
  };

  this.pubVelTopicTimer = null;
  this.pubVelTopicInterval = 10;
  this.isRobotMoving = false;
  this.velocityTopic = new ROSLIB.Topic({
    ros: this.ros,
    name: '/cmd_vel',
    messageType: 'geometry_msgs/Twist'
  });

  this.poseX = 0;
  this.poseY = 0;
  this.radius = 0;
  this.rotation = 0;
  this.startTime = new Date();
  this.endTime = new Date();

  this.ros2dmap = ros2dmap;
  this.logger = new Logger('log');
}

WebRosController.prototype.sendVelTopic = function(vel) {
  console.log('send velocity topic');

  this.shutdownTimer();
  this.pubVelTopicTimer = setInterval(() => {

    this.velocityTopic.publish(vel);
    this.updateMap(vel);
    this.logger.showTerminalLog(vel);

    this.startTime = new Date();
  }, this.pubVelTopicInterval);
};

WebRosController.prototype.updateMap = function(vel) {
  this.endTime = new Date();

  let dt = (this.endTime - this.startTime) / 1000;

  let vx = vel.linear.x;
  let az = vel.angular.z;

  if (vx || az) {
    console.log('dt: ', dt);
    console.log('vx, az:', vx, ',', az);
  }
  let deltaX = (vx * Math.cos(this.radius)) * dt;
  let deltaY = (vx * Math.sin(this.radius)) * dt;
  let deltaRadius = az * dt;

  console.log(deltaX, deltaY, deltaRadius);

  if (deltaX || deltaY) {
    console.log('deltaX, deltaY:', deltaX, deltaY);
    this.poseX += deltaX;
    this.poseY += deltaY;
  }

  if (vx > 0) {
    this.rotation = this.radius * 180 / Math.PI;
  }

  if (az) {
    this.radius -= deltaRadius;
    this.rotation = this.radius * 180 / Math.PI;
  }


  if (deltaRadius > 0) {
    console.log('radius: ', this.radius);
  }

  if (vx || az) {
    console.log(this.poseX, ',', this.poseY, ',', this.rotation);
  }

  this.ros2dmap.update({
    y: this.poseX, x: this.poseY
  }, this.rotation - 90);
};

WebRosController.prototype.shutdownTimer = function() {
  if (this.pubVelTopicTimer) {
    clearInterval(this.pubVelTopicTimer);
    this.pubVelTopicTimer = null;
  }
};

WebRosController.prototype.moveForward = function() {
  console.log('web ros controller: move forward');
  console.log(this.currentVelocity);
  console.log(this.defaultVelocity);

  this.startTime = new Date();
  if (this.currentVelocity.linear.x > 0) {
    this.sendVelTopic(this.currentVelocity);
  } else {
    this.sendVelTopic(this.defaultVelocity);
  }
  this.isRobotMoving = true;
};

WebRosController.prototype.turnLeft = function() {
  console.log('web ros controller: turn left');

  let turnLeftMsg = {
    linear: {x: 0.0, y: 0.0, z: 0.0},
    angular: {x: 0.0, y: 0.0, z: Math.PI / 6}
  };

  this.shutdownTimer();
  this.startTime = new Date();

  this.sendVelTopic(turnLeftMsg);
};

WebRosController.prototype.turnRight = function() {
  console.log('web ros controller: turn left');

  let turnRightMsg = {
    linear: {x: 0.0, y: 0.0, z: 0.0},
    angular: {x: 0.0, y: 0.0, z: -Math.PI / 6}
  };
  this.shutdownTimer();
  this.startTime = new Date();

  this.sendVelTopic(turnRightMsg);
};

WebRosController.prototype.moveBack = function() {
  console.log('web ros controller: move back');

  console.log(this.currentVelocity);
  console.log(this.defaultVelocity);

  this.startTime = new Date();
  if (this.currentVelocity.linear.x) {
    if (this.currentVelocity.linear.x > 0) {
      this.currentVelocity.linear.x = -this.currentVelocity.linear.x;
    }
    this.sendVelTopic(this.currentVelocity);
  } else {
    let backVel = {
      linear: {x: 0.0, y: 0.0, z: 0.0},
      angular: {x: 0.0, y: 0.0, z: 0.0}
    };
    backVel.linear.x = -this.defaultVelocity.linear.x;
    this.sendVelTopic(backVel);
  }
  this.isRobotMoving = true;
};

WebRosController.prototype.start = function() {
  console.log('web ros controller: start');

  if (this.currentVelocity.linear.x) {
    this.sendVelTopic(this.currentVelocity);
  } else {
    this.currentVelocity.linear.x = -this.defaultVelocity.linear.x;
    this.sendVelTopic(this.defaultVelocity);
  }

  this.isRobotMoving = true;
};

WebRosController.prototype.stop = function() {
  console.log('web ros controller: stop');

  this.sendVelTopic(this.zeroVelocity);
  this.isRobotMoving = false;
};
