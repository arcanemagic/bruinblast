Bruin Blast-- CS174A Final Project 

### Team member names and UIDs
1. Sophia Adrangi 405484745 sophiaadrangi@gmail.com
2. Siyu Chen 705619559 schen1923@g.ucla.edu
3. Dhruv Jain 505531435 dhruvjain@g.ucla.edu

### Overview
This project is inspired by Fruit Ninja. The game lasts 2 minutes. At regular intervals, 1 of 3 objects--a bruin bear, a trojan helmet, or a bomb--will spawn in the game. The player's goal is either to click or slash (by holding down the mouse) through the trojan helmets to gain points while avoiding the bruin bears and bomb. If the player fails to destroy a trojan helmet before it falls off screen (all objects are influenced by gravity) the player will lose a life. If the player slashes/clicks a bruin bear he will also lose a life. If the player slashes/clicks a bomb he loses instantly. The game ends either when the player has lost all lives, clicked a bomb, or the 2 minutes are up. 

### Design and Implementation
1. As our models are very detailed and quite expensive to load in, the program starts by making an "object deposit" in the constructor. Though the game looks like it can hypothetically have infinite objects, there are truly only 4 objects actually constructed. We maintain the illusion of infinite objects by simply recycling objects that are inactive--i.e. they've either been destroyed by the player or have fallen off screen. 
2. We use a time-based algorithm to determine when to "spawn" a new object. As said before, however, no new objects are actually constructed; we just recycle an old object and "reinitialize" it with a bunch of parameters--i.e. spawn location, spawn velocity, object type, spawn time--to make it seem like a new object. See the setup() function in object.js 
3. All objects follow a partial or complete parabolic path according to the kinematic equations where the only acceleration is gravitational acceleration. 
4. Players can click or slash objects. 
5. Clicking on an object changes game state depending on the object type & current game state. See overview for a description. For bruin bears and trojan helmets, clicking on them also causes them to split in halves that fly apart. 

### Advanced features
#### Mouse-picking
In order to make it possible for players to click/slash an object, we first draw bounding boxes in the same location as the object.
We chose to do bounding boxes instead of just drawing the exact same object shape to make it a little easier on the player (They have a larger area for which a click/slash will be successful). These bounding boxes will have a uniform color based on some ID. When the mouse is held down and then released, our program takes the pixel at the midpoint of the mousedown/mouseup locations and reads the color of that pixel. If the pixel color, converted to a numerical ID, matches one of the object's IDs, we know that object has been clicked/slashed. The screen is then cleared and then the actual objects with their appropriate colors and shapes are drawn. 

In order to draw the bounding boxes with a particular color, we made our own stripped down shader. It is adapted from the Phong Shader and does not consider the effects of lighting. 

#### Physics 
All objects follow a parabolic path based on gravity. We kept track of "air time" of the object by comparing current program time against the spawn time of the object and then used that air time, gravitational acceleration, and kinematics equations to translate the object to the appropriate location. 

#### Contributions
1. Sophia Adrangi implemented mouse picking, the algorithm for object recycling, and the object class. She also helped debug the "object-splits-apart-when-clicked" animation. 
2. Siyu Chen implemented physics, the spawn-time algorithm, the timer, the win/lose screens, and helped implement the splitting apart of objects when they're clicked. 
3. Dhruv Jain made all of the models and helped implement the splitting apart of objects when they're clicked. 

### References
The mouse picking code where IDs are converted to colors and vice versa was based on: 
https://webglfundamentals.org/webgl/lessons/webgl-picking.html


