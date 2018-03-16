//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
    var attrArray = ["stidx_98", "altidx_98", "gdp_1998", "stidx_00", "altidx_00", "gdp_2000", "stidx_02", "altidx_02", "gdp_2002", "stidx_04", "altidx_04", "gdp_2004", "stidx_06", "altidx_06", "gdp_2006", "stidx_08", "altidx_08", "gdp_2008", "stidx_10", "altidx_10", "gdp_2010", "stidx_12", "altidx_12", "gdp_2012", "stidx_14", "altidx_14", "gdp_2014", "stidx_16", "altidx_16", "gdp_2016", "nation_name", "smr_no", "smr_tot", "wtr_no", "wtr_tot", "tot_tot"];
    
    var dropArray = ["stidx_98", "altidx_98", "stidx_00", "altidx_00", "stidx_02", "altidx_02", "stidx_04", "altidx_04", "stidx_06", "altidx_06", "stidx_08", "altidx_08", "stidx_10", "altidx_10", "stidx_12", "altidx_12", "stidx_14", "altidx_14", "stidx_16", "altidx_16"];
    
    var expressed = attrArray[0]; //initial attribute
    
    var duration = 0;

    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap(){

        //...MAP, PROJECTION, PATH, AND QUEUE BLOCKS FROM PREVIOUS MODULE
        var width = window.innerWidth * .5,
            height = 460;

        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        var projection = d3.geoNaturalEarth()
            .scale(140)
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
            
            //add coordinated viz chart
            setChart(csvData, colorScale, duration);
            
            //add dropdown
            createDropdown(csvData);
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
                var geojsonKey = geojsonProps.geoid; //the geojson primary key

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
        
        colorScale.domain(domainArray);
        
        return colorScale;
    }; //end of makeColorScale()
    
    function makeColorScale2(data){
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
        /*
        //cluster data using ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums
        domainArray = clusters.map(function(d){
            return d3.min(d);
        });
        //remove first value from domain array to create class breakpoints
        domainArray.shift();
        */

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
                return "country " + d.properties.geoid;
            })
            .attr("d", path)
            .style("fill", function(d){
                var check = d.properties[expressed];
                if (isNaN(check)) {
                    return "#CCC";
                } else {
                    return colorScale(d.properties[expressed]);
                };
            })
            .on("mouseover", function(d){
                highlight(d.properties);
            })
            .on("mouseout", function(d){
                dehighlight(d.properties);
            });
        
        var desc = countriesClass.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
        
    };//end of setEnumerationUnits()
    
    //function to create coordinated bar chart
    function setChart(csvData, colorScale, duration){
        //chart frame dimensions
        var chartWidth = window.innerWidth * .425,
            chartHeight = 473,
            leftPadding = 25,
            rightPadding = 2,
            topBottomPadding = 5,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
        
        var dataDict = [];
        for (var i=0; i < csvData.length; i++) {
            if (csvData[i][expressed] !== 'NA') {
                dataDict.push({
                    geoid: csvData[i]["geoid"],
                    value: parseFloat(csvData[i][expressed])
                });
            };
        };

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
        
        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
        
        var max = d3.max(dataDict, function(d) { return +d.value;} );
        
        var yScale = d3.scaleLinear()
            .range([chartHeight, 0])
            .domain([-1, max+3]);
        
        //set bars for each province
        var bars = chart.selectAll(".bars")
            .data(dataDict)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b.value-a.value
            })

            .attr("class", function(d){
                return "bars " + d.geoid;
            })
            .attr("width", chartInnerWidth / dataDict.length - 1)
            .attr("x", function(d, i){
                return i * (chartInnerWidth / dataDict.length) + leftPadding + 1;
            })
            .attr("height", function(d){
                return chartInnerHeight - yScale(d.value);
            })
            .attr("y", function(d){
                return yScale(d.value) + topBottomPadding;
            })
            .style("fill", function(d){
                return colorScale(d.value);
            })
            .on("mouseover", function(d){
                highlight(d);
            })
            .on("mouseout", function(d){
                dehighlight(d);
            });
        
        var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');
        
        //below Example 2.8...create a text element for the chart title
        var scoringCheck = expressed.split("_");
        if (scoringCheck[0] == 'altidx') {
            var scoringType = "3:2:1 Medal Count"
        } else {
            var scoringType = "Standard Medal Count"
        }
        
        var chartTitle = chart.append("text")
            .attr("x", 20)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Performance Index at " + scoringType + " Olympics relative to GDP");
        //create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale);

        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
        };//end of setChart()
    
    //function to create a dropdown menu for attribute selection
    function createDropdown(csvData){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(dropArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){return dropdownText(d)});
    };
    

    //dropdown change listener handler
    function changeAttribute(attribute, csvData){
        //change the expressed attribute
        expressed = attribute;
        duration = 500;

        //recreate the color scale
        var colorScale = makeColorScale2(csvData);

        //recolor enumeration units
        var countriesClass = d3.selectAll(".country")
            .transition()
            .duration(500)
            .style("fill", function(d){
                var check = d.properties[expressed];
                if (isNaN(check)) {
                    return "#CCC";
                } else {
                    return colorScale(d.properties[expressed]);
                };
            });
        
        d3.select(".chart").remove();
        //re-sort, resize, and recolor bars
        setChart(csvData,colorScale, duration);
    };
    
    function dropdownText(d) {
        var valueBreak = d.split("_");
        if (valueBreak[0] === "stidx"){
            var secondString = "Standard Index";
        } else {
            var secondString = "3:2:1 Index";
        };
        if (valueBreak[1] === "98") {
            var firstString = "Nagano 1998 ";
        } else if (valueBreak[1] === "00") {
            var firstString = "Sydney 2000 ";
        } else if (valueBreak[1] === "02") {
            var firstString = "Salt Lake 2002 ";
        } else if (valueBreak[1] === "04") {
            var firstString = "Athens 2004 ";
        } else if (valueBreak[1] === "06") {
            var firstString = "Torino 2006 ";
        } else if (valueBreak[1] === "08") {
            var firstString = "Beijing 2008 ";
        } else if (valueBreak[1] === "10") {
            var firstString = "Vancouver 2010 ";
        } else if (valueBreak[1] === "12") {
            var firstString = "London 2012 ";
        } else if (valueBreak[1] === "14") {
            var firstString = "Sochi 2014 ";
        } else if (valueBreak[1] === "16") {
            var firstString = "Rio 2016 ";
        }
        return String(firstString + secondString);
    };
    
    function highlight(props){
        //change stroke
        var selected = d3.selectAll("." + props.geoid)
            .style("stroke", "blue")
            .style("stroke-width", "2");
    };

     //function to reset the element style on mouseout
    function dehighlight(props){
        var selected = d3.selectAll("." + props.geoid)
            .style("stroke", function(){
                return getStyle(this, "stroke")
            })
            .style("stroke-width", function(){
                return getStyle(this, "stroke-width")
            });

        function getStyle(element, styleName){
            var styleText = d3.select(element)
                .select("desc")
                .text();

            var styleObject = JSON.parse(styleText);

            return styleObject[styleName];
        };
    };

})(); //last line of main.js