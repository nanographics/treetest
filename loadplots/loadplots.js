/*const COLUMN_MAP = {
    Plot: "number",
    BaumNr: "number",
    Year: "year",
    x_koord: "xCoord",
    y_koord: "yCoord",
    elevation: "elevation",
    Wuchsgebiet: "growingArea",
    BFI_Bezirksforstinspektion: "district",
    PlotRepArea: "area",
    TreeNr: "number",
    Age: "age",
    Diameter: "diameter",
    Tree_height: "treeHeight",
    Trunk_height: "trunkHeight",
    Crown_height: "crownHeight",
    Crown_diameter: "crownDiameter",
    Snag: "snag",
    Tree_species_LA: "speciesLatin",
    Tree_species_DE: "speciesGerman",
    Tree_species_EN: "speciesEnglish",
    N_rep_ha: "countPerHectare",
    Plot_tree: "uniqueId"
};*/

export class Tree {
    number;
    age;
    diameter;
    treeHeight;
    trunkHeight;
    crownHeight;
    crownDiameter;
    snag; // 0=living, 1=dead
    speciesLatin;
    speciesGerman;
    speciesEnglish;
    countPerHectare;
    uniqueId;
    constructor(number, age, diameter, treeHeight, trunkHeight, crownHeight, crownDiameter, snag, speciesLatin, speciesGerman, speciesEnglish, countPerHectare, uniqueId) {
        this.number = number;
        this.age = age;
        this.diameter = diameter;
        this.treeHeight = treeHeight;
        this.trunkHeight = trunkHeight;
        this.crownHeight = crownHeight;
        this.crownDiameter = crownDiameter;
        this.snag = snag;
        this.speciesLatin = speciesLatin;
        this.speciesGerman = speciesGerman;
        this.speciesEnglish = speciesEnglish;
        this.countPerHectare = countPerHectare;
        this.uniqueId = uniqueId;
    }
}

export class Plot {
    number;
    year;
    xCoord;
    yCoord;
    elevation;
    district;
    area;
    growingArea; // Wuchsgebiet
    constructor(number, year, xCoord, yCoord, elevation, district, area, growingArea) {
        this.number = number;
        this.year = year;
        this.xCoord = xCoord;
        this.yCoord = yCoord;
        this.elevation = elevation;
        this.district = district;
        this.area = area;
        this.growingArea = growingArea;
    }

    trees = [];

    addTree(tree) {
        this.trees.push(tree);
    }
}

export class PlotsSet {
    plotYears = new Map();
    constructor(csvString) {
        const lines = csvString.replace(/\r/g, "").split("\n");

        const columns = lines[0].split(",").map(x => x.substring(1, x.length - 1));//.map(x => COLUMN_MAP[x]);

        for (let i = 1; i < lines.length; i++) {
            const row = new Map();

            lines[i]
                .split(",")
                .map(x => x.startsWith("\"") ? x.replace(/"/g, "").trim() : parseFloat(x))
                .forEach((x, i) => row.set(columns[i], x));

            let plotYears = this.plotYears.get(row.get("Plot"));
            if (plotYears === undefined) {
                plotYears = new Map();
                this.plotYears.set(row.get("Plot"), plotYears);
            }
            
            let plot = plotYears.get(row.get("Year"));
            if (plot === undefined) {
                plot = new Plot(
                    row.get("Plot"),
                    row.get("Year"),
                    row.get("x_koord"),
                    row.get("y_koord"),
                    row.get("elevation"), 
                    row.get("BFI_Bezirksforstinspektion"),
                    row.get("PlotRepArea"),
                    row.get("Wuchsgebiet")
                );
                plotYears.set(plot.year, plot);
            }

            const tree = new Tree(
                row.get("TreeNr"),
                row.get("Age"),
                row.get("Diameter"), 
                row.get("Tree_height"),
                row.get("Trunk_height"),
                row.get("Crown_height"),
                row.get("Crown_diameter"),
                row.get("Snag"),
                row.get("Tree_species_LA"),
                row.get("Tree_species_DE"),
                row.get("Tree_species_EN"),
                row.get("N_rep_ha"),
                row.get("Plot_tree")
            );
            
            plot.addTree(tree);
        }
    }

    getPlot(plotNumber, year) {
        return this.plotYears.get(plotNumber).get(year);
    }
}