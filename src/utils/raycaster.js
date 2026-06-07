// Raycaster engine for Solstice Cipher optical grid puzzles

const DIRECTIONS = {
  N: { dx: 0, dy: -1, opposite: "S" },
  S: { dx: 0, dy: 1, opposite: "N" },
  E: { dx: 1, dy: 0, opposite: "W" },
  W: { dx: -1, dy: 0, opposite: "E" }
};

// Returns new direction after mirror reflection
function reflectMirror(incomingDir, rotation) {
  // Rotation 0 or 180 acts like '/'
  // Rotation 90 or 270 acts like '\'
  const isSlash = (rotation === 0 || rotation === 180);
  
  if (isSlash) {
    if (incomingDir === "E") return "N";
    if (incomingDir === "W") return "S";
    if (incomingDir === "N") return "E";
    if (incomingDir === "S") return "W";
  } else {
    // Backslash '\'
    if (incomingDir === "E") return "S";
    if (incomingDir === "W") return "N";
    if (incomingDir === "N") return "W";
    if (incomingDir === "S") return "E";
  }
  return incomingDir;
}

export function calculateLightPaths(level, placedComponents, solsticeMode) {
  const gridSize = level.gridSize;
  const paths = []; // Array of path segments: { x1, y1, x2, y2, color, active }
  const activatedReceivers = new Set(); // Stores indices of activated receivers
  const visited = new Set(); // Loop detection: "x,y,dir,color"
  
  const maxSteps = 64;

  // Step 1: Find active emitters
  const activeEmitters = level.emitters.filter(emitter => {
    return emitter.activeIn === "both" || emitter.activeIn === solsticeMode;
  });

  // Step 2: Recursive cast function
  function castBeam(startX, startY, direction, color, stepCount = 0) {
    if (stepCount >= maxSteps) return;

    const key = `${startX},${startY},${direction},${color}`;
    if (visited.has(key)) return; // Loop detected, terminate
    visited.add(key);

    const dirConfig = DIRECTIONS[direction];
    const nextX = startX + dirConfig.dx;
    const nextY = startY + dirConfig.dy;

    // Check boundary
    if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) {
      // Beam exits grid, draw to boundary edge
      paths.push({
        x1: startX,
        y1: startY,
        x2: nextX,
        y2: nextY,
        color: color
      });
      return;
    }

    // Record this segment
    paths.push({
      x1: startX,
      y1: startY,
      x2: nextX,
      y2: nextY,
      color: color
    });

    // Check if we hit any block
    const isBlock = level.blocks.some(b => b.x === nextX && b.y === nextY);
    if (isBlock) return; // Light absorbed, stop path

    // Check if we hit a receiver
    // Receivers receive light if the beam matches the receiver's color
    // and hits from the correct input direction (opposite of receiver's face)
    level.receivers.forEach((receiver, idx) => {
      if (receiver.x === nextX && receiver.y === nextY) {
        const isCorrectDirection = (DIRECTIONS[direction].opposite === receiver.direction || receiver.direction === "any");
        const isCorrectColor = (color === receiver.color || receiver.color === "white" || color === "white");
        const isActiveCycle = (receiver.activeIn === "both" || receiver.activeIn === solsticeMode);

        if (isCorrectDirection && isCorrectColor && isActiveCycle) {
          activatedReceivers.add(idx);
        }
      }
    });

    // Check if there is a placed component at nextX, nextY
    const compKey = `${nextX},${nextY}`;
    const component = placedComponents[compKey];

    if (!component) {
      // Empty cell, propagate straight
      castBeam(nextX, nextY, direction, color, stepCount + 1);
      return;
    }

    if (component.type === "mirror") {
      const newDir = reflectMirror(direction, component.rotation);
      castBeam(nextX, nextY, newDir, color, stepCount + 1);
    } 
    else if (component.type === "splitter") {
      // Splitter splits beam into 2 paths: 90 deg left and 90 deg right
      let leftDir, rightDir;
      if (direction === "E" || direction === "W") {
        leftDir = "N";
        rightDir = "S";
      } else {
        leftDir = "W";
        rightDir = "E";
      }
      castBeam(nextX, nextY, leftDir, color, stepCount + 1);
      castBeam(nextX, nextY, rightDir, color, stepCount + 1);
    } 
    else if (component.type === "filter_red" || component.type === "filter_green" || component.type === "filter_blue") {
      const filterColor = component.type === "filter_red" ? "red" : component.type === "filter_green" ? "green" : "blue";
      
      if (color === "white") {
        // White light gets filtered to red/green/blue
        castBeam(nextX, nextY, direction, filterColor, stepCount + 1);
      } else if (color === filterColor) {
        // Matching colored light passes through
        castBeam(nextX, nextY, direction, color, stepCount + 1);
      }
      // Non-matching colors get blocked
    }
  }

  // Step 3: Run the cast for all active emitters
  activeEmitters.forEach(emitter => {
    // Emitter starts inside the cell, cast outward in its direction
    castBeam(emitter.x, emitter.y, emitter.direction, emitter.color);
  });

  return {
    paths,
    activatedReceivers: Array.from(activatedReceivers)
  };
}
