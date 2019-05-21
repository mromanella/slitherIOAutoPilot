const MOUSE_SCALAR = 200;

const test = 'test';
const autoRestart = 'autoRestart';
const intervalRate = 'intervalRate';
const foodIdCountLimit = 'foodIdCountLimit';
const keepAwayDistance = 'keepAwayDistance';
const criticalDistance = 'criticalDistance';
const boostDuration = 'boostDuration';

let props = [foodIdCountLimit,
    keepAwayDistance,
    criticalDistance,
    boostDuration]

let config = {
    test: true,
    autoRestart: true,
    intervalRate: 50,
    foodIdCountLimit: 75,
    keepAwayDistance: 0,
    criticalDistance: 100,
    boostOnCrit: false,
    boostOnLargeFood: true,
    boostOnLargeFoodDistance: 500,
    boostOnLargeFoodSize: 75,
    foodPrioritySize: 50,
    foodPriorityDistance: 300,
    boostDuration: 750
}

let minMaxConfig = {
    foodIdCountLimit: [10, 50],
    keepAwayDistance: [100, 2000],
    criticalDistance: [100, 2000],
    boostDuration: [100, 2000],
}


const randomValue = (min, max) => {
    return Math.floor((Math.random() * max) - min)
}

class SlitherIOAutoPilot {

    constructor(config) {
        this.test = config.test;
        this.autoRestart = config.autoRestart;
        this.intervalRate = config.intervalRate;
        this.foodIdCountLimit = config.foodIdCountLimit;
        this.keepAwayDistance = config.keepAwayDistance;
        this.criticalDistance = config.criticalDistance;
        this.boostOnCrit = config.boostOnCrit;
        this.boostOnLargeFood = config.boostOnLargeFood;
        this.boostOnLargeFoodDistance = config.boostOnLargeFoodDistance;
        this.boostOnLargeFoodSize = config.boostOnLargeFoodSize;
        this.foodPrioritySize = config.foodPrioritySize
        this.foodPriorityDistance = config.foodPriorityDistance;
        this.boostDuration = config.boostDuration;
        this.intervalID = null;
        this.foodCounts = {};
        this.highestScore = 0;
        this.lastScore = 0;
    }

    log = (msg) => {
        if (this.test) {
            console.log(msg);
        }
    }

    boost = (duration) => {
        if (!duration) {
            duration = 500;
        }
        dispatchEvent(new Event('mousedown'));
        this.log('Boosting');
        setTimeout(() => {
            dispatchEvent(new Event('mouseup'));
        }, duration);
    }

    updateFoodIDCount = (foodID) => {
        if (!this.foodCounts.hasOwnProperty(foodID)) {
            this.foodCounts[foodID] = 0;
        }
        this.foodCounts[foodID]++;

        if (this.foodCounts[foodID] > this.foodIdCountLimit) {
            delete this.foodCounts[foodID];
            log('spinning wheels');
            this.boost(this.boostDuration);
        }
    }

    distance = (other) => {
        /**
         * @description Returns the distance between the snake and other.
         * @param other Other object.
         *
         * @returns The distance as a number.
        */
        return Math.sqrt(Math.pow(snake.xx - other.xx, 2) +
            Math.pow(snake.yy - other.yy, 2));
    }

    determineQuadrant = (other) => {
        /**
         * @description Determines which quadrant the other is in..
         *
         * @returns X and Y.
         */
        let signX = Math.sign(other.xx - snake.xx);
        let signY = Math.sign(other.yy - snake.yy);
        return [signX, signY];
    }

    getNearestFood = (quadX, quadY) => {
        /**
         * @description Determines the closest food to the snake.
         * @params quadX
         * @params quadY
         * @returns The nearest food. If quadX and Y are
         * given then returns
         * the nearest food object not in that quad.
        */
        let nearestFood = { food: null, dist: 99999999 };
        let nearestLarge = { food: null, dist: 99999999, size: 0 };
        let nearestPriority = { food: null, dist: 99999999, size: 0 };
        // Loop through the foods getting the distance to each one
        for (let food of foods) {
            // Foods get nulled out
            if (food) {
                let [foodQuadX, foodQuadY] = this.determineQuadrant(food);
                // If the food is within the quadrant with the most enemies then
                // ignore it
                if ((quadX && quadY) &&
                    (quadX == foodQuadX && quadY == foodQuadY)) {
                    continue;
                }
                let foodDist = this.distance(food);
                let foodSize = (food.fw * food.rad)
                if ((foodSize >= this.boostOnLargeFoodSize) &&
                    (foodDist <= this.boostOnLargeFoodDistance) &&
                    (foodSize >= nearestLarge.size)) {
                    nearestLarge.food = food;
                    nearestLarge.dist = foodDist;
                    nearestLarge.size = foodSize;
                } else if ((foodDist <= this.foodPriorityDistance) &&
                    (foodSize >= this.foodPrioritySize) &&
                    (foodSize >= nearestPriority.size)) {
                    nearestPriority.food = food;
                    nearestPriority.dist = foodDist;
                    nearestPriority.size = foodSize;
                } else {
                    if (foodDist <= nearestFood.dist) {
                        nearestFood.food = food;
                        nearestFood.dist = foodDist;
                    }
                }
            }
        }

        // Large foods first
        if (nearestLarge.food) {
            this.log('large food');
            return [nearestLarge.food, true];
        }
        if (nearestPriority.food) {
            this.log('priority food');
            return [nearestPriority.food, false];
        }
        this.log('nearest food');
        return [nearestFood.food, false];
    }

    determineQuadrantWithNearestFood = (quadX, quadY) => {
        /**
         * @description Determines the closest food to the snake.
         * @params quadX
         * @params quadY
         * @returns The nearest food quadrant x and y. If quadX and Y are
         * given then returns
         * the nearest food object not in that quad.
        */

        let [nearestFood, withinLargeFoodDistance] = this.getNearestFood(quadX, quadY);
        this.updateFoodIDCount(nearestFood.id);
        return [...this.determineQuadrant(nearestFood), withinLargeFoodDistance];
    }

    determineProjectedCoordinates = (quadX, quadY, mult) => {
        /**
         * @description Adds some spacing between the snake and the coordinates for the mouse.
         * @param quadX
         * @param quadY
         * @param mult Scalar to pad
         *
         * @returns x and y
         */
        if (!mult) {
            mult = 1;
        }
        let projectedX = (quadX * mult) + (window.innerWidth / 2);
        let projectedY = (quadY * mult) + (window.innerHeight / 2);
        return [projectedX, projectedY];
    }

    determineQuadrantWithClosestEnemy = () => {
        /**
         * @description Determines the quadrant with the closest enemy.
         * @returns x, y of quadrant with the most enemies. Bool denoting whether an enemy
         * was found within the critical radius.
        */

        let closeEnemies = [];
        let criticalEnemies = [];
        // Loop through all of the snakes in the area
        for (let enemy of snakes) {
            // We are in the snakes array, don't want to count ourselves
            if (enemy == snake) {
                continue;
            }
            let parts = [enemy, ...enemy.pts];
            for (let part of parts) {
                let partDistance = this.distance(part);
                if (partDistance <= this.criticalDistance) {
                    criticalEnemies.push(part);
                }
                // Enemy is within the radius
                if (partDistance <= this.keepAwayDistance) {
                    closeEnemies.push(part);
                }
            }
        }
        if (criticalEnemies.length > 0) {
            if (criticalEnemies.length > 1) {
                criticalEnemies.sort((a, b) => {
                    let distA = this.distance(a);
                    let distB = this.distance(b);
                    if (distA < distB) {
                        return -1;
                    } else if (distA > distB) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            }
            return [...this.determineQuadrant({
                xx: criticalEnemies[0].xx,
                yy: criticalEnemies[0].yy
            }), true];
        }

        if (closeEnemies.length > 0) {
            if (closeEnemies.length > 1) {
                closeEnemies.sort((a, b) => {
                    let distA = this.distance(a);
                    let distB = this.distance(b);
                    if (distA < distB) {
                        return -1;
                    } else if (distA > distB) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            }
            return [...this.determineQuadrant({
                xx: closeEnemies[0].xx,
                yy: closeEnemies[0].yy
            }), false];
        }
        return [null, null, false];
    }

    decideOptimalQuadrant = () => {
        /**
         * @description Determines the correct path to take.
         *
         * @returns X and Y coordinates to take.
        */
        let [quadX, quadY, withinCrit] = this.determineQuadrantWithClosestEnemy();
        if (withinCrit) {
            this.log(['within critical']);
            return [-quadX, -quadY, this.boostOnCrit];
        }

        let [foodQuadX, foodQuadY, withinLargeFoodDistance] = this.determineQuadrantWithNearestFood(quadX, quadY);
        return [foodQuadX, foodQuadY, (this.boostOnLargeFood && withinLargeFoodDistance)];
    }

    autoPilot = () => {
        if (playing) {
            let [optimalQuadX, optimalQuadY, shouldBoost] = this.decideOptimalQuadrant();
            let [projectedX, projectedY] = this.determineProjectedCoordinates(
                optimalQuadX, optimalQuadY, MOUSE_SCALAR);

            let mousemove = new MouseEvent('mousemove',
                { clientX: projectedX, clientY: projectedY });
            dispatchEvent(mousemove);
            if (shouldBoost) {
                this.boost(this.boostDuration);
            }
        } else {
            if (lastscore) {
                this.lastScore = Number(lastscore.innerText.split(' ')[lastscore.innerText.split(' ').length - 1]);
                this.stop();
                if (this.lastScore > this.highestScore) {
                    this.highestScore = this.lastScore;
                }

                if (this.autoRestart) {
                    this.foodCounts = {};
                    this.start();
                }
            }
        }
    }

    stop = () => {
        if (this.intervalID) {
            clearInterval(this.intervalID);
        }
        this.intervalID = null;
        return this;
    }

    start = () => {
        if (this.intervalID) {
            this.stop();
        }
        play_btn.elem.onclick();
        this.intervalID = setInterval(this.autoPilot, this.intervalRate);
        return this;
    }
}

let ap = new SlitherIOAutoPilot(config).start();
