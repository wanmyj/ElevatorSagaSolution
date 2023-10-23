{
  // this solution is based on https://github.com/magwo/elevatorsaga/wiki/Basic-Solution
  init: function (elevators, floors) {
    console.clear();
    const weight = 0.3;
    const maxFloor = floors.length - 1;
    elevators.forEach( elevator => {
      elevator.force_updown = new Array(floors.length).fill(false)
      elevator.lastStop = 0;
      elevator.lastLastStop = 100;
    })

    floors.forEach( floor => {
      floor.recorder = {
        "up": false,
        "down": false
      }
    })

    let distance = function (elevator, floorNum) {
      return Math.abs(elevator.currentFloor() - floorNum);
    };

    let findIdle = function (floorNum) {
      return elevators.filter((elevator) => (elevator.destinationQueue.length == 0))
        .sort((a, b) => (distance(a, floorNum) - distance(b, floorNum)));
    };

    function getCurrentDirection(elevator) {
      curr = elevator.currentFloor()
      prev = elevator.lastStop
      if (elevator.destinationQueue.length == 0) {
        if (prev == curr) return 'idle'
        if (prev > curr) return 'down'
        if (prev < curr) return 'up'
      }
      next = elevator.destinationQueue[0]
      if (next == curr) return 'idle'
      if (next < curr) return 'down'
      if (next > curr) return 'up'
    }
    // https://github.com/akadrac/elevatorsaga/blob/master/solution.js
    function sortQueue(elevator) {
      let dir = getCurrentDirection(elevator);

      // 去除重复数字
      const uniqueSet = new Set(elevator.destinationQueue);
      elevator.destinationQueue = Array.from(uniqueSet);


      let  isStayCurrentFloor = false
      onFloorNum = elevator.currentFloor();
      if (onFloorNum == elevator.destinationQueue[0]) isStayCurrentFloor = true;

      const UpFloor = elevator.destinationQueue.filter((num) => num > onFloorNum);
      const DownFloor = elevator.destinationQueue.filter((num) => num < onFloorNum);
      
      UpFloor.sort((a, b) => a - b);
      DownFloor.sort((a, b) => b - a);

      // dir would nerver be idle as it has been pushed
      if (dir == "down" ) {
        console.info("going down")
        if (isStayCurrentFloor) DownFloor.unshift(onFloorNum);
        elevator.destinationQueue = DownFloor.concat(UpFloor) 
        return;
      }
      if (dir == "up") {
        console.info("going up")
        if (isStayCurrentFloor) UpFloor.unshift(onFloorNum)
        elevator.destinationQueue = UpFloor.concat(DownFloor) 
        return;
      }
      throw "idle ERROR"
    };

    // Put the floor in elevator's queue 
    // TODO: usd prototype to add method to elevator object
    function putFloorIntoElevatorQueue(elevator, floorNum) {
      // 有时候会一直停在某一层
      let queuebefore = [...elevator.destinationQueue]
      if (elevator.lastStop === floorNum) {
        elevator.goToFloor(floorNum)
        console.info(`Previous Queue is: ${queuebefore}, then ${elevator.destinationQueue}, push to tail`)
        return;
      }
      elevator.destinationQueue.push(floorNum);
      sortQueue(elevator);

      elevator.checkDestinationQueue();
      console.info(`[${elevator.destinationQueue}] = [${queuebefore}] + ${floorNum}, curr floor is ${elevator.currentFloor()} `)
    };
    // 这个函数应该在————————————时候被call
    function getDirectionWhenPassFloor(elevator, floorNum) {
      const queue = elevator.destinationQueue;

      if (queue.includes(floorNum)) {
        // 如果目标楼层在队列中
        if (queue.indexOf(floorNum) === queue.length - 1) { return "idle"};
        const nextFloor = queue[queue.indexOf(floorNum) + 1];
        if (nextFloor > floorNum) { return "up"; }
        else { return "down"; }
      } else {
        // 如果目标楼层不在队列中
        if (queue.length === 0) {
          // 如果队列为空，电梯当前处于空闲状态
          return "idle";
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
        let dir = getDirectionWhenPassFloor(elevator, floor.floorNum());
        if (dir == "idle") { return true; }
        if (dir == "up" && recorder["up"]) {return true; }
        if (dir == "down" && recorder["down"]) {return true; }
        return false;
      })
      return foundElevators
    };
    
    function findElevatorWithMinDistance(targetNumber) {
      const satisfiedElevators = new Map();
    
      for (const elevator of elevators) {
        console.log("elevator.loadFactor() is " + elevator.loadFactor());
        if (elevator.loadFactor() == 1) {
          continue;
        } 
          
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
    
      if (satisfiedElevators.length === 0) {
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
    };

    function findElevatorWithPassingbyAndLoadFactor(floorNum) {
      elevators.forEach(elevator => {
        if (elevator.loadFactor() <= 0.7) {
          onFloorNum = elevator.currentFloor();
          if (onFloorNum >= floorNum && onFloorNum <= floorNum + 2 && getDirectionWhenPassFloor(elevator, floorNum) != "down") { return elevator;}
          if (onFloorNum <= floorNum && onFloorNum >= floorNum - 2 && getDirectionWhenPassFloor(elevator, floorNum) != "up") { return elevator;}
        }
      })
      return null
    }

    function selectElevatorToPickUp(floor, dir) {
      const floorNum = floor.floorNum()
      // 如果在某个电梯的queue里，且方向一致，由这个电梯来接，如果有多个，则找满载率最小*距离最近的
      let elevatorsWithThisFloor = findElevatorsStoppedAtFloor(floor, floor.recorder);
      if (elevatorsWithThisFloor.length > 0) {
        const resultElevator = elevatorsWithThisFloor.reduce((bestElevator, elevator) => {
          let loadFactor1 = bestElevator.loadFactor();
          let loadFactor2 = elevator.loadFactor();
          let distance1 = distance(bestElevator, floorNum);
          let distance2 = distance(elevator, floorNum);
          let value1 = loadFactor1 * distance1;
          let value2 = loadFactor2 * distance2;
          if (value1 < value2) {
            return bestElevator
          } else {
            return elevator
          }
        })
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dir] = false
        console.info("mode 1")
        return;
      }

      // 如果它比某部电梯的queue最大值都大，且此电梯向上运动，找出最近的一部电梯，它来接
      // 如果它比某部电梯的queue最小值都小，且此电梯向下运动，找出最近的一部电梯，它来接
      let resultElevator = findElevatorWithMinDistance(floorNum)
      if (resultElevator != null) {
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dir] = false
        console.info("mode 2")
        return;
      }
  
      // 如果上下两层之内有电梯即将到达（路过电梯），而且满载率小于0.7，则由它来接乘客
      resultElevator =  findElevatorWithPassingbyAndLoadFactor(floorNum)
      if (resultElevator != null) {
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dir] = false
        console.info("mode 3")
        return;
      }

      // 找个空的，find an idle elevator if possible，
      let choice = findIdle(floorNum);
      if (choice.length) {
        resultElevator = choice[0]
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dir] = false
        console.info("mode 4")
        return;
      }

      // 如果在某个电梯的queue里，由这个电梯来接
      for (elevator of elevators) {
        if (elevator.destinationQueue.includes(floorNum)) {
          // TODO_em: 强制到达时打开双向箭头
          elevator.force_updown[floorNum] = true
          floor.recorder[dir] = false
          console.info("mode 5")
          return;
        }
      }

      // 如果也没有空的，找一个满载率最低的电梯
      resultElevator = elevators.reduce((bestElevator, elevator) => {
        let loadFactor1 = bestElevator.loadFactor();
        let loadFactor2 = elevator.loadFactor();
        if (loadFactor1 < loadFactor2) {
          return bestElevator
        } else {
          return elevator
        }
      })
      putFloorIntoElevatorQueue(resultElevator, floorNum)
      floor.recorder[dir] = false
      console.info("mode 6")
      return;
    };

    floors.forEach(function (floor) {
      const floorNum = floor.floorNum();

      floor.on("up_button_pressed", function () {
        floor.recorder["up"] = true;
        console.log(`%cOutside Up Button pressed At floor ${floorNum}`,
        'background: #222; color: #ba385b')
        selectElevatorToPickUp(floor, 'up')
      });
      floor.on("down_button_pressed", function () {
        floor.recorder["down"] = true;
        console.log(`%cOutside Down Button pressed At floor ${floorNum} `,
        'background: #222; color: #ba385b')
        selectElevatorToPickUp(floor, 'down')
      });

    });

    elevators.forEach(function (elevator, index) {

      elevator.on("floor_button_pressed", function (floorNum) {
        console.log(`%cInside floor button pressed on ${floorNum} `,
                    'background: #222; color: #bada55')
        putFloorIntoElevatorQueue(elevator, floorNum)
      });

      elevator.on("stopped_at_floor", function (floorNum) {
        elevator.lastLastStop = elevator.lastStop
        elevator.lastStop = floorNum
        
        // 双向箭头标志位为true时，up = down = true
        // 通过queue的下一站来确定是上还是下。
        if (elevator.force_updown[floorNum]) {
          elevator.force_updown[floorNum] = false
          elevator.goingUpIndicator(true)
          elevator.goingDownIndicator(true)
          console.log(`%cstop at: ${floorNum}, queue [${elevator.destinationQueue}] disp up and down`)
          return;
        }

        if (elevator.destinationQueue.length == 0) {
          elevator.goingUpIndicator(true)
          elevator.goingDownIndicator(true)
          return;
        }
        if (elevator.destinationQueue[0] > floorNum ) {
          elevator.goingUpIndicator(true)
          elevator.goingDownIndicator(false)
          console.log(`%cstop at: ${floorNum}, queue [${elevator.destinationQueue}] disp up`)
        } else {
          elevator.goingUpIndicator(false)
          elevator.goingDownIndicator(true)
          console.log(`%cstop at: ${floorNum}, queue [${elevator.destinationQueue}] disp down`)
        }
      });

    });
  }
    ,

  update: function (dt, elevators, floors) {
    // We normally don't need to do anything here
  }
}
