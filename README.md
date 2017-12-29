# ros2-web-bridge[![Build Status](https://travis-ci.org/RobotWebTools/ros2-web-bridge.svg?branch=develop)](https://travis-ci.org/RobotWebTools/ros2-web-bridge)[![npm](https://img.shields.io/npm/dt/ros2-web-bridge.svg)](https://www.npmjs.com/package/ros2-web-bridge)[![license](https://img.shields.io/github/license/RobotWebTools/ros2-web-bridge.svg)](https://github.com/RobotWebTools/ros2-web-bridge/blob/develop/LICENSE)

[![NPM](https://nodei.co/npm/ros2-web-bridge.png)](https://nodei.co/npm/ros2-web-bridge/)

## Server Implementations of the rosbridge v2 Protocol

ros2-web-bridge, which leverages the [rclnodejs](https://github.com/RobotWebTools/rclnodejs) client, provides a JSON interface to [ROS 2.0](https://github.com/ros2/ros2/wiki) by adopting the [rosbridge v2 protocol](https://github.com/RobotWebTools/rosbridge_suite/blob/develop/ROSBRIDGE_PROTOCOL.md). The bridge can process commands through JSON tuneled on WebSockets.

## Clients

A client is a program that communicates with ros2-web-bridge using its JSON API. Clients include:

* [roslibjs](https://github.com/RobotWebTools/roslibjs) - A JavaScript API, which communicates with ros2-web-bridge over WebSockets.

## Install

```javascript
npm install
```

## Run Examples

1.Start `ros2-web-bridge` module:

```bash
node bin/rosbridge.js
```

2.Start the [express](https://www.npmjs.com/package/express) server:

```bash
cd examples && node index.js
```

3.Open your browser, and navigate to URL:

``` bash
http://localhost:3000/html/publisher.html
```

## Known Issues

For the latest release of roslibjs ([0.19.0](https://github.com/RobotWebTools/roslibjs/releases/tag/0.19.0)), when sending command `call_service` to request the service, the type of service is not included which is a necessary parameter for ROS 2.0. So you have to transfer both the request and the type of service through `args`, please reference the code below:

```JavaScript
let addTwoInts = new ROSLIB.Service({
  ros : ros,
  name : '/add_two_ints',
  serviceType : 'example_interfaces/AddTwoInts'
});

let request = new ROSLIB.ServiceRequest({
  a : 1,
  b : 2
});

let args = {request: request, type: 'example_interfaces/AddTwoInts'};
addTwoInts.callService(args, function(result) {
  console.log(`Receive result: ${result.sum}`);
});
```

## License

This project abides by [Apache License 2.0](https://github.com/RobotWebTools/ros2-web-bridge/blob/develop/LICENSE).
