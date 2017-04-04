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
/this has to be handled by the prototype, so it has access to the controller itself in the event handlers
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

