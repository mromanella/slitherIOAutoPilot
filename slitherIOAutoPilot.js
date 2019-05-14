const MOUSE_SCALAR = 50;

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
    test: false,
    autoRestart: true,
    intervalRate: 100,
    foodIdCountLimit: 50,
    keepAwayDistance: 600,
    criticalDistance: 225,
    boostDuration: 1200,
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
        Object.assign(this, config);
        this.intervalID = null;
        this.lastFoodID = 0;
        this.foodIDCount = 0;
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
        if (foodID == this.lastFoodID) {
            if (this.foodIDCount > this.foodIdCountLimit) {
                this.foodIDCount = 0;
                this.log('Caught in circle');
                this.boost();
            } else {
                this.foodIDCount++;
            }
        } else {
            this.foodIDCount = 0;
        }
        this.lastFoodID = foodID;
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

    nearestFoodQuadrant = (quadX, quadY) => {
        /**
         * @description Determines the closest food to the snake.
         * @params quadX
         * @params quadY
         * @returns The nearest food quadrant x and y. If quadX and Y are
         * given then returns
         * the nearest food object not in that quad.
        */
        let nearestFood = null;
        let nearestDistance = 99999999;
        // Loop through the foods getting the distance to each one
        for (let food of foods) {
            // Foods get nulled out
            if (food) {
                let [foodQuadX, foodQuadY] = this.determineQuadrant(food);
                if ((quadX && quadY) &&
                    (quadX == foodQuadX && quadY == foodQuadY)) {
                    continue;
                }
                let dist = this.distance(food);
                if (dist < nearestDistance) {
                    nearestFood = food;
                    nearestDistance = dist;
                }
            }
        }
        if (nearestFood) {
            this.updateFoodIDCount(nearestFood.id);
        }
        return this.determineQuadrant(nearestFood);
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

    determineQuadrantWithMostEnemies = () => {
        /**
         * @description Determines the quadrant with the most amount of enemies.
         * @returns x, y of quadrant with the most enemies.
        */

        let closeEnemies = [];
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
                    return [...this.determineQuadrant(part), true];
                }
                // Enemy is within the radius
                if (partDistance <= this.keepAwayDistance) {
                    closeEnemies.push(part);
                }
            }
        }
        if (closeEnemies) {
            let sumX = 0;
            let sumY = 0;
            for (let part of closeEnemies) {
                sumX += part.xx;
                sumY += part.yy;
            }
            let avgX = sumX / closeEnemies.length;
            let avgY = sumY / closeEnemies.length;
            return [...this.determineQuadrant({ xx: avgX, yy: avgY }), false];
        }
        return [null, null, false];
    }

    decideOptimalQuadrant = () => {
        /**
         * @description Determines the correct path to take.
         *
         * @returns X and Y coordinates to take.
        */
        let [quadX, quadY, withinCrit] = this.determineQuadrantWithMostEnemies();
        if (withinCrit) {
            this.log(['within critical']);
            return [-quadX, -quadY, true];
        }

        let [foodQuadX, foodQuadY] = this.nearestFoodQuadrant(quadX, quadY);
        this.log(['quad with most enemies: ', quadX, quadY]);
        this.log(['going to quad: ', foodQuadX, foodQuadY]);
        return [foodQuadX, foodQuadY, false];
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
                this.stopAutoPilot();
                if (this.autoRestart) {
                    this.startAutoPilot();
                }
            }
        }
    }

    stopAutoPilot = () => {
        if (this.intervalID) {
            clearInterval(this.intervalID);
        }
        this.intervalID = null;
        return this;
    }

    startAutoPilot = () => {
        if (this.intervalID) {
            this.stopAutoPilot();
        }
        play_btn.elem.onclick();
        this.intervalID = setInterval(this.autoPilot, this.intervalRate);
        return this;
    }
}

let ap = new SlitherIOAutoPilot(config).startAutoPilot();
