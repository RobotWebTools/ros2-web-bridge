'use strict';

function Logger(logDivId) {
  this.logDivId = logDivId;
  this.lineNum = 40;

  this.showLogHead = true;
  this.logArray = [
    '[ros2-web-bridge:Bridge] Web bridge 70325038-136b-4ecd-a633-f617676f1ff9 is created',
    '[ros2-web-bridge:Bridge] JSON command received: {"op":"subscribe","id":"subscribe:/map:1",' +
    '"type":"nav_msgs/OccupancyGrid","topic":"/map","compression":"png", ' +
    '"throttle_rate":0,"queue_length":0}',
    '[ros2-web-bridge:Bridge] subscribe a topic named /map',
    '[rclnodejs:node] Finish creating subscription, topic = /map.',
    '[ros2-web-bridge:SubscriptionManager] Subscription has been created, and the topic name is /map.',
    '[ros2-web-bridge:Bridge] Response: {"op":"set_level","level":"none"}',
    '[ros2-web-bridge:Bridge] JSON command received: {"op":"advertise","id":"advertise:/cmd_vel:2",' +
    '"type":"geometry_msgs/Twist","topic":"/cmd_vel","latch":false,"queue_size":100}',
    '[ros2-web-bridge:Bridge] advertise a topic: /cmd_vel',
    '[rclnodejs:node] Finish creating publisher, topic = /cmd_vel.',
    '[ros2-web-bridge:ResourceProvider] Publisher has been created, and the topic name is /cmd_vel.',
    '[ros2-web-bridge:Bridge] Response: {"op":"set_level","level":"none"}'
  ];
  this.count = 2;
  this.msgArrayCount = 0;
};

Logger.prototype.showTerminalLog = function(msg) {

  let msgStr = JSON.stringify(msg);
  let logMsgArray = [
    `[roslibjs] Publish sensor_msgs/Twist: ${msgStr}`,
    '[ros2-web-bridge:Bridge] JSON command received: ' +
    `{"op":"publish","id":"publish:/cmd_vel: ${this.count}","topic":"/cmd_vel", "msg": ${msgStr},"latch":false}`,
    `[ros2-web-bridge:Bridge] Publish a topic named /cmd_vel with ${msgStr}`,
    '[rclnodejs:publisher] Message of topic /cmd_vel has been published',
    '[ros2-web-bridge:Bridge] Response: {"op":"set_level","level":"none"}'
  ];

  if (msg.linear.x || msg.angular.z) {
    if (this.showLogHead) {
      for (let i = 0; i < logMsgArray.length; i++) {
        this.logArray.push(logMsgArray[i]);
      }
      this.showLogHead = false;
    } else {
      let popElement = logMsgArray[this.msgArrayCount % 5];
      this.msgArrayCount++;

      this.logArray.shift();
      this.logArray.push(popElement);
      this.count++;
    }
  }

  document.getElementById(this.logDivId).innerHTML = this.logArray.join('<br />');
};
