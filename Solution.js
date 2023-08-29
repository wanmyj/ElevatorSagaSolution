// this solution is based on https://github.com/magwo/elevatorsaga/wiki/Basic-Solution

{
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
      // 
      console.log("destinationQueue");
      elevators.forEach(elevator => {
        console.log(elevator.destinationQueue.join(' '));
      });

      console.log("Down Numbers");
      const downs = floors.filter(floor => floor.buttonStates.down);
      const floorNums = downs.map(floor => floor.floorNum());
      console.log(floorNums.join(' '));
    }

    floors.forEach(function (floor) {
      floor.on("up_button_pressed down_button_pressed", function () {
        // find an idle elevator if possible
        printInfo("Floor Button Pressed on " + floor.floorNum());
        let choice = findIdle(floor.floorNum());
        if (choice.length) {
          choice[0].goToFloor(floor.floorNum());
        }
      });
    });

    elevators.forEach(function (elevator, index) {
      // add an identifier to each elevator
      elevator.id = index;

      // event if elevator is doing nothing...
      elevator.on("idle", function () {

        // see if any floors have buttons pressed
        // TODO: choose better
        let demand = floors.filter((floor) => (floor.buttonStates.up || floor.buttonStates.down));

        // choose the first one
        if (demand.length) {
          target = demand[0].floorNum();
        } else {
          target = 0;
        }

        elevator.goToFloor(target);
      });

      // floor button pressed in elevator
      elevator.on("floor_button_pressed", function (floorNum) {
        let target = floorNum;
        elevator.goToFloor(target);
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
        // do something here
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

  }
    ,

  update: function (dt, elevators, floors) {
    // We normally don't need to do anything here
  }
}
