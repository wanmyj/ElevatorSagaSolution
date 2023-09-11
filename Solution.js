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
      // 去除紧邻的重复数字
      for (let i = elevator.destinationQueue.length - 1; i > 0; i--) {
        if (elevator.destinationQueue[i] === elevator.destinationQueue[i - 1]) {
            elevator.destinationQueue.splice(i, 1);
        }
      }
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

    // 这个函数应该在————————————时候被call
    function getDirectionWhenPassFloor(elevator, floor) {
      const floorNum = floor.floorNum();
      const queue = elevator.destinationQueue();

      if (queue.includes(floorNum)) {
        // 如果目标楼层在队列中
        if (queue.indexOf(floorNum) === queue.length - 1) { return "idel"};
        const nextFloor = queue[queue.indexOf(floorNum) + 1];
        if (nextFloor > floorNum) { return "up"; }
        else { return "down"; }
      } else {
        // 如果目标楼层不在队列中
        if (queue.length === 0) {
          // 如果队列为空，电梯当前处于空闲状态
          return "idel";
        } else {
          // 队列不为空
          // 如果floorNum大于等于queue的最大值，返回下，或者小于等于queue的最小值，则返回上
          // 如果queue里的数字小于queue的最大值且大于最小值，则返回第一次经过此floorNum时的方向 
          // 比如队列是 [1,2,4], floorNum 是3, 返回up
          // 比如队列是 [3,5,2], floorNum 是4, 返回up
          // 比如队列是 [3,5,1], floorNum 是2, 返回down
          const maxQueueFloor = Math.max(...queue);
          const minQueueFloor = Math.min(...queue);

          if (floorNum >= maxQueueFloor) {
            return "down";
          } else if (floorNum <= minQueueFloor) {
            return "up";
          } else {
            for (let i = 0; i < queue.length - 1; i++) {
              if ((queue[i] > floorNum && queue[i + 1] < floorNum) ||
                (queue[i] < floorNum && queue[i + 1] > floorNum)) {
                return queue[i] > floorNum ? "down" : "up";
              }
            }
          }
        }
      }
    };

    function findElevatorsStoppedAtFloor(floor, recorder) {
      let foundElevators = elevators.filter((elevator) => (elevator.destinationQueue.includes(floor.floorNum())));
      if (foundElevators.count === 0) return foundElevators;

      foundElevators = foundElevators.filter((elevator) => {
        let dir = getDirectionWhenPassFloor(elevator, floor);
        if (dir == "idel") { return true; }
        if (dir == "up" && recorder["up"]) {return true; }
        if (dir == "down" && recorder["down"]) {return true; }
        return false;
      })
    }
    
    floors.forEach(function (floor) {
      let recorder = {
        "up": false,
        "down": false
      }
      floor.on("up_button_pressed", function () {
        recorder["up"] = true;
      });
      floor.on("down_button_pressed", function () {
        recorder["down"] = true;
      });

      // 如果在某个电梯的queue里，且方向一致，由这个电梯来接，如果有多个，则找满载率最小*距离最近的
      let elevatorsWithThisFloor = findElevatorsStoppedAtFloor(floor, recorder);
      if (elevatorsWithThisFloor.length > 0) {
        return elevatorsWithThisFloor.reduce((bestElevator, elevator) => {
          let loadFactor1 = bestElevator.loadFactor();
          let loadFactor2 = elevator.loadFactor();
          let distance1 = distance(bestElevator, floor.floorNum());
          let distance2 = distance(elevator, floor.floorNum());
          let value1 = loadFactor1 * distance1;
          let value2 = loadFactor2 * distance2;
      
          if (value1 < value2) {
            return bestElevator;
          } else {
            return elevator;
          }
        })
      }

      // 如果它比某部电梯的queue最大值都大，且此电梯向上运动，找出最近的一部电梯，它来接
      // 如果它比某部电梯的queue最小值都小，且此电梯向下运动，找出最近的一部电梯，它来接
      function findElevatorWithMinDistance(elevators, targetNumber) {
        const satisfiedElevators = new Map();
      
        for (const elevator of elevators) {
          const destinationQueue = elevator.destinationQueue;
          if (destinationQueue.length > 0) {
            const maxQueueValue = Math.max(...destinationQueue);
            const minQueueValue = Math.min(...destinationQueue);
      
            // Check if the elevator's queue meets the conditions
            if (maxQueueValue < targetNumber || minQueueValue > targetNumber) {
              const distance = Math.abs(maxQueueValue - targetNumber);
              satisfiedElevators.set(elevator, distance);
            }
          }
        }
      
        if (satisfiedElevators.size === 0) {
          return null; // No elevators satisfy the conditions
        }
      
        // Sort the satisfied elevators by distance and then by load factor
        const sortedElevators = Array.from(satisfiedElevators.keys()).sort((elevator1, elevator2) => {
          const distance1 = satisfiedElevators.get(elevator1);
          const distance2 = satisfiedElevators.get(elevator2);
          if (distance1 !== distance2) {
            return distance1 - distance2;
          } else {
            return elevator1.loadFactor() - elevator2.loadFactor();
          }
        });
      
        // Return the elevator with the minimum distance and, if there are ties, the minimum load factor
        return sortedElevators[0];
      }
      // 如果上下两层之内有电梯即将到达（路过电梯），而且满载率小于0.7，则由它来接乘客
      elevators.forEach(elevator => {
        if (elevator.loadFactor() <= 0.7) {
          onFloorNum = elevator.currentFloor();
          if (onFloorNum >= floorNum && onFloorNum <= floorNum + 2 && getDirectionWhenPassFloor(elevator, floor) != "down") { return elevator;}
          if (onFloorNum <= floorNum && onFloorNum >= floorNum - 2 && getDirectionWhenPassFloor(elevator, floor) != "up") { return elevator;}
        }
      })
      // 否则找个空的，find an idle elevator if possible，
      let choice = findIdle(floor.floorNum());
      if (choice.length) {
        choice[0].goToFloor(floor.floorNum());
      }
      // 如果在某个电梯的queue里，由这个电梯来接
      elevators.forEach(elevator => {
        if (elevator.destinationQueue().includes(floorNum)) {
          elevator.destinationQueue.push(floorNum);
          sortQueue(elevator);
          elevator.checkDestinationQueue();
        }
      })
      // 如果也没有空的，找一个没有满载，且方向一致的最近到达，来接

      let mergedQueue = new Set();
      elevators.forEach(elevator => {
        // 遍历每个电梯并将其目标楼层添加到合并队列中
          const destinationQueue = elevator.destinationQueue();
          destinationQueue.forEach(floor => {
              mergedQueue.add(floor);
          });
      });
      if (mergedQueue.has(desiredNumber)) return;

      printInfo("Floor Button Pressed on " + floor.floorNum());

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
        // 这个event应该没什么卵用，在floor的Button Pressed事件中已经都处理了
        // passing floor停不停，完全看floor的event里给哪个电梯加上了queue

        // let floor = floors[floorNum];
        // let pressed = elevator.getPressedFloors();
        // let stop = floor.buttonStates[direction] && elevator.loadFactor() < weight;
        // // if we're going in the same direction as the button, we can stop
        // if (stop || (pressed.indexOf(floorNum) >= 0)) {
        //   // remove this floor from destinations
        //   elevator.destinationQueue = elevator.destinationQueue.filter((d) => (d !== floorNum));
        //   // no need to checkDestinationQueue as done in here...
        //   elevator.goToFloor(floorNum, true);
        }

      });
      elevator.on("stopped_at_floor", function (floorNum) {
        // 只需要表明上下就好，note：如果没有在电梯队列里，电梯只有在方向一致的时候才会停
        // 通过queue的下一站来确定是上还是下。
        // 如果queue为空，则按照TODO逻辑选方向
        // 如果向上有电梯来接，则只显示向下
        // 如果向下有电梯来接，则只显示向上
        // 

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
      // Find all idle elevators
      // find a the nearest elecator to go here
    };
  }
    ,

  update: function (dt, elevators, floors) {
    // We normally don't need to do anything here
  }
}
