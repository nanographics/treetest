//import * as POISSON from "https://cdn.jsdelivr.net/gh/kchapelier/poisson-disk-sampling@2.3.1/build/poisson-disk-sampling.min.js";
//import * as POISSON from "https://cdn.jsdelivr.net/gh/kchapelier/fast-2d-poisson-disk-sampling@1.0.3/build/fast-poisson-disk-sampling.min.js";

export default function bluenoise(width, height, numPoints) {
    return new FastPoissonDiskSampling({
        shape: [width, height],
        radius: Math.sqrt(width * height / numPoints),
        tries: 30,
    }).fill();
}

/*
export default function bluenoise(width, height, numPoints) {
    // Generate random 2D position in range [0,width]x[0,height] following blue noise distribution
    // Source 1: https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
    // Source 2: https://www.jasondavies.com/poisson-disc/
    // Source 3: https://observablehq.com/@techsparx/an-improvement-on-bridsons-algorithm-for-poisson-disc-samp/2
    
    //const minDistanceBetweenPoints = Math.sqrt(width * height / numPoints);
    const minDistanceBetweenPoints = 2.5;

    const maxIterations = 30; // As recommended in Source 1

    const cellSize = minDistanceBetweenPoints / Math.sqrt(2); // As recommended in Source 1

    const gridWidth = Math.ceil(width / cellSize);
    const gridHeight = Math.ceil(height / cellSize);
    const grid = new Float32Array(gridWidth * gridHeight); // Zero means no sample; positive means sample index + 1

    console.log("Grid size:", gridWidth, "x", gridHeight, "=", grid.length, "cells for " + numPoints + " points");

    const _2dTo1d = (x, y) => x + y * gridWidth;

    const initialSample = Math.random() * grid.length;
    grid[initialSample] = initialSample + 1; // Sample index + 1; to distinguish from zero

    const activeList = [initialSample];
    
    const output = [];
    output.push(initialSample);

    while (activeList.length > 0) {
        const randomIndex = Math.floor(Math.random() * activeList.length);
        const sampleIndex = activeList[randomIndex];
        const sampleX = sampleIndex % gridWidth;
        const sampleY = Math.floor(sampleIndex / gridWidth);

        let found = false;
        for (let i = 0; i < maxIterations; ++i) {

            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * minDistanceBetweenPoints + minDistanceBetweenPoints;

            const x = sampleX + Math.cos(angle) * distance;
            const y = sampleY + Math.sin(angle) * distance;
            if (x < 0 || x >= width || y < 0 || y >= height) {
                continue;
            }

            const gridX = Math.floor(x / cellSize);
            const gridY = Math.floor(y / cellSize);
            const gridIndex = _2dTo1d(gridX, gridY);
            if (grid[gridIndex] !== 0) {
                continue;
            }

            const distanceToClosestSample = Math.sqrt(
                Math.pow(x - sampleX, 2) +
                Math.pow(y - sampleY, 2)
            );

            if (distanceToClosestSample < minDistanceBetweenPoints) {
                continue;
            }
            grid[gridIndex] = sampleIndex + 1; // Sample index + 1; to distinguish from zero
            activeList.push(gridIndex);
            output.push([x, y]);
            found = true;
            break;

        }
        if (!found) {
            activeList.splice(randomIndex, 1);
        }
    }

    return output;
}
*/