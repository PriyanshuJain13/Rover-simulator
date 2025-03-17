let activeMode = 'locked';
let motor1aFactor = 1;
let motor1bFactor = 1;
let motor2aFactor = 1;
let motor2bFactor = 1;

function modeSelect(mode) {
    activeMode = mode;
    console.log(activeMode);
}

function rotateAngle(angle) {
    if (angle >= 0) {
        rotateRight(angle);
    } else {
        rotateLeft(Math.abs(angle));
        console.log(angle);
    }
}

function direction(xAxis, yAxis) {
    console.log(`x-axis: ${xAxis}`);
    console.log(`y-axis: ${yAxis}`);
    
    let mappedX = xAxis;
    let mappedY = yAxis;
    
    let v1 = mappedY + mappedX;
    let v2 = mappedY - mappedX;
    let v3 = mappedY - mappedX;
    let v4 = mappedY + mappedX;
    
    let vMax = Math.max(Math.abs(v1), Math.abs(v2), Math.abs(v3), Math.abs(v4));
    if (vMax > 1) {
        v1 /= vMax;
        v2 /= vMax;
        v3 /= vMax;
        v4 /= vMax;
    }
    
    motor1aFactor = v1;
    motor1bFactor = v2;
    motor2aFactor = v3;
    motor2bFactor = v4;
    
    console.log(v1, v2, v3, v4);
    
    if (xAxis === 0 && yAxis === 0) {
        motor1aFactor = 1;
        motor1bFactor = 1;
        motor2aFactor = 1;
        motor2bFactor = 1;
    }
}

function parser(parsedData) {
    if ('mode' in parsedData) {
        modeSelect(parsedData.mode);
    }
    
    if (activeMode == "controller") {
        if ('throttle' in parsedData) {
            throttleValue(parsedData.throttle);
        }
        
        if ('dir_rot' in parsedData) {
            rotateAngle(parsedData.dir_rot);
        }
        
        if ('dir_x' in parsedData && 'dir_y' in parsedData) {
            direction(parsedData.dir_x, parsedData.dir_y);
        }
    }
}

module.exports = { modeSelect, rotateAngle, direction, parser };