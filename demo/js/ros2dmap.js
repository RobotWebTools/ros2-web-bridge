'use strict';

function Ros2dMap(ros, options) {

  let divName = options.divName || 'ros2dmap';
  let width = options.width || 400;
  let height = options.height || 400;

  let oldPose = {x: 0.0, y: 0.0};
  let center = {x: 0.5, y: 0.5};

  // The ROS2D.Viewer is a 2D scene manager with additional ROS functionality.
  let viewer2D = new ROS2D.Viewer({
    divID: divName,
    width: width,
    height: height,
    background: '#99ffff'
  });

  this.gridClient = new ROS2D.OccupancyGridClient({
    ros: ros,
    rootObject: viewer2D.scene
  });

  let grid = new ROS2D.Grid({
    size: 100,
    cellSize: 0.10
  });
  this.gridClient.rootObject.addChild(grid);

  let robotMaker = new ROS2D.NavigationArrow({
    size: 4,
    strokeSize: 0.5,
    fillColor: createjs.Graphics.getRGB(0xcc, 0, 0xff, 0.62),
    pulse: false
  });
  this.gridClient.rootObject.addChild(robotMaker);

  viewer2D.scaleToDimensions(1, 1);
  viewer2D.shift(-center.x, -center.y);

  robotMaker.x = 0;
  robotMaker.y = 0;
  robotMaker.scaleX = 0.01;
  robotMaker.scaleY = 0.01;
  robotMaker.rotation = -90;
  robotMaker.visible = true;

  this.update = function(pose, rotation) {
    robotMaker.x = pose.x;
    robotMaker.y = -pose.y;

    // robotMaker.rotation = viewer2D.scene.rosQuaternionToGlobalTheta(orientation);
    robotMaker.rotation = rotation;
    if (oldPose.x !== pose.x || oldPose.y !== pose.y) {
      viewer2D.shift(-oldPose.x + pose.x, -oldPose.y + pose.y);
      oldPose = pose;
    }
  };
}
