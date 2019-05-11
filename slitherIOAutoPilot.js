const TESTING = true;

const MOUSE_SCALAR = 50;
const INTERVAL_RATE = 100;
const FOOD_ID_COUNT_LIMIT = 50;
const ENEMY_BAIL_DISTANCE = 800;

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

const nearestFood = () => {
    /**
     * @description Determines the closest food to the snake.
     * @returns The nearest food object.
    */
    let nearestFood = null;
    let nearestDistance = 99999999;
    // Loop through the foods getting the distance to each one
    for (let food of foods) {
        // Foods get nulled out
        if (food) {
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
    return nearestFood
}

const determineHeading = (other) => {
    /**
     * @description Determines which quadrant the other is in..
     *
     * @returns X and Y.
     */
    let signX = Math.sign(other.xx - snake.xx);
    let signY = Math.sign(other.yy - snake.yy);
    return [signX, signY];
}


const determineProjectedCoordinates = (headingX, headingY, mult) => {
    /**
     * @description Adds some spacing between the snake and the coordinates for the mouse.
     * @param headingX
     * @param headingY
     * @param mult Scalar to pad
     *
     * @returns x and y
     */
    if (!mult) {
        mult = 1;
    }
    let projectedX = (headingX * mult) + (window.innerWidth / 2);
    let projectedY = (headingY * mult) + (window.innerHeight / 2);
    return [projectedX, projectedY];
}

const determineIfOnCollisionCourse = (foodHeadingX, foodHeadingY) => {
    /**
     * @description Determines if the coordinates are on an imminent collision
     * course.
    * @param foodHeadingX
    * @param foodHeadingY
     *
     * @returns true if on collision course, else false.
    */

    let closestEnemy = null;
    // Loop through all of the snakes in the area
    for (let enemy of snakes) {
        let [enemyHeadingX, enemyHeadingY] = determineHeading(enemy);
        // Food and enemy in same quadrant
        if ((enemyHeadingX == foodHeadingX) && (enemyHeadingY == foodHeadingY)) {
            let enemyDistance = distance(enemy);
            if (enemyDistance <= ENEMY_BAIL_DISTANCE) {
                if (closestEnemy) {
                    if (enemyDistance < distance(closestEnemy)) {
                        closestEnemy = enemy;
                    }
                } else {
                    closestEnemy = enemy;
                }
            }
        }
    }
    if (closestEnemy) {
        return determineHeading(closestEnemy);
    }
    return [false, false];
}

const decideOptimalHeading = () => {
    /**
     * @description Determines the correct path to take. If nearest food is
     * on a collision
     * course then turn.
     *
     * @returns X and Y coordinates to take.
    */
    let food = nearestFood();
    let [foodHeadingX, foodHeadingY] = determineHeading(food);
    let [enemyHeadingX, enemyHeadingY] = determineIfOnCollisionCourse(foodHeadingX, foodHeadingY);
    if (enemyHeadingX && enemyHeadingY) {
        // turn out of there
        log(['Enemy close: ', -enemyHeadingX, -enemyHeadingY]);
        return [-enemyHeadingX, -enemyHeadingY];
    }
    // Otherwise continue forward
    return [foodHeadingX, foodHeadingY];
}

const autoPilot = () => {
    if (playing) {
        let [optimalHeadingX, optimalHeadingY] = decideOptimalHeading();
        let [projectedX, projectedY] = determineProjectedCoordinates(
            optimalHeadingX, optimalHeadingY, MOUSE_SCALAR);

        let mousemove = new MouseEvent('mousemove',
            { clientX: projectedX, clientY: projectedY });
        dispatchEvent(mousemove);
        log(['Mouse to: ', projectedX, projectedY]);
    } else {
        if (lastscore) {
            let score = Number(lastscore.innerText.split(' ')[lastscore.innerText.split(' ').length - 1]);
            if (score > highestScore) {
                highestScore = score;
                log('Highest score: ', highestScore);
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
