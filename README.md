# slitherIOAutoPilot
A Slither IO bot I created for a netArt intervention project.

To run just copy and paste the code into the browser console and hit enter.

Possible variables to play with:
```javascript

let config = {
    test: false, // log to console
    autoRestart: true, // automatically start play
    intervalRate: 50,// sampling rate in ms
    foodIdCountLimit: 75,// how many times to allow the same id to be chosen as closest before bailing
    keepAwayDistance: 400, // try to stay away from enemies distance
    criticalDistance: 100, // enemies are too close distance
    boostOnCrit: false, // should boost away if enemy is within crit
    boostOnLargeFood: true, // should boost towards large food
    boostOnLargeFoodDistance: 100, // distance large food neads to be within to trigger boost
    boostOnLargeFoodSize: 100, // size of the food to consider large
    foodPrioritySize: 50, // prioritize lesser foods of size greater than
    foodPriorityDistance: 75, // prioritize lesser foods within range
    boostDuration: 750 // how long to hold boost
}
```
