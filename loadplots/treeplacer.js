import bluenoise from "../bluenoise/bluenoise.js";

export class TreePlacer {
    constructor(heightDataUin8, widthPixels, heightPixels, widthMeters, heightMeters) {
        this.heightDataUin8 = heightDataUin8;
        this.widthPixels = widthPixels;
        this.heightPixels = heightPixels;
        this.widthMeters = widthMeters;
        this.heightMeters = heightMeters;

        this.ux = 1 / this.widthPixels; // X unit
        this.uy = 1 / this.heightPixels; // Y unit
    }

    // Gets a float value at the position (x,y) in the texture, with x and y in range [0,1]
    readTexture(x, y) {
        x = Math.min(this.widthPixels - 1, Math.max(0, Math.floor(x * this.widthPixels - 0.5)));
        y = Math.min(this.heightPixels - 1, Math.max(0, Math.floor(y * this.heightPixels - 0.5)));
        const i = 4 * (x + this.widthPixels * y);
        return new Float32Array(this.heightDataUin8.buffer, i, 1)[0]; // Convert to float and return
    }
    minFloat(x, y) {
        return Math.min(
            this.readTexture(x-this.ux/2, y-this.ux/2),
            this.readTexture(x+this.ux/2, y-this.uy/2),
            this.readTexture(x-this.ux/2, y+this.uy/2),
            this.readTexture(x+this.ux/2, y+this.uy/2)
        );
    }
    sampleTextureLinear(x, y) {
        
        const a = this.readTexture(x-this.ux/2, y-this.ux/2);
        const b = this.readTexture(x+this.ux/2, y-this.uy/2);
        const c = this.readTexture(x-this.ux/2, y+this.uy/2);
        const d = this.readTexture(x+this.ux/2, y+this.uy/2);
        return (a+b+c+d) / 4.0;
    }

    get areaInSquareMeters() {
        return this.widthMeters * this.heightMeters;
    }

    get areaInHectares() {
        return this.areaInSquareMeters / 10000;
    }

    sampleHeightInMeters(xInMeters, yInMeters) {

        return this.sampleHeightIn01(xInMeters / this.widthMeters, yInMeters / this.heightMeters);
    }

    sampleHeightIn01(x01, y01) {
        return this.sampleTextureLinear(x01, y01);
    }

    shuffle(array) {
        let currentIndex = array.length,  randomIndex;
      
        // While there remain elements to shuffle.
        while (currentIndex != 0) {
      
          // Pick a remaining element.
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
      
          // And swap it with the current element.
          [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
        }
      
        return array;
      }

    populateTreesPreprocessing(simulation) 
    {
        console.assert(simulation.size > 0, "No plots given");
        console.log("Terrain area in hectares:", this.areaInHectares);

        // maps treeNr to countPerHectare
        const treeMap = new Map();

        // calculate total number of required sample points for all tree in the whole simulation
        for (const plot of simulation)
        {
            for (const tree of plot[1].trees)
            {
                if(treeMap.has(tree.number)) {
                    if(tree.countPerHectare != treeMap.get(tree.number)) {
                        console.assert(tree.countPerHectare != treeMap.get(tree.number), "N_rep_ha has changed");
                    }
                } else {
                    treeMap.set(tree.number, tree.countPerHectare);
                }
                
            }
        }
        
        let totalTreeCount = 0;
        
        // iterate over all trees and calculate total number of required sample points
        for (const [treeNr, countPerHectare] of treeMap)
        {
            totalTreeCount += Math.round(countPerHectare * this.areaInHectares);
        }

        // calculate potential positions for trees
        const positions = bluenoise(this.widthMeters, this.heightMeters, totalTreeCount); 

        this.shuffle(positions);

        const treeCountMultiplier = positions.length / totalTreeCount;
        if (treeCountMultiplier < 1) {
            console.warn("Not enough space for all " + totalTreeCount + " trees. Reducing tree count by " + ((1 - treeCountMultiplier) * 100).toFixed(2) + "% to at most " + positions.length + " trees.");
        } else if (treeCountMultiplier > 1) {
            console.warn("More than enough space for all " + totalTreeCount + " trees. Increasing tree count by " + ((treeCountMultiplier - 1) * 100).toFixed(2) + "% to at most " + positions.length + " trees.");
        }                     
        
        let positionIndex = 0;
        const plot = simulation.entries().next().value[1];

        const groundWidth = 2850;
        const groundHeight = 2850;
        const groundElevationMin = 0;
        const groundElevationMax = 500;
        
        const output = new Map();
        for (const [treeNr, countPerHectare] of treeMap)
        {
            const treePositions = [];
            const count = Math.floor( (countPerHectare * this.areaInHectares) * treeCountMultiplier);
            for (let j = 0; j < count; j++) 
            {
                const x = positions[positionIndex][0] - groundWidth/2;
                const z = positions[positionIndex][1] - groundHeight/2;
                const y = (this.sampleHeightInMeters(positions[positionIndex][0], positions[positionIndex][1]) * (groundElevationMax - groundElevationMin)) + groundElevationMin;

                ++positionIndex;

                treePositions.push({
                    x: x,
                    y: y,
                    z: z
                });
                
                output.set(treeNr, treePositions);
            }
        }
        
        return output;
    }

    populateTrees(plots) 
    {
        console.assert(plots.length > 0, "No plots given");

        const positionsOutput = [];
        const treeInfoOutput = [];

        console.log("Terrain area in hectares:", this.areaInHectares);

        const plotWidth = this.widthMeters / plots.length;
        
        for (let i = 0; i < plots.length; i++) 
        {
            const plot = plots[i];
            let totalTreeCount = 0;
            for (const tree of plot.trees) 
            {
                let count = Math.round(tree.countPerHectare * this.areaInHectares / plots.length);
                totalTreeCount += count;
            }


            const positions = bluenoise(plotWidth, this.heightMeters, totalTreeCount); 
            
            const treeCountMultiplier = positions.length / totalTreeCount;
            if (treeCountMultiplier < 1) {
                console.warn("Not enough space for all " + totalTreeCount + " trees. Reducing tree count by " + ((1 - treeCountMultiplier) * 100).toFixed(2) + "% to at most " + positions.length + " trees.");
            } else if (treeCountMultiplier > 1) {
                console.warn("More than enough space for all " + totalTreeCount + " trees. Increasing tree count by " + ((treeCountMultiplier - 1) * 100).toFixed(2) + "% to at most " + positions.length + " trees.");
            }
            
            let positionIndex = 0;

            for (const tree of plot.trees) 
            {
                const count = Math.floor( (tree.countPerHectare * this.areaInHectares / plots.length) * treeCountMultiplier);
                for (let j = 0; j < count; j++) 
                {
                    const x = positions[positionIndex][0] + plotWidth * i;
                    const z = positions[positionIndex][1];
                    const y = this.sampleHeightInMeters(x, z);

                    ++positionIndex;
   
                    positionsOutput.push({
                        x: x,
                        y: y,
                        z: z
                    });
                    treeInfoOutput.push({
                        treeNr : tree.number,
                        treeHeight : tree.treeHeight,
                        snag : tree.snag
                    });
                }

            }
        }
        return [positionsOutput, treeInfoOutput];
    }


    placeTreesForSingleYear(plotsSet, plotNumbers, year) {
        console.assert(plotNumbers.length > 0, "No plots given");

        if (plotNumbers.length > 1) {
            console.warn("TreePlacer.placeTreesForSingleYear() is work in progress and will only use one plot for now.");
        }

        const positionsOutput = [];

        const plot = plotsSet.plotYears.get(plotNumbers[0]).get(year);

        console.log("Terrain area in hectares:", this.areaInHectares);

        let totalTreeCount = 0;
        for (const tree of plot.trees) {
            totalTreeCount += Math.round(tree.countPerHectare * this.areaInHectares);
        }

        //const positions = bluenoise(this.widthMeters, this.heightMeters, totalTreeCount);
        const positions = bluenoise(this.widthMeters, this.heightMeters, totalTreeCount);
        const treeCountMultiplier = positions.length / totalTreeCount;
        if (treeCountMultiplier < 1) {
            console.warn("Not enough space for all " + totalTreeCount + " trees. Reducing tree count by " + ((1 - treeCountMultiplier) * 100).toFixed(2) + "% to at most " + positions.length + " trees.");
        } else if (treeCountMultiplier > 1) {
            console.warn("More than enough space for all " + totalTreeCount + " trees. Increasing tree count by " + ((treeCountMultiplier - 1) * 100).toFixed(2) + "% to at most " + positions.length + " trees.");
        }

        let positionIndex = 0;
        for (const tree of plot.trees) {

            const treeCount = Math.floor(tree.countPerHectare * this.areaInHectares * treeCountMultiplier);

            console.log(tree.speciesEnglish, treeCount, tree);

            for (let i = 0; i < treeCount; i++) {
                    
                    const x = positions[positionIndex][0];//Math.random();
                    const z = positions[positionIndex][1];//Math.random();
                    const y = this.sampleHeightInMeters(x, z);

                    ++positionIndex;

                    positionsOutput.push({
                        x: x,
                        y: y,
                        z: z
                    });

            }

        }

        /*const trees = new Map();

        for (const plotInput of plotsInput) {

            const treesInput = plotInput.years.get(year);
            for (const treeInput of treesInput) {

                let treesOfSameSpecies = trees.get(treeInput.speciesLatin);
                if (treesOfSameSpecies === undefined) {
                    treesOfSameSpecies = [];
                    trees.set(treeInput.speciesLatin, treesOfSameSpecies);
                }
                treesOfSameSpecies.push({ treeInput, plotInput });

            }

        }
        
        for (const [speciesLatin, treesOfSameSpecies] of trees) {
            for (const tree of treesOfSameSpecies) {

                const treeCount = Math.round(tree.plotInput.area / tree.treeInput.countPerHectare);

                console.log(treeCount, tree.treeInput);

                for (let i = 0; i < treeCount; i++) {
                        
                        const x = Math.random();
                        const z = Math.random();
                        const y = this.sampleHeightInMeters(x, z);
    
                        positionsOutput.push({
                            x: x * this.widthMeters,
                            y: y,
                            z: z * this.heightMeters
                        });

                }

            }
        }*/

        return positionsOutput;
    }
}