
{
  // this solution is based on https://github.com/magwo/elevatorsaga/wiki/Basic-Solution
  init: function (elevators, floors) {
    console.clear();
    const weight = 0.3;
    const maxFloor = floors.length - 1;

    let distance = function (elevator, floorNum) {
      return Math.abs(elevator.currentFloor() - floorNum);
    }

    let findIdle = function (floorNum) {
      return elevators.filter((elevator) => (elevator.destinationQueue.length == 0))
        .sort((a, b) => (distance(a, floorNum) - distance(b, floorNum)));
    };

    // https://github.com/akadrac/elevatorsaga/blob/master/solution.js
    function sortQueue(elevator) {
      elevator.destinationQueue.sort(function(a, b){return a-b});
      if (elevator.currentFloor() > elevator.destinationQueue[0]) {
        elevator.destinationQueue.sort(function(a, b){return b-a});
      }
    }
    
    let printInfo = function printArgs(...args) {
      printInfo.count = (printInfo.count || 0) + 1;
      console.log(printInfo.count);
      console.log("Event: " + args.join(' '));

      // elevator is going up or down
      // Current Elevator Floor
      const currentFloors = elevators.map(elevator => elevator.currentFloor());
      console.log(currentFloors.join(' '));

      // Current destinationQueue
      // Floor of Up button pressed
      // Floor of Dn button pressed
      console.log("destinationQueue");
      elevators.forEach(elevator => {
        console.log(elevator.destinationQueue.join(' '));
      });

      console.log("Down Numbers");
      const downs = floors.filter(floor => floor.buttonStates.down);
      const floorNums = downs.map(floor => floor.floorNum());
      console.log(floorNums.join(' '));
    };

    floors.forEach(function (floor) {
      floor.on("up_button_pressed down_button_pressed", function () {
        // 如果在某个电梯的queue里，且方向一致，直接返回
        // 如果上下两层之内有电梯即将到达，而且满载率小于0.7，则由它来接乘客
        // 如果在某个电梯的queue里，由这个电梯来接


        // 否则找个空的，find an idle elevator if possible，走idleArrange的处理
        printInfo("Floor Button Pressed on " + floor.floorNum());
        let choice = findIdle(floor.floorNum());
        if (choice.length) {
          choice[0].goToFloor(floor.floorNum());
        }
        // 如果也没有空的，找一个没有满载，且最近方向一致的到达，来接
      });
    });

    elevators.forEach(function (elevator, index) {
      // add an identifier to each elevator
      elevator.id = index;

      // event if elevator is doing nothing...
      elevator.on("idle", function () {
        // 实际上不用管了，floor press会处理好

        // see if any floors have buttons pressed
        // TODO: choose better
        // let demand = floors.filter((floor) => (floor.buttonStates.up || floor.buttonStates.down));

        // // choose the first one
        // if (demand.length) {
        //   target = demand[0].floorNum();
        // } else {
        //   target = 0;
        // }

        // elevator.goToFloor(target);
      });

      // floor button pressed in elevator
      elevator.on("floor_button_pressed", function (floorNum) {
        // 在这里要sort一下，类似这样
        elevator.destinationQueue.push(floorNum);
        sortQueue(elevator);
        elevator.checkDestinationQueue();
        // let target = floorNum;
        // elevator.goToFloor(target);
      });


      elevator.on("passing_floor", function (floorNum, direction) {
        let floor = floors[floorNum];
        let pressed = elevator.getPressedFloors();
        let stop = floor.buttonStates[direction] && elevator.loadFactor() < weight;
        // if we're going in the same direction as the button, we can stop
        if (stop || (pressed.indexOf(floorNum) >= 0)) {
          // remove this floor from destinations
          elevator.destinationQueue = elevator.destinationQueue.filter((d) => (d !== floorNum));
          // no need to checkDestinationQueue as done in here...
          elevator.goToFloor(floorNum, true);
        }

      });
      elevator.on("stopped_at_floor", function (floorNum) {
        // 只需要表明上下就好，note：电梯只有在方向一致的时候才会停
        // control up and down indicators
        // TODO: control up down indicators better
        switch (floorNum) {
          case 0:
            up = true;
            down = false;
            break;
          case maxFloor:
            up = false;
            down = true;
            break;
          default:
            up = true;
            down = true;
            break;
        }
        elevator.goingUpIndicator(up);
        elevator.goingDownIndicator(down)
      });
    });

    let idleArrange = function() {
      // Get the queue for all elevators
      // find a the nearest pressed floor but not on the other elevator's queue
      // Go there
    }
  }
    ,

  update: function (dt, elevators, floors) {
    // We normally don't need to do anything here
  }
}
