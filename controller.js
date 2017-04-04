/* Controller class */
var Controller = function (n, m) {
    this.floors = []; // array of n floors
    this.elevators = []; // array of m elevators
    this.name = 'controller';
    this.requests = []

    var i;
    for (i = 0; i < n; i++) {
        this.floors.push (new Floor(i));
    }
    for (i = 0; i < m; i++) {
        this.elevators.push (new Elevator(i));
    }
}
  function setupListeners (newElev) {
    elevCont.handleEvent(newElev, "already_at_destination");
    elevCont.handleEvent(newElev, "call_when_needs_maintenance");
    elevCont.handleEvent(newElev, "at_floor");
    elevCont.handleEvent(newElev, "doors_open");
    elevCont.handleEvent(newElev, "doors_closed");
    elevCont.handleEvent(newElev, "unoccupied");
    elevCont.handleEvent(newElev, "occupied");
    elevCont.handleEvent(newElev, "need_maintenance");
  }

Controller.prototype.buttonPressed = function() {
    throw new Error('Abstract method');
}
Controller.prototype.handleRequest = function (direction, floor) {
    if ((direction == 1 && floor == main.floors.length - 1) || (direction == -1 && floor == 0)) {
        alert ('illegal operation');
        return;
    }
    var i, minIndex = -1, minDistance = Infinity;
    for (i = 0; i < main.elevators.length; i++) {
        var distanceIndex = main.elevators[i].isEligible (direction, floor);
        if (distanceIndex >= 0 && distanceIndex < minDistance) {
            minIndex = i; minDistance = distanceIndex;
        }
    }
    if (minIndex != -1) {
        main.elevators[minIndex].assignJob(direction, floor);
    } else {
        alert('no eligible elevators');
    }
}
/* Button class */
var Button = function (buttonType, floorNum, floorId) {
    Controller.apply(this); 
    this.buttonType = buttonType; // 1 is up, -1 is down
    this.buttonFloor = floorNum;
    this.buttonTypeString = (this.buttonType == 1) ? 'up_button' : 'down_button';

    this.buttonId = this.buttonTypeString + '_' + this.buttonFloor;
    this.buttonHtml = '<a href="#" id="' + this.buttonId + '">' + 
                      this.buttonTypeString + '</a><br/>';

    $('#' + floorId).append (this.buttonHtml);
    $('#' + this.buttonId).click( this.buttonPressed.bind(this) );
}
Button.prototype = Object.create(Controller.prototype);Button.prototype.constructor = Button; // TODO comment this?
Button.prototype.buttonPressed = function() {
    console.log('button pressed from button');
    this.handleRequest(this.buttonType, this.buttonFloor);
}
Button.prototype.getHtml = function () {
    return this.buttonHtml;
}

/* Floor class */
var Floor = function (floorNum) {
    this.floorNum = floorNum;

    this.floorId = 'floor_item_' + this.floorNum;
    this.initDisplay();

    this.upButton = new Button(1, this.floorNum, this.floorId);
    this.downButton = new Button(-1, this.floorNum, this.floorId);
}
Floor.prototype.initDisplay = function() {
    $('#floors_list').append ('<li id="' + this.floorId + '"><strong>Floor: ' + this.floorNum + '</strong><br/></li>');
};

/* Elevator class */
var Elevator = function (elevatorNum) {
    this.elevatorNum = elevatorNum;
    this.direction = 0; // 0 is idle, 1 is up, -1 is down
    this.idleFloor = 0;

    this.elevatorId = 'elevator_item_' + elevatorNum;
    this.initDisplay();
}
Elevator.prototype.initDisplay = function () {
    this.html = '<li id="' + this.elevatorId + '"><strong>Elevator: ' + this.elevatorNum + '</strong><br/>' + 
                'Floor: ' + this.idleFloor + '<br/></li>';
    $('#elevators_list').append(this.html);
}
Elevator.prototype.statusDisplay = function () {
    this.html = '';
    if (this.direction == 0) {
        this.html = 'Floor: ' + this.idleFloor + '<br/>';    
    } else {
        this.html = 'Moving in ' + ((this.direction == 1) ? 'up' : 'down') + ' direction<br/>';    
    }
    
    $('#' + this.elevatorId).append(this.html);
}
Elevator.prototype.assignJob = function (direction, floor) {
    if (floor == this.idleFloor) {
        this.statusDisplay();
    } else {
        this.direction = ((floor - this.idleFloor) > 0 ? 1 : -1);
        this.statusDisplay();
        setTimeout( function() { 
            this.idleFloor = floor;
            this.direction = 0; 
            this.statusDisplay();
        }.bind(this), 1000 * Math.abs(floor - this.idleFloor) );
    }
}
Elevator.prototype.isEligible = function (direction, floor) {
    //look through the elevators for one that is on the floor, one that will pass by the floor, and/or the closest unoccupied elevator
  elevators.some(function (elev) {
    //checking if that elevator needs maintanence
    if (elev.needs_maintenance) {
      return;
    }
    if (elev.currentFloor === floor) {
      elevOnFloor = elev;
      return true;
    }

    //if the elevator is moving up
    if (direction === 1 && _.contains(_.range(elev.currentFloor, Math.max(elev.destinations) + 1), floor)) {
      elevWillPass = elev;
    //if the elevator is moving down
    } else if (direction === -1 && _.contains(_.range(Math.min(elev.destinations), elev.currentFloor + 1), floor)) {
      elevWillPass = elev;
    //if we have no closestUnoccupied
      if (!elev.occupied && (_.isUndefined(closestUnoccupied) || Math.abs(floor = elev.currentFloor) < closestUnoccupiedDistance)) {
        closestUnoccupied = elev;
        closestUnoccupiedDistance = Math.abs(floor = elev.currentFloor);
      }
    }
 if (elevOnFloor) {
    elevOnFloor.goToFloor(floor);
  } else if (elevWillPass) {
    elevWillPass.goToFloor(floor);
  } else if (closestUnoccupied) {
    closestUnoccupied.goToFloor(floor);
  //if no elevator is available queue request to be consumed the next time an elevator
  } else if (!_.contains(this.queuedRequests, floor)) {
    this.queuedRequests.push(floor);
  }
};
}

var TRIPS_TILL_MAINTENANCE = 100;
Elevator.prototype.addTrip = function () {
  this.numTrips++;
  if (this.numTrips >= TRIPS_TILL_MAINTENANCE) {
    this.needsMaintenance = true;
    this.emit("need_maintenance");
  }
};
Elevator.prototype.goToFloor = function (floor) {
  var me = this
    ;

  if (!_.isNumber(floor)) {
    throw new Error("Elevator.prototype.goToFloor called with a non-number: "+floor);
  }

  //if we are on the floor we're supposed to go to, just open the doors.
  if (floor === me.currentFloor) {
    return me.arrivedAtFloor(floor);
  }

  if (me._addDestination(floor)) {
    me.addTrip();
    return true;
  }

  return false;
};

/* init */
var main = new Controller(6, 4);
