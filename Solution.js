{
  // this solution is based on https://github.com/magwo/elevatorsaga/wiki/Basic-Solution
  init: function (elevators, floors) {
    console.clear();
    const weight = 0.3;
    const maxFloor = floors.length - 1;
    const eleNum = elevators.length;
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

    let findNearestIdle = function (floorNum) {
      idleEvevators = elevators.filter((elevator) => (elevator.destinationQueue.length == 0))
      console.log(`idleEvevators length is ${idleEvevators.length}`)
      return idleEvevators.sort((a, b) => (distance(a, floorNum) - distance(b, floorNum)));
    };

    function getCurrentDirection(elevator) {
      curr = elevator.currentFloor()
      prev = elevator.lastStop
      queue = elevator.destinationQueue
      if (queue.length == 0) {
        if (prev == curr) return 'idle'
        if (prev > curr) return 'down'
        if (prev < curr) return 'up'
      }
      next = queue[0]
      if (next < curr) return 'down'
      if (next > curr) return 'up'

      if ( typeof queue[1] === 'undefined')  {
        if (prev == curr) return 'idle'
        if (prev > curr) return 'down'
        if (prev < curr) return 'up'
      } else {
        if (next == queue[1]) throw "No idle bcz no duplicated num in queu"
        if (next > queue[1]) return 'down'
        if (next < queue[1]) return 'up'  
      }
    }
    // https://github.com/akadrac/elevatorsaga/blob/master/solution.js
    function sortQueue(elevator) {
      let dirMoving = getCurrentDirection(elevator);

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

      // 
      if (dirMoving == "down" ) {
        console.info("currently going down")
        if (isStayCurrentFloor) DownFloor.unshift(onFloorNum);
        elevator.destinationQueue = DownFloor.concat(UpFloor) 
        return;
      }
      if (dirMoving == "up") {
        console.info("currently going up")
        if (isStayCurrentFloor) UpFloor.unshift(onFloorNum)
        elevator.destinationQueue = UpFloor.concat(DownFloor) 
        return;
      }
      // dir would nerver be idle, although it has been pushed
      // when current is 0, push is 0(from outside btn), the status is idel
      console.warn('Currently Unusual idel status')
    };

    // Put the floor in elevator's queue 
    // TODO: usd prototype to add method to elevator object
    function putFloorIntoElevatorQueue(elevator, floorNum) {
      // 有时候会一直停在某一层
      let queuebefore = [...elevator.destinationQueue]
      if (elevator.lastStop === floorNum) {
        elevator.goToFloor(floorNum)
        elevator.force_updown[floorNum] = true
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

    function findElevatorsStoppedAtFloor(floor) {
      let recorder = floor.recorder
      let floorNum = floor.floorNum
      let foundElevators = elevators.filter((elevator) => (elevator.destinationQueue.includes(floorNum)));
      if (foundElevators.count === 0) return foundElevators;

      foundElevators = foundElevators.filter((elevator) => {
        let dirPassing = getDirectionWhenPassFloor(elevator, floorNum);
        console.log(`dirPassing is ${dirPassing}, recoder is ${recoder}`)
        if (dirPassing == "idle") { return true; }
        if (dirPassing == "up" && recorder["up"]) {return true; }
        if (dirPassing == "down" && recorder["down"]) {return true; }
        return false;
      })
      return foundElevators
    };
    
    function findElevatorWithMinDistance(floorNum, dirPressed) {
      const satisfiedElevators = new Map();
    
      for (const elevator of elevators) {
        // 如果floorNum是顶楼/底楼，且电梯方向是上/下，则它满足
        // 如果它比某部电梯的queue最大值都大，且此电梯向上运动，“且它按的方向是向上”，找出最近的一部电梯，它来接
        // 如果它比某部电梯的queue最小值都小，且此电梯向下运动，“且它按的方向是向下”，找出最近的一部电梯，它来接
        dirMoving = getCurrentDirection(elevator)
        if ((floorNum == 0 && dirMoving == 'down') || (floorNum == maxFloor && dirMoving == 'up')) {
          satisfiedElevators.set(elevator.distance);
          continue;
        }
        const destinationQueue = elevator.destinationQueue;
        if (destinationQueue.length > 0) {
          const maxQueueValue = Math.max(...destinationQueue);
          const minQueueValue = Math.min(...destinationQueue);
    
          // Check if the elevator's queue meets the conditions
          if ((maxQueueValue < floorNum && dirMoving == 'down' && dirPressed == 'down') || 
              (minQueueValue > floorNum && dirMoving == 'up' && dirPressed == 'up')) {
            const distance = Math.abs(maxQueueValue - floorNum);
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
      // 如果上下两层之内有电梯即将到达（路过电梯），而且满载率小于0.5，则由它来接乘客
      elevators.forEach(elevator => {
        let dirMoving = getCurrentDirection(elevator)
        console.log(`elevator.loadFactor is ${elevator.loadFactor()}`)
        if (elevator.loadFactor() <= 0.5) {
          let onFloorNum = elevator.currentFloor();
          if (onFloorNum >= floorNum && onFloorNum <= floorNum + 3 && dirMoving == "down") { return elevator;}
          if (onFloorNum <= floorNum && onFloorNum >= floorNum - 3 && dirMoving == "up") { return elevator;}
        }
      })
      return null
    }

    function selectElevatorToPickUp(floor, dirPressed) {
      const floorNum = floor.floorNum()
      // 如果在某个电梯的queue里，且方向一致，由这个电梯来接，如果有多个，则找满载率最小*距离最近的
      let elevatorsWithThisFloor = findElevatorsStoppedAtFloor(floor);
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
        floor.recorder[dirPressed] = false
        console.info("mode 1")
        return;
      }

      console.info("mode 1 not pick - in queue and dir match")
        // 如果floorNum是顶楼/底楼，且电梯方向是上/下，则它满足
        // 如果它比某部电梯的queue最大值都大，且此电梯向上运动，“且它按的方向是向上”，找出最近的一部电梯，它来接
        // 如果它比某部电梯的queue最小值都小，且此电梯向下运动，“且它按的方向是向下”，找出最近的一部电梯，它来接
      let resultElevator = findElevatorWithMinDistance(floorNum, dirPressed)
      if (resultElevator != null) {
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dirPressed] = false
        console.info("mode 2")
        return;
      }

      console.info("mode 2 not pick - dir match")
      // 如果上下三层之内有电梯即将到达（路过电梯），而且满载率小于0.5，则由它来接乘客
      // TODO_em 这个也需要force updown
      resultElevator =  findElevatorWithPassingbyAndLoadFactor(floorNum)
      if (resultElevator != null) {
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dirPressed] = false
        resultElevator.force_updown[floorNum] = true
        console.info("mode 3")
        return;
      }

      console.info("mode 3 not pick - 3 floors nearby passing")
      // 找个空的，find an idle elevator if possible，
      let idleEvevators = findNearestIdle(floorNum);
      if (idleEvevators.length) {
        console.log (`     There are idle elevators`)
        resultElevator = idleEvevators[0]
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dirPressed] = false
        console.info("mode 4")
        return;
      }

      
      // 非顶楼，且按的方向和电梯运动方向不一致，就需要用force updown了

      console.info("mode 4 not pick - idle come")
      
      // 如果在某个电梯的queue里，由这个电梯来接
      for (elevator of elevators) {
        if (elevator.destinationQueue.includes(floorNum)) {
          elevator.force_updown[floorNum] = true
          floor.recorder[dirPressed] = false
          console.info("mode 5")
          return;
        }
      }

      console.info("mode 5 not pick - in queue come")
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
      elevator.force_updown[floorNum] = true
      floor.recorder[dirPressed] = false
      console.info("mode 6 - lowest loadfactor")
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
        
        console.log(`   elevator.force_updown array is ${elevator.force_updown} `)
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
          console.log(`%cstop at: ${floorNum}, queue [idel],  disp up and down`)
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
