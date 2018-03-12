//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    /*
    var projection = d3.geoAlbers()
        .center([0, 46.2])
        .rotate([-2, 0, 0])
        .parallels([43, 62])
        .scale(2500)
        .translate([width / 2, height / 2]);
    */
    
    var projection = d3.geoNaturalEarth()
        .scale(167)
        .translate([width / 2, height / 2])
        .precision(.1);
    
    var path = d3.geoPath()
        .projection(projection);
    
    //use queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/olympics_alt.csv") //load attributes from csv
        .defer(d3.json, "data/country.topojson") //load background spatial data
        .await(callback);
    
    function callback(error, csvData, world){
        var countries = topojson.feature(world, world.objects.country).features;
        console.log("CSV DATA ", csvData);
        console.log("Country features ", countries);
        
        var attrArray = ["stidx_98", "altidx_98", "gdp_1998", "stidx_00", "altidx_00", "gdp_2000", "stidx_02", "altidx_02", "gdp_2002", "stidx_04", "altidx_04", "gdp_2004", "stidx_06", "altidx_06", "gdp_2006", "stidx_08", "altidx_08", "gdp_2008", "stidx_10", "altidx_10", "gdp_2010", "stidx_12", "altidx_12", "gdp_2012", "stidx_14", "altidx_14", "gdp_2014", "stidx_16", "altidx_16", "gdp_2016", "nation_name", "smr_no", "smr_tot", "wtr_no", "wtr_tot", "tot_tot"]
        
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.geoid; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var a=0; a<countries.length; a++){

                var geojsonProps = countries[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.ADM0_A3_US; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        if (attr === "nation_name") {
                            var val = String(csvRegion[attr]); //get csv attribute value
                            geojsonProps[attr] = val;
                        } else {
                            var val = parseFloat(csvRegion[attr]); //get csv attribute value
                            geojsonProps[attr] = val; //assign attribute and value to geojson properties
                        }
                    });
                };
            };
        };
        console.log("post join country features ", countries);
        
        var graticule = d3.geoGraticule();
        
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
        
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
        
        var countriesClass = map.selectAll(".country")
            .data(countries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "country " + d.properties.ADM0_A3_US;
            })
            .attr("d", path);
        
    };
};