
 d3.json("https://raw.githubusercontent.com/avt00/dvcourse/master/countries_2012.json", function(error, data){

 	function layout_mode() {
 		var mode = d3.select('input[name="Mode"]:checked').node().value;
			d3.selectAll('div')
			  .style("display", "none")
			d3.select("#" + mode)
			.style("display", "block");
			switch(mode){
				case 'R': ranking_layout(); break;
				case 'S': scatter_layout(); break;
				case 'C': circular_layout(); break;
				case 'G': force_layout(); break;

			}
 	}

	d3.selectAll('input[name="Mode"]')
  	  .on("change", function(){
			layout_mode();
	});

	var width = 1200;
	var height = 1200;
	var nodeRadius = 5; 
	var center = {x: width*0.3, y: width*0.3};
	var svg = d3.select("#plot")
	            .attr("width", width)
	            .attr("height", height);

    data.forEach(function (d, i) {
    	d.x = 10; d.y = 0;
    })

	var nodes = svg.selectAll('.node')
	              .data(data)
	            .enter()
	              .append("g")
	              .attr("class", "node");

	nodes.append("circle")
	    .attr("r", nodeRadius) 

    nodes.append("text")
        .attr("dy", "3")
        .attr("dx", "7")
        .attr('font-family', 'sans-serif') 
        .attr('font-size', '10px')
        .text(function(d) { return d.name; });

	var simulation = d3.forceSimulation()
	    //.force("link", d3.forceLink().id(function(d) { return d.id; }))
	    .force("charge", d3.forceManyBody().strength(-100))
	    .force('x', d3.forceX().strength(0.1).x(center.x))
	    .force('y', d3.forceY().strength(0.2).y(center.y))

	simulation.nodes(data)
			  .on("tick", ticked);

    function ranking_layout() {
    	simulation.stop();
		var Ranking = d3.select('input[name="Ranking"]:checked').node().value;
		var rank = (Ranking == 'No') ? 'No' : d3.select("#Rank").node().value; 
		var yScale;
		if (Ranking != 'No')
			yScale = d3.scaleLinear()
				.range([height - 15, 10])
				.domain([d3.min(data, d => d[rank]), d3.max(data, d => d[rank])]);
		
		data.forEach(function (d, i) {
	    		d.x = 10;
		  		d.y = rank =='No'? 5 + 2*i*nodeRadius
		  						 : 5 + yScale(d[rank]);	  		
	    	})
		update(500);
    }
    function scatter_layout(){
    	simulation.stop();
    	var mode = d3.select('input[name="Coordinates"]:checked').node().value;
    	var xAxis = mode == 'lon/lat' ? 'longitude': 'population';
    	var yAxis = mode == 'lon/lat' ? 'latitude': 'gdp';
    	var xScale = d3.scaleLinear()
				.range([20, width-70])
				.domain([d3.min(data, d => d[xAxis]),
						 d3.max(data, d => d[xAxis])]);

    	var yScale = d3.scaleLinear()
				.range([height-600, 20])
				.domain([d3.min(data, d => d[yAxis]),
						 d3.max(data, d => d[yAxis])]);

    	data.forEach(function (d, i) {
	  		d.x = xScale(d[xAxis]);	  	
	  		d.y = yScale(d[yAxis]);	  	
    	});  		
		update(500);
    }

    function circle_centers() {
	    var r = Math.min(height, width)/2 - 200;
	    var arc = d3.arc().outerRadius(r);
	    var pie = d3.pie().value(function(d, i) { return 1; });
    	var centers = pie(['Asia','Africa','Americas','Europe','Oceania'])
					.map(function(d, i) {
			            d.innerRadius = 0;
			            d.outerRadius = r;
			            
			            d.x = arc.centroid(d)[0] + r + 50;
			            d.y = arc.centroid(d)[1] + r + 50;

			            return {continent: d.data, x: d.x, y: d.y};
			        });
		var yearCenters = {}
		centers.forEach(function (d) {
			yearCenters[d.continent] = {x: d.x, y: d.y};
		});	
		return yearCenters;
}

	function circular_layout() {
		simulation.stop();
		var r = Math.min(height, width)/2;
		var arc = d3.arc().outerRadius(r);
		var p = d3.select("#Sort").node().value;


		if(d3.select('input[name="CircleGrouped"]:checked').node() == null){
			var pie = d3.pie()
					  .sort(function(a, b) { return a[p] - b[p];})
				      .value(function(d, i) { return 1; });

		  	data = pie(data).map(function(d, i) {
			    d.innerRadius = 0;
			    d.outerRadius = r;

			    d.data.x = arc.centroid(d)[0] + r - 100;
			    d.data.y = arc.centroid(d)[1] + r - 100;

			    return d.data;
		  	});
		}
		else{
			var r = 150;
			var arc = d3.arc().outerRadius(r);
			var pie = d3.pie()
					  .sort(function(a, b) { return a[p] - b[p];})
				      .value(function(d, i) { return 1; });

			var centers = circle_centers();			
			for (var cont in centers) {
			    if (centers.hasOwnProperty(cont)) {
					data = pie(data).map(function(d, i) {
					    d.innerRadius = 0;
					    d.outerRadius = r;

					    if (d.data.continent == cont) {
						    d.data.x = arc.centroid(d)[0] + centers[cont].x;
						    d.data.y = arc.centroid(d)[1] + centers[cont].y;
					    }
					    return d.data;
				  	});
			    }
			}
		}
		update(700);
	}

	function force_layout() {
	    var groupType = d3.select("#GroupType").node().value;
	    var yearCenters;

	    switch(groupType){
	    	case 'horizontal':
	    		yearCenters = {
			        'Asia': { x: width / 5, y: height / 2 - 250},
			        'Africa': { x: width / 3, y: height / 2 - 250 },
			        'Americas': { x: width / 2, y: height / 2 - 250 },
			        'Europe': { x: 2 * width / 3, y: height / 2 - 250 },
			        'Oceania': { x: 4 * width / 5, y: height / 2 - 250 }
		    	}; 
		    	break;
	    	case 'circular':
	    		yearCenters = circle_centers();	
				break;
	    }
		
    	if (d3.select('input[name="Grouped"]:checked').node() != null) {
	        simulation.force('x', d3.forceX().strength(0.15)
						        	.x(function (d) { return yearCenters[d['continent']].x; }))
	        		  .force('y', d3.forceY().strength(0.2)
						        	.y(function (d) { return yearCenters[d['continent']].y; }));
    	}
    	else{
		    simulation.force('x', d3.forceX().strength(0.15).x(center.x))
		    		   .force('y', d3.forceY().strength(0.2).y(center.y));
    	}

        simulation.alpha(1).restart();
	}

	function ticked() {
           update(0);
        };

    function update(duration) {
		nodes.transition()
		  	.duration(duration)
	      	.attr("transform", function(d, i) { 
			        return "translate("+ d.x + "," + d.y +")"; 
			      });  
    }



	layout_mode();

	d3.selectAll('input[name="Ranking"]').on("change",ranking_layout);
	d3.selectAll('#Rank').on("change", ranking_layout);

	d3.selectAll('input[name="Coordinates"]').on("change", scatter_layout);

	d3.selectAll('input[name="CircleGrouped"]').on("change", circular_layout);
	d3.selectAll('#Sort').on("change", circular_layout);

	d3.selectAll('input[name="Grouped"]').on("change", force_layout);
	d3.selectAll('#GroupType').on("change", force_layout);
});