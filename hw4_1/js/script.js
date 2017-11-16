
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

  
    function ranking_layout() {
  		force.stop();
		var Ranking = d3.select('input[name="Ranking"]:checked').node().value;
		var rank = (Ranking == 'No') ? 'No' : d3.select("#Rank").node().value; 
		var yScale;
		if (Ranking != 'No')
			yScale = d3.scale.linear()
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
  		force.stop();
    	var mode = d3.select('input[name="Coordinates"]:checked').node().value;
    	var xAxis = mode == 'lon/lat' ? 'longitude': 'population';
    	var yAxis = mode == 'lon/lat' ? 'latitude': 'gdp';
    	var xScale = d3.scale.linear()
				.range([20, width-70])
				.domain([d3.min(data, d => d[xAxis]),
						 d3.max(data, d => d[xAxis])]);

    	var yScale = d3.scale.linear()
				.range([height-600, 20])
				.domain([d3.min(data, d => d[yAxis]),
						 d3.max(data, d => d[yAxis])]);

    	data.forEach(function (d, i) {
	  		d.x = xScale(d[xAxis]);	  	
	  		d.y = yScale(d[yAxis]);	  	
    	});  		
		update(500);
    }
	function circular_layout() {
  	  force.stop();
	  var r = Math.min(height, width)/2 - 350;

	  var arc = d3.svg.arc()
	          .outerRadius(r);
	  var p = d3.select("#Sort").node().value;
	  var pie = d3.layout.pie()
				  .sort(function(a, b) { return a[p] - b[p];})
			          .value(function(d, i) { 
			            return 1; 
			          });

	  data = pie(data).map(function(d, i) {
	    // Needed to caclulate the centroid
	    d.innerRadius = r;
	    d.outerRadius = r;

	    // Building the data object we are going to return
	    d.data.x = arc.centroid(d)[0] + r + 50;
	    d.data.y = arc.centroid(d)[1] + r + 50;

	    return d.data;
	  })
	  update(700);
	}

	var force = d3.layout.force()
	    .size([width, height])
	    .charge(-50)
	    .linkDistance(10)
	    .on("tick", function(d) {update(150);})
	    .on("start", function(d) {})
	    .on("end", function(d) {});

	function force_layout() {
	 force.nodes(data)
	      .start();
	}


    function update(duration) {
		nodes.transition()
		  	.duration(duration)
	      	.attr("transform", function(d, i) { 
			        return "translate("+ d.x + "," + d.y +")"; 
			      });  
    }



	layout_mode();

	d3.selectAll('input[name="Ranking"]').on("change",ranking_layout);
	d3.selectAll('input[name="Coordinates"]').on("change", scatter_layout);
	d3.selectAll('#Rank').on("change", ranking_layout);
	d3.selectAll('#Sort').on("change", circular_layout);
});