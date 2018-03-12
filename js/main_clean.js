//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
    var attrArray = ["stidx_98", "altidx_98", "gdp_1998", "stidx_00", "altidx_00", "gdp_2000", "stidx_02", "altidx_02", "gdp_2002", "stidx_04", "altidx_04", "gdp_2004", "stidx_06", "altidx_06", "gdp_2006", "stidx_08", "altidx_08", "gdp_2008", "stidx_10", "altidx_10", "gdp_2010", "stidx_12", "altidx_12", "gdp_2012", "stidx_14", "altidx_14", "gdp_2014", "stidx_16", "altidx_16", "gdp_2016", "nation_name", "smr_no", "smr_tot", "wtr_no", "wtr_tot", "tot_tot"];
    
    var expressed = attrArray[0]; //initial attribute

    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap(){

        //...MAP, PROJECTION, PATH, AND QUEUE BLOCKS FROM PREVIOUS MODULE
        var width = 960,
            height = 460;

        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

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

            //place graticule on the map
            setGraticule(map, path);

            //translate TopoJSON
            var countries = topojson.feature(world, world.objects.country).features;

            //join csv data to GeoJSON enumeration units
            countries = joinData(countries, csvData);
            
            //create color scale
            var colorScale = makeColorScale2(csvData);

            //add enumeration units to the map
            setEnumerationUnits(countries, map, path, colorScale);
        };
    }; //end of setMap()

    function setGraticule(map, path){
        //...GRATICULE BLOCKS FROM PREVIOUS MODULE
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
    }; //end of setGraticule()

    function joinData(countries, csvData){
        //...DATA JOIN LOOPS FROM EXAMPLE 1.1
        
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

        return countries;
    }; //end of joinData()
    
    function makeColorScale(data){
        
        var colorClasses = ['#d7191c','#fdae61','#ffffbf','#a6d96a','#1a9641'];
        
        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);
        
        //build array of all values of the expressed attribute
        var domainArray = [];
        
        for (var i=0; i<data.length; i++){
            var check = data[i][expressed];
            if (check !== 'NA') {
                var val = parseFloat(check);
                domainArray.push(val);
            }
        };
        
        console.log(domainArray);
        
        colorScale.domain(domainArray);
        
        console.log(colorScale.quantiles());
        
        return colorScale;
    }; //end of makeColorScale()
    
    function makeColorScale2(data){
        var colorClasses = ['#d7191c','#fdae61','#ffffbf','#a6d96a','#1a9641'];

        //create color scale generator
        var colorScale = d3.scaleThreshold()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var check = data[i][expressed];
            if (check !== 'NA') {
                var val = parseFloat(check);
                domainArray.push(val);
            }
        };

        //cluster data using ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums
        domainArray = clusters.map(function(d){
            return d3.min(d);
        });
        //remove first value from domain array to create class breakpoints
        domainArray.shift();

        //assign array of last 4 cluster minimums as domain
        colorScale.domain(domainArray);

        return colorScale;
    };

    function setEnumerationUnits(countries, map, path, colorScale){
        //...REGIONS BLOCK FROM PREVIOUS MODULE
        
        var countriesClass = map.selectAll(".country")
            .data(countries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "country " + d.properties.ADM0_A3_US;
            })
            .attr("d", path)
            .style("fill", function(d){
                var check = d.properties[expressed];
                if (isNaN(check)) {
                    return "#CCC";
                } else {
                    return colorScale(d.properties[expressed]);
                };
            });
        
    };//end of setEnumerationUnits()

})(); //last line of main.js