//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
    var attrArray = ["stidx_98", "altidx_98", "gdp_1998", "stidx_00", "altidx_00", "gdp_2000", "stidx_02", "altidx_02", "gdp_2002", "stidx_04", "altidx_04", "gdp_2004", "stidx_06", "altidx_06", "gdp_2006", "stidx_08", "altidx_08", "gdp_2008", "stidx_10", "altidx_10", "gdp_2010", "stidx_12", "altidx_12", "gdp_2012", "stidx_14", "altidx_14", "gdp_2014", "stidx_16", "altidx_16", "gdp_2016", "nation_name", "smr_no", "smr_tot", "wtr_no", "wtr_tot", "tot_tot"];
    
    var dropArray = ["stidx_98", "altidx_98", "stidx_00", "altidx_00", "stidx_02", "altidx_02", "stidx_04", "altidx_04", "stidx_06", "altidx_06", "stidx_08", "altidx_08", "stidx_10", "altidx_10", "stidx_12", "altidx_12", "stidx_14", "altidx_14", "stidx_16", "altidx_16"];
    
    var expressed = attrArray[27]; //initial attribute
    
    var duration = 0;

    //begin script when window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap(){

        //...MAP, PROJECTION, PATH, AND QUEUE BLOCKS FROM PREVIOUS MODULE
        var width = window.innerWidth * .52,
            height = 460,
            svgWidth = width + 15;
/* 
        var transform = d3.zoomIdentity
          .scale(140)
          .translate(3, 4);
*/
        var projection = d3.geoGinzburg6()
            .scale(140)
            .translate([width / 2, height / 1.92]);
        
        var path = d3.geoPath()
            .projection(projection);
        
        var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(d3.zoom().scaleExtent([1,18]).on("zoom", function () {
                d3.event.transform.x = Math.min(60, Math.max(d3.event.transform.x, (width) - (width+30) * d3.event.transform.k));
                d3.event.transform.y = Math.min(0, Math.max(d3.event.transform.y, height - height * d3.event.transform.k));
                svg.attr("transform", d3.event.transform);
            }))
          .append("g");
        
        var map = svg.append("g")
            .attr("class", "map");
        
        //use queue to parallelize asynchronous data loading
        d3.queue()
            .defer(d3.csv, "data/olympics_alt.csv") //load attributes from csv
            .defer(d3.json, "data/country_info.topojson") //load background spatial data
            .await(callback);

        function callback(error, csvData, world){

            //place graticule on the map
            setGraticule(map, path);

            //translate TopoJSON
            var countries = topojson.feature(world, world.objects.country_info).features;

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
            //add olympic logos
            setImage(expressed);
            //add about button
            setButton();
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
        
        //assign array of last 4 cluster minimums as domain
        colorScale.domain(domainArray);
        
        var quantBreaks = colorScale.quantiles();

        return colorScale;
    };
    
    function createLegend(colorScale, min, max) {
      //updates the legend bits
        var legendArea = d3.select(".legend-area")
        var breaks = colorScale.quantiles();
        var colors = colorScale.range();
        var legend = legendArea.selectAll(".legend")
            .data(colors)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return a.value-b.value
            })
            .attr("class", function(d,i){
                return i + " legend"
            })
            .attr("height", "25")
            .attr("width", "100")
            .attr("x", function(d, i){
                return (i * 100) + 112;
            })
            .attr("y", "0")
            .style("fill", function(d){
                return d
            });
        
        for (var i=0; i <= breaks.length; i++){
            var minimum = min.toFixed(3);
            var maximum = max.toFixed(3);
            var yvalue = 17;
            var xextra = 117;
            var current = (breaks[i]-.0015).toFixed(3);
            if (i === 0) {
                var legendText = legendArea.append("text")
                    .attr("x", (i * 100) + xextra)
                    .attr("y", yvalue)
                    .attr("class", "legendText")
                    .html(minimum + "-" + current);
            } else if (i === 4) {
                var before = breaks[(i-1)].toFixed(3);
                var legendText = legendArea.append("text")
                    .attr("x", (i * 100) + xextra)
                    .attr("y", yvalue)
                    .attr("class", "legendText")
                    .html(before + "-" + maximum);
            } else {
                var before = breaks[(i-1)].toFixed(3);
                var legendText = legendArea.append("text")
                    .attr("x", (i * 100) + xextra)
                    .attr("y", yvalue)
                    .attr("class", "legendText")
                    .html(before + "-" + current);
            };
        };
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
            })
            .on("mousemove", moveLabel);
        
        var desc = countriesClass.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
        
    };//end of setEnumerationUnits()
    
    //function to create coordinated bar chart
    function setChart(csvData, colorScale, duration){
        //chart frame dimensions
        var chartWidth = window.innerWidth * .425,
            chartHeight = 473,
            leftPadding = 20,
            rightPadding = 2,
            topBottomPadding = 0,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
        
        var dataDict = [];
        for (var i=0; i < csvData.length; i++) {
            if (csvData[i][expressed] !== 'NA') {
                dataDict.push({
                    geoid: csvData[i]["geoid"],
                    value: parseFloat(csvData[i][expressed]),
                    ADMIN: csvData[i]["nation_name"],
                    tot_tot: csvData[i]["tot_tot"],
                    stidx_98: parseFloat(csvData[i]["stidx_98"]),
                    altidx_98: parseFloat(csvData[i]["altidx_98"]),
                    gdp_1998: parseFloat(csvData[i]["gdp_1998"]),
                    stidx_00: parseFloat(csvData[i]["stidx_00"]),
                    altidx_00: parseFloat(csvData[i]["altidx_00"]),
                    gdp_2000: parseFloat(csvData[i]["gdp_2000"]),
                    stidx_02: parseFloat(csvData[i]["stidx_02"]),
                    altidx_02: parseFloat(csvData[i]["altidx_02"]),
                    gdp_2002: parseFloat(csvData[i]["gdp_2002"]),
                    stidx_04: parseFloat(csvData[i]["stidx_04"]),
                    altidx_04: parseFloat(csvData[i]["altidx_04"]),
                    gdp_2004: parseFloat(csvData[i]["gdp_2004"]),
                    stidx_06: parseFloat(csvData[i]["stidx_06"]),
                    altidx_06: parseFloat(csvData[i]["altidx_06"]),
                    gdp_2006: parseFloat(csvData[i]["gdp_2006"]),
                    stidx_08: parseFloat(csvData[i]["stidx_08"]),
                    altidx_08: parseFloat(csvData[i]["altidx_08"]),
                    gdp_2008: parseFloat(csvData[i]["gdp_2008"]),
                    stidx_10: parseFloat(csvData[i]["stidx_10"]),
                    altidx_10: parseFloat(csvData[i]["altidx_10"]),
                    gdp_2010: parseFloat(csvData[i]["gdp_2010"]),
                    stidx_12: parseFloat(csvData[i]["stidx_12"]),
                    altidx_12: parseFloat(csvData[i]["altidx_12"]),
                    gdp_2012: parseFloat(csvData[i]["gdp_2012"]),
                    stidx_14: parseFloat(csvData[i]["stidx_14"]),
                    altidx_14: parseFloat(csvData[i]["altidx_14"]),
                    gdp_2014: parseFloat(csvData[i]["gdp_2014"]),
                    stidx_16: parseFloat(csvData[i]["stidx_16"]),
                    altidx_16: parseFloat(csvData[i]["altidx_16"]),
                    gdp_2016: parseFloat(csvData[i]["gdp_2016"])
                });
            };
        };

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");
        
        var legendArea = d3.select("body")
            .append("svg")
            .attr("class", "legend-area")
            .attr("width", "700")
            .attr("height", "25");
        
        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);
        
        var max = d3.max(dataDict, function(d) { return +d.value;} );
        var min = d3.min(dataDict, function(d) { return d.value;} );
        
        var yScale = d3.scaleLinear()
            .range([chartHeight-5, 5])
            .domain([0, Math.round(max+.5)]);
        
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
            .on("mouseover", highlight)
            .on("mouseout", dehighlight)
            .on("mousemove", moveLabel);
        
        var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');
        
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
        
        createLegend(colorScale, min, max);
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
            .text("Select Olympics/Index");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(dropArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){return dropdownText(d)[0] + " " + dropdownText(d)[1]});
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
        d3.select(".legend-area").remove();
        d3.select(".chart").remove();
        d3.select(".image").remove();
        d3.select(".chartTitle").remove();
        d3.select(".box").remove();
        d3.select(".overlay").remove();
        //re-sort, resize, and recolor bars
        setChart(csvData,colorScale, duration);
        setImage(expressed);
        setButton();
    };
    
    function setImage(expressed) {
        var season = expressed.split("_")[1];
        var nagano = "https://upload.wikimedia.org/wikipedia/en/f/fc/1998_Winter_Olympics_logo.svg";
        var saltLake = "https://upload.wikimedia.org/wikipedia/en/4/47/2002_Winter_Olympics_logo.svg";
        var turin = "https://upload.wikimedia.org/wikipedia/en/c/ce/2006_Winter_Olympics_logo.svg";
        var vancouver = "https://upload.wikimedia.org/wikipedia/en/a/a7/2010_Winter_Olympics_logo.svg";
        var sochi = "https://upload.wikimedia.org/wikipedia/commons/8/8f/Sochi_2014_%28Emblem%29.svg";
        var athens = "https://upload.wikimedia.org/wikipedia/en/1/16/2004_Summer_Olympics_logo.svg";
        var rio = "https://upload.wikimedia.org/wikipedia/en/d/df/2016_Summer_Olympics_logo.svg";
        var london = "https://upload.wikimedia.org/wikipedia/en/d/de/2012_Summer_Olympics_logo.svg";
        var beijing = "https://upload.wikimedia.org/wikipedia/en/8/87/2008_Summer_Olympics_logo.svg";
        var sydney = "https://upload.wikimedia.org/wikipedia/en/8/81/2000_Summer_Olympics_logo.svg";
        
        var image = d3.select("body")
            .append("div")
            .attr("class", "image");
        
        if (season == '98') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", nagano);
        } else if (season == '00') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", sydney);
        } else if (season == '02') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", saltLake);
        } else if (season == '04') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", athens);
        } else if (season == '06') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", turin);
        } else if (season == '08') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", beijing);
        } else if (season == '10') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", vancouver);
        } else if (season == '12') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", london);
        } else if (season == '14') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", sochi)
                .attr("width", "100%");
        } else if (season == '16') {
            var imageAssign = d3.select(".image")
                .append("img")
                .attr("src", rio);
        };
        
        var scoringCheck = expressed.split("_")[0];
        if (scoringCheck == 'altidx') {
            var scoringType = "3:2:1 Medal Count"
        } else {
            var scoringType = "Standard Medal Count"
        }
        console.log(scoringType);
        
        var chartTitle = d3.select("body")
            .append("div")
            .attr("class", "chartTitle")
            .html("<p><b>"+scoringType+"</b></p>");
    };
    
    function dropdownText(d) {
        var valueBreak = d.split("_");
        if (valueBreak[0] === "stidx"){
            var secondString = "Standard Index";
        } else {
            var secondString = "3:2:1 Index";
        };
        if (valueBreak[1] === "98") {
            var firstString = "Nagano 1998";
            var season = "winter";
        } else if (valueBreak[1] === "00") {
            var firstString = "Sydney 2000";
            var season = "summer";
        } else if (valueBreak[1] === "02") {
            var firstString = "Salt Lake 2002";
            var season = "winter";
        } else if (valueBreak[1] === "04") {
            var firstString = "Athens 2004";
            var season = "summer";
        } else if (valueBreak[1] === "06") {
            var firstString = "Torino 2006";
            var season = "winter";
        } else if (valueBreak[1] === "08") {
            var firstString = "Beijing 2008";
            var season = "summer";
        } else if (valueBreak[1] === "10") {
            var firstString = "Vancouver 2010";
            var season = "winter";
        } else if (valueBreak[1] === "12") {
            var firstString = "London 2012";
            var season = "summer";
        } else if (valueBreak[1] === "14") {
            var firstString = "Sochi 2014";
            var season = "winter";
        } else if (valueBreak[1] === "16") {
            var firstString = "Rio 2016";
            var season = "summer";
        }
        var textChecks = [firstString, secondString, season];
        return textChecks;
    };
    
    function highlight(props){
        //change stroke
        var selected = d3.selectAll("." + props.geoid)
            .style("stroke", "blue")
            .style("stroke-width", "2");
        setLabel(props);
    };

     //function to reset the element style on mouseout
    function dehighlight(props){
        d3.select(".infolabel").remove();
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
    
    //function to create dynamic label
    function setLabel(props){
        //label content
        if (isNaN(props[expressed])) {
            var displayNumber = "No Medals";
        } else {
            var displayNumber = (props[expressed]).toFixed(2);
        };
        if (isNaN(props.tot_tot)){
            var totalMedals = 0
        } else {
            var totalMedals = props.tot_tot.toLocaleString()
        }
        var whichOlympics = dropdownText(expressed);
        var whichGDP = String("gdp_" + whichOlympics[0].slice(-4));
        if (isNaN(props[whichGDP])) {
            var GDPval = 'Undefined';
        } else {
            var GDPval = "$" + props[whichGDP].toLocaleString();
        }

        var labelAttribute = "<h1>" + displayNumber +
            "</h1><b>" + whichOlympics[0] + " " + whichOlympics[1] + "</b>";
        
        var olympicHistoryText = "<p><b>" + props.ADMIN + "<br><p>PP GDP:</b> " + GDPval + "<br>" + "<b>All-time Combined Medal Total:</b> " + totalMedals;

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.geoid + "_label")
            .html(labelAttribute);
        
        var olympicHistory = infolabel.append("div")
            .attr("class", "labelname")
            .html(olympicHistoryText);
    };
    
    //function to move info label with mouse
    function moveLabel(){
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;
        
        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 15,
            y1 = d3.event.clientY - 130,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;
        
        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1; 

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };
    
    function setButton(){
        var height = window.innerHeight;
        
        var box = d3.select("body")
            .append("div")
            .attr("class", "box")
        
        var button = d3.select(".box")
            .append("a")
            .attr("class", "button")
            .attr("href", "#popup1")
            .html("About")
        
        var overlay = d3.select("body")
            .append("div")
            .attr("id", "popup1")
            .attr("class", "overlay")
        
        var popup = d3.select(".overlay")
            .append("div")
            .attr("class", "popup")
        
        d3.select(".popup")
            .append("h2")
            .html("About")
        d3.select(".popup")
            .append("a")
            .attr("class", "close")
            .attr("href", "#")
            .html("&times;")
        
        var content = d3.select(".popup")
            .append("div")
            .attr("class", "content")
            .html("<p>GDP data from <a href='https://data.worldbank.org/' target=blank>The World Bank</a>.<br>Read more about the various types of <a href='https://en.wikipedia.org/wiki/Olympic_medal_table#Ranking_systems' target=blank>Olympic medal ranking systems</a>.<br><br>Developed by JohnMark Fisher for Geography 575 at UW-Madison.<br>Visit my <a href='http://jmjfisher.com/' target=blank>portfolio</a>.</p>")
    };

})(); //last line of main.js