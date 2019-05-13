const TESTING = true;

const MOUSE_SCALAR = 50;
const INTERVAL_RATE = 100;
const FOOD_ID_COUNT_LIMIT = 50;
const ENEMY_BAIL_DISTANCE = 800;
const ONLY_LOOK_IN_FOOD_QUADRANT = false;

let intervalID = null;
let lastFoodID = 0;
let foodIDCount = 0;

let highestScore = 0;

const log = (msg) => {
    if (TESTING) {
        console.log(msg);
    }
}

const boost = (duration) => {
    if (!duration) {
        duration = 500;
    }
    dispatchEvent(new Event('mousedown'));
    log('Boosting');
    setTimeout(() => {
        dispatchEvent(new Event('mouseup'));
    }, duration);
}

const updateFoodIDCount = (foodID) => {
    if (foodID == lastFoodID) {
        if (foodIDCount > FOOD_ID_COUNT_LIMIT) {
            foodIDCount = 0;
            log('Caught in circle');
            boost();
        } else {
            foodIDCount++;
        }
    } else {
        foodIDCount = 0;
    }
    lastFoodID = foodID;
}

const distance = (other) => {
    /**
     * @description Returns the distance between the snake and other.
     * @param other Other object.
     *
     * @returns The distance as a number.
    */
    return Math.sqrt(Math.pow(snake.xx - other.xx, 2) +
        Math.pow(snake.yy - other.yy, 2));
}

const determineQuadrant = (other) => {
    /**
     * @description Determines which quadrant the other is in..
     *
     * @returns X and Y.
     */
    let signX = Math.sign(other.xx - snake.xx);
    let signY = Math.sign(other.yy - snake.yy);
    return [signX, signY];
}

const nearestFoodQuadrant = (quadX, quadY) => {
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
            let [foodQuadX, foodQuadY] = determineQuadrant(food);
            if ((quadX && quadY) &&
                (quadX == foodQuadX && quadY == foodQuadY)) {
                continue;
            }
            let dist = distance(food);
            if (dist < nearestDistance) {
                nearestFood = food;
                nearestDistance = dist;
            }
        }
    }
    if (nearestFood) {
        updateFoodIDCount(nearestFood.id);
    }
    return determineQuadrant(nearestFood);
}

const determineProjectedCoordinates = (quadX, quadY, mult) => {
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

const determineQuadrantWithMostEnemies = () => {
    /**
     * @description Determines the quadrant with the most amount of enemies.
     * @returns x, y of quadrant with the most enemies.
    */

    let closeEnemies = [];
    // Loop through all of the snakes in the area
    for (let enemy of snakes) {
        let parts = [enemy, ...enemy.pts];
        for (let part of parts) {
            let partDistance = distance(part);
            // Enemy is within the radius
            if (partDistance <= ENEMY_BAIL_DISTANCE) {
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
        return determineQuadrant({ xx: avgX, yy: avgY });
    }
    return [null, null];
}

const decideOptimalQuadrant = () => {
    /**
     * @description Determines the correct path to take.
     *
     * @returns X and Y coordinates to take.
    */
    let [quadX, quadY] = determineQuadrantWithMostEnemies();
    let [foodQuadX, foodQuadY] = nearestFoodQuadrant(quadX, quadY);
    log(['quad with most enemies: ', quadX, quadY]);
    log(['going to quad: ', foodQuadX, foodQuadY]);
    return [foodQuadX, foodQuadY];
}

const drawMousePointer = (x, y, color) => {
    if (!color) {
        color = 'white';
    }
    ctx.beginPath();
    ctx.fillstyle = color;
    ctx.arc(x, y, 50, 0, 2 * Math.PI);
    ctx.fill();
}

const autoPilot = () => {
    if (playing) {
        let [optimalQuadX, optimalQuadY] = decideOptimalQuadrant();
        let [projectedX, projectedY] = determineProjectedCoordinates(
            optimalQuadX, optimalQuadY, MOUSE_SCALAR);

        let mousemove = new MouseEvent('mousemove',
            { clientX: projectedX, clientY: projectedY });
        drawMousePointer(projectedX, projectedY);
        dispatchEvent(mousemove);
    } else {
        if (lastscore) {
            let score = Number(lastscore.innerText.split(' ')[lastscore.innerText.split(' ').length - 1]);
            if (score > highestScore) {
                highestScore = score;
                log(['Highest score: ', highestScore]);
                prompt("Click to continue...");
            } else {
                play_btn.elem.onclick();
            }
        }
    }
}

const stopAutoPilot = () => {
    if (intervalID) {
        clearInterval(intervalID);
    }
}

const startAutoPilot = () => {
    if (intervalID) {
        stopAutoPilot();
    }
    intervalID = setInterval(autoPilot, INTERVAL_RATE);
}

startAutoPilot();
