# slitherIOAutoPilot
A Slither IO bot I created for a netArt intervention project.

To run just copy and paste the code into the browser console and hit enter.

Possible variables to play with:
```javascript

let config = {
    test: true, // log to console
    autoRestart: true, // automatically start play
    intervalRate: 50, // sampling rate in ms
    foodIdCountLimit: 75, // how many times to allow the same id to be chosen as closest before bailing
    keepAwayDistance: 0, // try to stay away from enemies distance
    criticalDistance: 300, // enemies are too close distance
    boostOnCrit: false, // should boost away if enemy is within crit
    boostDuration: 750, // how long to hold boost
}
```
