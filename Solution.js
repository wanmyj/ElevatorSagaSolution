{
  // this solution is based on https://github.com/magwo/elevatorsaga/wiki/Basic-Solution
  init: function (elevators, floors) {
    console.clear();
    const weight = 0.3;
    const maxFloor = floors.length - 1;
    const eleNum = elevators.length;
    elevators.forEach( (elevator, index) => {
      elevator.force_updown = new Array(floors.length).fill(false)
      elevator.lastStop = 0;
      elevator.lastLastStop = 100;
      elevator.index = index
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

    let findSortedIdle = function (floorNum) {
      idleEvevators = elevators.filter((elevator) => (elevator.destinationQueue.length == 0 || 
                    (elevator.destinationQueue[0] == 0 && elevator.destinationQueue.length == 1 && elevator.currentFloor() == 0)))
      console.log(`idleEvevators length(size) is ${idleEvevators.length}`)
      return idleEvevators.sort((a, b) => (distance(a, floorNum) - distance(b, floorNum)));
    };

    function getCurrentDirection(elevator) {
      curr = elevator.currentFloor()
      if (curr == maxFloor) return 'down'
      if (curr == 0) return 'up'
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

      // 去除重复数字
      const uniqueSet = new Set(elevator.destinationQueue);
      elevator.destinationQueue = Array.from(uniqueSet);


      let  isStayCurrentFloor = false
      currFloorNum = elevator.currentFloor();
      if (elevator.destinationQueue.includes(currFloorNum)) isStayCurrentFloor = true;

      const UpFloor = elevator.destinationQueue.filter((num) => num > currFloorNum);
      const DownFloor = elevator.destinationQueue.filter((num) => num < currFloorNum);
      
      UpFloor.sort((a, b) => a - b);
      DownFloor.sort((a, b) => b - a);

      let dirMoving = getCurrentDirection(elevator);
      if (dirMoving == "down" ) {
        console.info(`elevator[${elevator.index}] currently going down`)
        if (isStayCurrentFloor) DownFloor.unshift(currFloorNum);
        elevator.destinationQueue = DownFloor.concat(UpFloor) 
        return;
      }
      if (dirMoving == "up") {
        console.info(`elevator[${elevator.index}] currently going up`)
        if (isStayCurrentFloor) UpFloor.unshift(currFloorNum)
        elevator.destinationQueue = UpFloor.concat(DownFloor) 
        return;
      }
      // dir would nerver be idle, although it has been pushed
      // when current is 0, push is 0(from outside btn), the status is idel
      console.warn('elevator[${elevator.index}] Currently Unusual idel status')
    };

    function insertFloorIntoElevatorQueue(elevator, floor) {
      // Get elevator's current direction
      const dir = getCurrentDirection(elevator);
      // Get elevator's destination queue
      const queue = elevator.destinationQueue;
      // Get floor number
      const floorNum = floor.floorNum();
      // Get the pressed direction
      const dirPressed = floor.recorder;

      // 向上、下运动 * （顶.最大、底.最小楼 + 比curr高、低） * ( dirPressed is up/down)
      if (dir === "up") {
        // if current floor is higher than the floorNum, insert the floorNum into the queue's downlist


        // 如果当前楼层比目标楼层高，且目标楼层在队列里，那么就把目标楼层移除队列
        if (elevator.currentFloor() > floorNum && queue.includes(floorNum)) {
          elevator.destinationQueue = queue.filter((num) => num !== floorNum);
          elevator.checkDestinationQueue();
          return;
        }
        // 如果当前楼层比目标楼层低，且目标楼层不在队列里，那么就把目标楼层加入队列
        if (elevator.currentFloor() < floorNum && !queue.includes(floorNum)) {
          elevator.destinationQueue.push(floorNum);
          sortQueue(elevator);
          elevator.checkDestinationQueue();
          return;
        }
      }

    };
    // Put the floor in elevator's queue 
    // TODO: usd prototype to add method to elevator object
    function putFloorIntoElevatorQueue(elevator, floorNum) {
      // 有时候会满载一直停在某一层
      let queuebefore = [...elevator.destinationQueue]
      if (elevator.loadFactor() >= 0.8 && elevator.lastStop === floorNum && elevator.lastLastStop ===floorNum && elevator.currentFloor() === floorNum) {
        elevator.goToFloor(floorNum)
        elevator.force_updown[floorNum] = true
        console.info(`elevator[${elevator.index}] Previous Queue is: ${queuebefore}, then ${elevator.destinationQueue}, push to tail`)
        return;
      }
      elevator.destinationQueue.push(floorNum);
      sortQueue(elevator);

      elevator.checkDestinationQueue();
      console.info(`elevator[${elevator.index}]: [${elevator.destinationQueue}] = [${queuebefore}] + ${floorNum}, curr floor is ${elevator.currentFloor()} `)
    };
    // function getDirectionWhenPassFloor(elevator, floorNum) {
    // only return up or down, no idle
    function getDirectionStopAtFloor(elevator, floorNum) {
      const queue = elevator.destinationQueue;

      if (!queue.includes(floorNum)) { throw "false usage, much include floorNum in queue"}
      floorNumIndex = queue.indexOf(floorNum)
      if (floorNumIndex === queue.length - 1) {
        if (floorNumIndex === 0) {
          dir = getCurrentDirection(elevator);
          if (dir == 'idle') throw "Wrong idle, because if idle elevator exists, callstack should not come here"
          return dir;
        }  
        if (queue[floorNumIndex - 1] > floorNum) return 'down'
        if (queue[floorNumIndex - 1] < floorNum) return 'up'
        if (queue[floorNumIndex - 1] == floorNum) throw "sort error happened, no identical number should be in queue"
      };
      const nextFloor = queue[floorNumIndex + 1];
      if (nextFloor > floorNum) { return "up"; }
      if (nextFloor < floorNum) { return "down"; }
      if (nextFloor = floorNum) { throw 'wrong queue' }
    };

    function findElevator_StoppedAndDirMatch(floorNum, dirPressed) {
      // let recorder = floor.recorder
      // let floorNum = floor.floorNum
      let elevatorsHasFloor = elevators.filter((elevator) => (elevator.destinationQueue.includes(floorNum)));
      if (elevatorsHasFloor.length === 0) return null;
      elevatorsRightDir = elevatorsHasFloor.filter((elevator) => (getDirectionStopAtFloor(elevator, floorNum) == dirPressed))
      if (elevatorsRightDir.length === 0) return null;
      
      if (elevatorsRightDir.length == 1) return elevatorsRightDir[0];
      const resultElevator = elevatorsRightDir.reduce((bestElevator, elevator) => {
        let loadFactor1 = bestElevator.loadFactor();
        let loadFactor2 = elevator.loadFactor();
        let distance1 = distance(bestElevator, floorNum);
        let distance2 = distance(elevator, floorNum);
        let value1 = loadFactor1 + distance1 * 0.2;
        let value2 = loadFactor2 + distance2 * 0.2;
        if (value1 < value2) {
          return bestElevator
        } else {
          return elevator
        }
      })
      return resultElevator;
    };

    function findElevator_ForExtremeFloor(floorNum) {
      if (floorNum != 0 && floorNum != maxFloor) throw "wrong input for findElevator_ForExtremeFloor"
      // 如果floorNum是顶楼/底楼，且电梯方向是上/下，则它满足
      let elevatorsRightDir = elevators.filter((elevator) => {
        dirMoving = getCurrentDirection(elevator)
        if (floorNum && dirMoving == 'down' ||
            !floorNum && dirMoving == 'up') {
              return true;
        } else {
          return false;
        }
      })
      if (elevatorsRightDir.length == 0) return null;

      // Sort the satisfied elevators by distance and load factor
      elevatorsRightDir.sort((elevator1, elevator2) => {
        let loadFactor1 = elevator1.loadFactor();
        let loadFactor2 = elevator2.loadFactor();

        let distance1 = distance(elevator1, floorNum);
        let distance2 = distance(elevator2, floorNum);
        return loadFactor1 - loadFactor2 + (distance1 - distance2) *0.2
      });
      return elevatorsRightDir[0];


    };

    function findElevator_WithMinDistance(floorNum, dirPressed) {
      const satisfiedElevators = new Map();
      for (const elevator of elevators) {
        // 如果它比某部电梯的queue最大值都大，且此电梯向上运动，“且它按的方向是向上”，找出最近的一部电梯，它来接
        // 如果它比某部电梯的queue最小值都小，且此电梯向下运动，“且它按的方向是向下”，找出最近的一部电梯，它来接
        dirMoving = getCurrentDirection(elevator)

        const destinationQueue = elevator.destinationQueue;
        if (destinationQueue.length > 0) {
          const maxQueueValue = Math.max(...destinationQueue);
          const minQueueValue = Math.min(...destinationQueue);
    
          // Check if the elevator's queue meets the conditions
          if ((floorNum > maxQueueValue && dirMoving == 'up' && dirPressed == 'up') || 
              (floorNum < minQueueValue && dirMoving == 'down' && dirPressed == 'down')) {
            const distance = Math.abs(maxQueueValue - floorNum);
            satisfiedElevators.set(elevator, distance);
          }
        }
      }
    
      if (satisfiedElevators.length === 0) {
        return null; // No elevators satisfy the conditions
      }

      // Sort the satisfied elevators by distance and then by load factor
      const sortedElevators = Array.from(satisfiedElevators.keys())
      sortedElevators.sort((elevator1, elevator2) => {
        let loadFactor1 = elevator1.loadFactor();
        let loadFactor2 = elevator2.loadFactor();

        let distance1 = distance(elevator1, floorNum);
        let distance2 = distance(elevator2, floorNum);
        return loadFactor1 - loadFactor2 + (distance1 - distance2) *0.2
      });
    
      // Return the elevator with the minimum distance and, if there are ties, the minimum load factor
      return sortedElevators[0];
    };

    function findElevator_WithPassingbyAndLoadFactor(floorNum, dirPressed) {
      // 如果上下两层之内有电梯即将到达（路过电梯），而且满载率小于0.85，则由它来接乘客
      for (elevator of elevators) {
        let dirMoving = getCurrentDirection(elevator)
        console.log(`elevator[${elevator.index}].loadFactor is ${elevator.loadFactor()}`)
        if (elevator.loadFactor() <= 0.85 && dirPressed == dirMoving) {
          let currFloorNum = elevator.currentFloor();
          if (currFloorNum >= floorNum) { return elevator;}
          if (currFloorNum <= floorNum) { return elevator;}
        }
      }
      return null
    }

    function selectElevatorToPickUp(floor, dirPressed) {
      const floorNum = floor.floorNum()
      let resultElevator

      // 找个空的，find an idle elevator if possible，
      // 如果floorNum是顶楼/底楼，筛选方向一致，找最近的来接 (insert into queue)
      // 如果在某个电梯的queue里，且方向一致，由这个电梯来接，如果有多个，则找满载率最小*距离最近的 (do nothing)
      // 如果它比某部电梯的queue最大值都大，且此电梯向上运动，“且它按的方向是向上”，找出最近的一部电梯，它来接 (insert into queue)
      // 如果有电梯即将到达且方向一致（路过电梯），而且满载率小于0.85，则由它来接乘客 (insert into queue)
      // 如果在某个电梯的queue里，，找一个factor最小的电梯来接，由这个电梯来接(do nothing but forceupdown is true)
      // 如果也没有空的，找一个满载率最低的电梯, 由这个电梯来接 (insert into queue)


      // 找个空的，find an idle elevator if possible，
      let idleEvevators = findSortedIdle(floorNum);
      if (idleEvevators.length) {
        resultElevator = idleEvevators[0]
        resultElevator.force_updown[floorNum] = true
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dirPressed] = false
        console.info(`elevator[${resultElevator.index}] mode 1 idle`)
        return;
      }
      console.info("mode 1 not pick - no idle come")

      // 如果floorNum是顶楼/底楼，筛选方向一致，找最近的来接
      if (floorNum == 0 || floorNum == maxFloor) {
        resultElevator = findElevator_ForExtremeFloor(floorNum)
        if (resultElevator != null) {
          putFloorIntoElevatorQueue(resultElevator, floorNum)
          floor.recorder[dirPressed] = false
          console.info(`elevator[${resultElevator.index}] mode 2 extrame floor`)
          return;
        }
      }
      console.info("mode 2 not pick - not extrame floor")

      // 如果在某个电梯的queue里，且方向一致，由这个电梯来接，如果有多个，则找满载率最小*距离最近的
      resultElevator = findElevator_StoppedAndDirMatch(floorNum, dirPressed);
      if (resultElevator != null) {
        // Just Do nothing, because the floor is already in queue
        floor.recorder[dirPressed] = false
        console.info(`elevator[${resultElevator.index}] mode 3 in queue and dir match`)
        return;
      }
      console.info(`mode 3 not pick - in queue and dir match`)

      // 如果它比某部电梯的queue最大值都大，且此电梯向上运动，“且它按的方向是向上”，找出最近的一部电梯，它来接
      // 如果它比某部电梯的queue最小值都小，且此电梯向下运动，“且它按的方向是向下”，找出最近的一部电梯，它来接
      resultElevator = findElevator_WithMinDistance(floorNum, dirPressed)
      if (resultElevator != null) {
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dirPressed] = false
        console.info(`elevator[${resultElevator.index}] mode 4 biger than big`)
        return;
      }
      console.info(`mode 4 not pick - No biger than big`)

      // 如果有电梯即将到达（路过电梯），而且满载率小于0.85，则由它来接乘客
      resultElevator =  findElevator_WithPassingbyAndLoadFactor(floorNum, dirPressed)
      if (resultElevator != null) {
        putFloorIntoElevatorQueue(resultElevator, floorNum)
        floor.recorder[dirPressed] = false
        console.info(`elevator[${resultElevator.index}] mode 5 nearby passing`)
        return;
      }
      console.info(`mode 5 not pick - nearby passing `)

      // 如果在某个电梯的queue里，由这个电梯来接
      // todo_em: 加上检测factor的条件，找一个factor最小的电梯来接
      for (elevator of elevators) {
        if (elevator.destinationQueue.includes(floorNum)) {
          elevator.force_updown[floorNum] = true
          floor.recorder[dirPressed] = false
          console.info(`elevator[${elevator.index}] mode 6 in queue`)
          return;
        }
      }
      console.info("mode 6 not pick - in queue come")

      // 如果也没有空的，找一个满载率最低的电梯
      if (elevators.length == 1) resultElevator =  elevators[0];
      else {
        resultElevator = elevators.reduce((bestElevator, elevator) => {
          let loadFactor1 = bestElevator.loadFactor();
          let loadFactor2 = elevator.loadFactor();
          if (loadFactor1 < loadFactor2) {
            return bestElevator
          } else {
            return elevator
          }
        })
      }
      putFloorIntoElevatorQueue(resultElevator, floorNum)
      resultElevator.force_updown[floorNum] = true
      floor.recorder[dirPressed] = false
      console.info(`elevator[${resultElevator.index}] mode 6 - lowest loadfactor`)
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

    elevators.forEach(function (elevator) {

      elevator.on("floor_button_pressed", function (floorNum) {
        console.log(`%celevator[${elevator.index}] Inside floor button pressed on ${floorNum} `,
                    'background: #222; color: #bada55')
        putFloorIntoElevatorQueue(elevator, floorNum)
      });

      elevator.on("stopped_at_floor", function (floorNum) {
        elevator.lastLastStop = elevator.lastStop
        elevator.lastStop = floorNum
        
        console.log(`   elevator[${elevator.index}].force_updown array is ${elevator.force_updown} `)
        // 双向箭头标志位为true时，up = down = true
        // 通过queue的下一站来确定是上还是下。
        if (elevator.force_updown[floorNum]) {
          elevator.force_updown[floorNum] = false
          elevator.goingUpIndicator(true)
          elevator.goingDownIndicator(true)
          console.log(`%celevator[${elevator.index}] stop at: ${floorNum}, queue [${elevator.destinationQueue}] disp up and down`)
          return;
        }

        if (elevator.destinationQueue.length == 0) {
          elevator.goingUpIndicator(true)
          elevator.goingDownIndicator(true)
          console.log(`%elevator[${elevator.index}] cstop at: ${floorNum}, queue [idel],  disp up and down`)
          return;
        }
        if (elevator.destinationQueue[0] > floorNum ) {
          elevator.goingUpIndicator(true)
          elevator.goingDownIndicator(false)
          console.log(`%elevator[${elevator.index}] cstop at: ${floorNum}, queue [${elevator.destinationQueue}] disp up`)
        } else {
          elevator.goingUpIndicator(false)
          elevator.goingDownIndicator(true)
          console.log(`%elevator[${elevator.index}] cstop at: ${floorNum}, queue [${elevator.destinationQueue}] disp down`)
        }
      });

    });
  }
    ,

  update: function (dt, elevators, floors) {
    // We normally don't need to do anything here
  }
}
