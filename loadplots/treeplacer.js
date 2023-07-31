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
    float(x, y) {
        x = Math.min(this.widthPixels - 1, Math.max(0, Math.floor(x * this.widthPixels - 0.5)));
        y = Math.min(this.heightPixels - 1, Math.max(0, Math.floor(y * this.heightPixels - 0.5)));
        const i = 4 * (x + this.widthPixels * y);
        return new Float32Array(this.heightDataUin8.buffer, i, 1)[0]; // Convert to float and return
    }
    minFloat(x, y) {
        return Math.min(
            this.float(x-this.ux/2, y-this.ux/2),
            this.float(x+this.ux/2, y-this.uy/2),
            this.float(x-this.ux/2, y+this.uy/2),
            this.float(x+this.ux/2, y+this.uy/2)
        );
    }

    get areaInSquareMeters() {
        return this.widthMeters * this.heightMeters;
    }

    get areInHectares() {
        return this.areaInSquareMeters / 10000;
    }

    sampleHeightInMeters(xInMeters, yInMeters) {
        return this.sampleHeightIn01(xInMeters / this.widthMeters, yInMeters / this.heightMeters);
    }

    sampleHeightIn01(x01, y01) {
        return this.minFloat(x01, y01);
    }

    placeTreesForSingleYear(plotsSet, plotNumbers, year) {
        console.assert(plotNumbers.length > 0, "No plots given");

        if (plotNumbers.length > 1) {
            console.warn("TreePlacer.placeTreesForSingleYear() is work in progress and will only use one plot for now.");
        }

        const positionsOutput = [];

        const plot = plotsSet.plotYears.get(plotNumbers[0]).get(year);

        console.log("Terrain area in hectares:", this.areInHectares);

        for (const tree of plot.trees) {

            const treeCount = Math.round(tree.countPerHectare * this.areInHectares);

            console.log(tree.speciesEnglish, treeCount, tree);

            for (let i = 0; i < treeCount; i++) {
                    
                    const x = Math.random();
                    const z = Math.random();
                    const y = this.sampleHeightIn01(x, z);

                    positionsOutput.push({
                        x: x * this.widthMeters,
                        y: y,
                        z: z * this.heightMeters
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