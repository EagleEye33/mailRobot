//an array of places that connect
const roads = [
"Alice's House-Bob's House", "Alice's House-Cabin",
"Alice's House-Post Office", "Bob's House-Town Hall",
"Daria's House-Ernie's House", "Daria's House-Town Hall",
"Ernie's House-Grete's House", "Grete's House-Farm",
"Grete's House-Shop", "Marketplace-Farm",
"Marketplace-Post Office", "Marketplace-Shop",
"Marketplace-Town Hall", "Shop-Town Hall"
]

function buildGraph(edges) {
	let graph = Object.create(null);
	function addEdge(from, to) {
		if (graph[from] == null) {
			graph[from] = [to];
		} else {
			graph[from].push(to);
		}
	}
	for (let [from, to] of edges.map(r => r.split("-"))) {
		addEdge(from, to);
		addEdge(to, from);
	}
	return graph;
}
const roadGraph = buildGraph(roads);
//console.log(roadGraph);

class VillageState {
	constructor(place, parcels) {
		this.place = place;
		this.parcels = parcels;
	}
	move(destination) {
		if (!roadGraph[this.place].includes(destination)) {
			return this;
		} else {
			let parcels = this.parcels.map(p => {
				if (p.place != this.place) return p;
				return {place: destination, address: p.address};
			}).filter(p => p.place != p.address);
			return new VillageState(destination, parcels);
		}
	}
}
/*
let first = new VillageState(
	"Post Office",
	[{place: "Post Office", address: "Alice's House"}]
	);
let next = first.move("Alice's House");
*/
/*console.log(next.place);
// → Alice's House
console.log(next.parcels);
// → []
console.log(first.place);
// → Post Office */

function runRobot(state, robot, memory) {
  for (let turn = 0;; turn++) {
    if (state.parcels.length == 0) {
      console.log(`Done in ${turn} turns`);
      return turn;
      break;
    }
    //console.log(state, robot, memory);
    let action = robot(state, memory);
    //console.log(action);
    state = state.move(action.direction);
    //console.log(state);
    memory = action.memory;
    console.log(`Moved to ${action.direction}`);
  }
}

function randomPick(array) {
  let choice = Math.floor(Math.random() * array.length);
  return array[choice];
}

function randomRobot(state) {
  return {direction: randomPick(roadGraph[state.place])};
}

VillageState.random = function(parcelCount = 5) {
  let parcels = [];
  for (let i = 0; i < parcelCount; i++) {
    let address = randomPick(Object.keys(roadGraph));
    let place;
    do {
      place = randomPick(Object.keys(roadGraph));
    } while (place == address);
    parcels.push({place, address});
  }
  return new VillageState("Post Office", parcels);
};

//runRobot(VillageState.random(), randomRobot);
// → Moved to Marketplace
// → Moved to Town Hall
// →…
// → Done in 63 turns

var mailRoute = [
  "Alice's House", "Cabin", "Alice's House", "Bob's House",
  "Town Hall", "Daria's House", "Ernie's House",
  "Grete's House", "Shop", "Grete's House", "Farm",
  "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
  if (memory.length == 0) {
    memory = mailRoute;
  }
  return {direction: memory[0], memory: memory.slice(1)};
}

/*function fasterRoute(graph, from, parcels) {
	let mProject = [];
	for (let j = 0; j < parcels.length; j++) {
		let to = parcels[j];
		let work = [{at: from, route: []}];
		let i = 0;
		for (i; i < work.length; i++) {
			let {at, route} = work[i];
			for (let place of graph[at]) {
				if (place == to) mProject.concat(route);
				if (!work.some(w => w.at == place)) {
						work.push({at: place, route: route.concat(place)});

					}
				}
			}
		}

	}  */

function findRoute(graph, from, to) {
  let work = [{at: from, route: []}];
  for (let i = 0; i < work.length; i++) {
    let {at, route} = work[i];
    for (let place of graph[at]) {
      if (place == to) return route.concat(place);
      if (!work.some(w => w.at == place)) {
        work.push({at: place, route: route.concat(place)});
      }
    }
  }
}


function projectGoalRobot({place, parcels}, route) {
	if (route.length == 0){
		let mProject = [];
		let preRoute = [];
		for (let j = 0; j < parcels.length; j++) {
			let parcel = parcels[j];
			if (parcel.place != place) {
				mProject.push(findRoute(roadGraph, place, parcel.place));
			} else {
				mProject.push(findRoute(roadGraph, place, parcel.address));
			}
		}
		//console.log(mProject);
		preRoute = mProject.sort(function(a, b){return a.length - b.length});
		route = preRoute[0];
		//console.log(preRoute);
	}
	//console.log(route);
	return {direction: route[0], memory: route.slice(1)};
}

function projectGoalRobot2({place, parcels}, route) {
	if (route.length == 0){
		let routes = parcels.map(parcel => {
			if (parcel.place != place) {
				return {route: findRoute(roadGraph, place, parcel.place)};
			} else {
				return {route: findRoute(roadGraph, place, parcel.address)};
			}
		});
		route = routes.reduce((a,b) => a.route.length < b.route.length ? a : b).route;
	}


	return {direction: route[0], memory: route.slice(1)};
}

function goalOrientedRobot({place, parcels}, route) {
  if (route.length == 0) {
    let parcel = parcels[0];
    if (parcel.place != place) {
      route = findRoute(roadGraph, place, parcel.place);
    } else {
      route = findRoute(roadGraph, place, parcel.address);
    }
  }
  return {direction: route[0], memory: route.slice(1)};
}

function lazyRobot({place, parcels}, route) {
  if (route.length == 0) {
    // Describe a route for every parcel
    let routes = parcels.map(parcel => {
      if (parcel.place != place) {
        return {route: findRoute(roadGraph, place, parcel.place),
                pickUp: true};
      } else {
        return {route: findRoute(roadGraph, place, parcel.address),
                pickUp: false};
      }
    });

    // This determines the precedence a route gets when choosing.
    // Route length counts negatively, routes that pick up a package
    // get a small bonus.
    function score({route, pickUp}) {
      return (pickUp ? 0.5 : 0) - route.length;
    }
    route = routes.reduce((a, b) => score(a) > score(b) ? a : b).route;
  }

  return {direction: route[0], memory: route.slice(1)};
}


//runRobot(VillageState.random(), projectGoalRobot2, []);

function countSteps(state, robot, memory) {
  for (let steps = 0;; steps++) {
    if (state.parcels.length == 0) return steps;
    let action = robot(state, memory);
    state = state.move(action.direction);
    memory = action.memory;
  }
}

function compareRobots(robot1, robot2) {
	let robot1Sum = 0;
	let robot2Sum = 0;
	for(let i = 0; i < 100; i++) {
		let village1 = VillageState.random();
		robot1Sum += countSteps(village1, robot1, []);
		robot2Sum += countSteps(village1, robot2, []);
	}
	console.log(`\n The average number of steps for robot1 is: ${robot1Sum/100} and robot2 is: ${robot2Sum/100} \n`);

}

compareRobots(lazyRobot, projectGoalRobot2);