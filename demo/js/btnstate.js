'use strict';

function ButtonState() {

  this.defaultColor = 0xfffff;
  this.btnClicked = false;
  this.svgClicked = false;
}

ButtonState.prototype.clearState = function() {
  console.log('clear button state');
  let btns = document.getElementsByTagName('svg');

  for (let i = 0; i < 4; i++) {
    btns[i].style.color = '';
  }

  this.btnClicked = false;
  this.svgClicked = false;
};

ButtonState.prototype.setSvgButton = function(btnId) {
  this.clearState();

  console.log('setSVgButton');
  let btnIndexMap = {
    up: 0,
    left: 1,
    right: 2,
    down: 3
  };

  let btns = document.getElementsByTagName('svg');
  btns[btnIndexMap[btnId]].style.color = 'green';
  this.svgClicked = true;
};

ButtonState.prototype.setStartButton = function(start) {
  this.clearState();

  let btn = document.getElementById('start');
  if (start) {
    btn.style.backgroundColor = 'green';
  } else {
    btn.style.backgroundColor = '';
  }
};


