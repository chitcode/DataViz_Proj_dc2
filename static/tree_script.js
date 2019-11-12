var treeData = null;

function updateViz(){
  prod_id = document.getElementById('prod_id').value;
  max_conn = document.getElementById('max_conn').value;
  //alert(max_conn);
  if(prod_id !== null && prod_id !== ""){
    var request = new XMLHttpRequest();
    const url='/getnodes?prodId='+prod_id+'&maxConn='+max_conn;
    console.log(url);
    request.open("GET", url);
    request.send();
    loading();
    request.onreadystatechange = (e) => {
      treeData = JSON.parse(request.responseText);
      //console.log(treeData);
      if(!treeData["error"]){
        loading();
        document.getElementById("loader").style.display = "none";
        createViz(treeData);
      }else{
        loading();
        document.getElementById("loader").style.display = "none";
        alert("Sorry!! Product Not Found");
      }
    }

    // d3.json("/static/testing.json").then( data => {
    //   // console.log(data);
    //   treeData = data;
    //   createViz(treeData);
    // })
  }
  //update_ts(prod_id);
}

document.getElementById("loader").style.display = "none";
var loading = function() {
  var x = document.getElementById("loader");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}

var update_ts = function(prod_id){
  var request = new XMLHttpRequest();
  const url='/gettimeseries?prodId='+prod_id;
  request.open("GET", url);
  request.send();


}

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 1260 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var menu = [
    {
    	title: 'Explore Product',
    	action: function(elm, d, i) {
        document.getElementById('prod_id').value = d.data.name;
        updateViz();
    	}
    },
    {
    	title: 'Explore Rating',
    	action: function(elm, d, i) {
        var request = new XMLHttpRequest();
        const url='/getRattings?prodId='+d.data.name;
        console.log(url);
        request.open("GET", url);
        request.send();
        loading();
        request.onreadystatechange = (e) => {
          scatterData = JSON.parse(request.responseText);
          //console.log(treeData);
          if(!treeData["error"]){
            loading();
            document.getElementById("loader").style.display = "none";
            scatterVizFunc(d.data.name,scatterData);
          }else{
            loading();
            document.getElementById("loader").style.display = "none";
            alert("Sorry!! Product Not Found");
          }
        }
    	}
    }
  ]

var colorScale = d3.scaleLinear()
        .domain([0, 1])
    		.range(['red', 'green']);

var widthScale = d3.scaleLinear()
    		.domain([1,100])
    		.range([1, 10]);

var viewScale = d3.scaleLog()
        .domain([1,400])
        .range([9,25]);

var center = {left:width/2,height:height/2}
// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("#treeViz").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("
          + (width/2) + "," + margin.top/2 + ")");

var i = 0,
    duration = 750,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([height, width]);

// Assigns parent, children, height, depth
//var root;
// var treeData = d3.json("../testing.json").then(function(error,treeData){
//   if (error) throw error;
//   console.log(treeData);
//   return treeData;
// });

var createViz = function(treeData){
  root = d3.hierarchy(treeData, function(d) { return d.children; })
  root.x0 = height / 2;
  root.y0 = width/2;

  // Collapse after the second level
  root.children.forEach(collapse);
  //console.log(root);
  update(root);
}


// Collapse the node and all it's children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

function update(source) {

  //console.log(source);
  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  var max_depth = d3.max(nodes,function(d){return Math.abs(d.depth)});

  nodes.forEach(function(d){//changed here
    if(d.data.time == "before"){
      d.y = -d.depth * 200///max_depth;
    }else{
      d.y = d.depth * 200///max_depth;
  }});

  nodes.forEach(function(d,i){//changed here
    // console.log(d.parent.);
    // if(d.data.time == "before"){
    //   d.y = -d.depth * 180
    // }else{
    //   d.y = d.depth * 180
    //}
  });

  // ****************** Nodes section ***************************

  // Update the nodes...
  var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

  // Enter any new modes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
    })
    .on('click', click)
    .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
            div	.html("Comapre with "+prod_id+"<hr/>"+
                  "Common User Rating: "+d.data.avg_rating+"<br/>"+
                    "Overall Rating: "+d.data.avg_rating+"<br>"+
                  "Total Reviews : "+d.data.total_revs)
                .style("left", (d3.event.pageX+10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on('contextmenu', d3.contextMenu(menu));

  // Add Circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("stroke", function(d){
        return d3.interpolateRdYlGn(0.5+ 2*(d.data.avg_rating-d.data.overall_rating)/d.data.avg_rating)})
      //.style("stroke", function(d){return chart.color(d.data.name)})
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      });

  // Add labels for the nodes
  nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function(d) {
          if(d.data.time=="before"){
             return d.children || d._children ?  (3+viewScale(d.data.total_revs)):-(3+viewScale(d.data.total_revs));
           }else{
               return d.children || d._children ? -(3+viewScale(d.data.total_revs)) : (3+viewScale(d.data.total_revs));
             }
      })
      .attr("text-anchor", function(d) {
          if(d.data.time=="before"){
             return d.children || d._children ? "start" : "end";
           }else{
               return d.children || d._children ? "end" : "start";
             }
      })
      .text(function(d) { return d.data.name; })
      .attr("stroke-width",1)
      .style("stroke", "#3c4245");

//adding ratingScale
  nodeEnter.append('text')
      .attr("dy", "0em")
      .attr("text-anchor", "middle")
      .attr("x",0)
      .attr("y", -3)
      .text(function(d) { return d.data.avg_rating; });

  nodeEnter.append('text')
      .attr("dy", "0em")
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", 12)
      .text(function(d) { return d.data.overall_rating; });

//adding a line in clircle
nodeEnter.append('line')
    .attr("x1",function(d){return -1 *viewScale(d.data.total_revs)})
    .attr("y1",0)
    .attr("x2",function(d){return viewScale(d.data.total_revs)})
    .attr("y2", 0)
    .attr("stroke-width", 1)
    .attr("stroke", "#DFDDc7");

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) {
        if(d.time="before"){
          return "translate(" + d.y + "," + d.x + ")";
        }else{
        return "translate(" - d.y + "," - d.x + ")";
      }
     });

  // Update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', function(d){return viewScale(d.data.total_revs)})
    .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
    })
    .attr('cursor', 'pointer');


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle')
    .attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // ****************** links section ***************************

  // Update the links...
  var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; })
      .style('stroke-width', function(d){
        return widthScale(d.data.pct)
      })
      .on("mouseover", function(d) {
            var g = d3.select(this); // The node
            // The class is used to remove the additional text later
            var info = g.append('text')
               .classed('info', true)
               .attr('x', 20)
               .attr('y', 10)
               .text(function(d){return(d.data.pct)})
        })
        .on("mouseout", function() {
            // Remove the info text on mouse out.
            d3.select(this).select('text.info').remove();
          });


  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      })
      .style('stroke-width', function(d){
        return widthScale(d.data.pct)
      })
      .on("mouseover", function(d) {
              div.transition()
                  .duration(200)
                  .style("opacity", .9);
              div	.html(d.data.pct+"%")
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY - 28) + "px");
              })
          .on("mouseout", function(d) {
              div.transition()
                  .duration(500)
                  .style("opacity", 0);
          });
  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

    return path
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
        //chart.hide(d.data.name);
      } else {
        d.children = d._children;
        d._children = null;
        update_ts(d.data.name);
      }
    update(d);
  }


  //**********************Vertical Line ******************
  svg.append("line")
  .attr("x1", 0)  //<<== change your code here
  .attr("y1", 0)
  .attr("x2", 0)  //<<== and here
  .attr("y2", height/2-15)
  .style("stroke-width", 1)
  .style("stroke", "#d8a251")
  .style("stroke-dasharray", ("3, 3"))
  .style("fill", "none");

  svg.append("line")
  .attr("x1", 0)  //<<== change your code here
  .attr("y1", height/2+15)
  .attr("x2", 0)  //<<== and here
  .attr("y2", height)
  .style("stroke-width", 1)
  .style("stroke", "#d8a251")
  .style("stroke-dasharray", ("3, 3"))
  .style("fill", "none");

  svg.append("text")
    .attr("text-anchor", "start")
    .attr("x", 4)//padding of 4px
    .attr("y", 14)
    .text("   After  >>")
    .style("stroke", "#6b7b8e");

  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", -4)//padding of 4px
    .attr("y", 14)
    .text("<<  Before   ")
    .style("stroke", "#6b7b8e");
  // .attr("class", "text")
  // .text(function(d){return "Before"})
  // .attr("x", function(d) { -50 })
  // .attr("y", function(d) { 50 })
  // .attr("fill", "#DFDDC7")
  // .style("stroke", "#d8a251");

  //tooltip
  // Define the div for the tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
}


// //////////////////////////////////////New Chart/////////
// set the dimensions and margins of the graph

var scatter_margin = {top: 30, right: 30, bottom: 50, left: 60},
    scatter_width = 460 - scatter_margin.left - scatter_margin.right,
    scatter_height = 400 - scatter_margin.top - scatter_margin.bottom;
// append the svg object to the body of the page
var scatter_svg = d3.select("#scatterViz")
  .append("svg")
    .attr("width", scatter_width + scatter_margin.left + scatter_margin.right)
    .attr("height", scatter_height + scatter_margin.top + scatter_margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + scatter_margin.left + "," + scatter_margin.top + ")");

  var x = d3.scaleLinear()
      .domain([0, 5])
      .range([ 0, scatter_width ]);

  var y = d3.scaleLinear()
      .domain([0, 5])
      .range([ scatter_height, 0]);

  var ptSizeScale = d3.scaleLog()
      .domain([1, 300])
      .range([3,10]);

  var scatterVizFunc = function(c_prod_id,corr_data){
    //console.log(corr_data);

    scatter_svg.selectAll("circle")
    .remove()
    .exit()
    .transition()
    .duration(700);

    scatter_svg.selectAll("circle")
      .data(corr_data)
      .enter()
      .append("circle")
      .transition()
      .duration(700)
        .attr("cx", function (d) { return x(d.avg_rat); } )
        .attr("cy", function (d) { return y(d.prod_rat); } )
        .attr("r", function(d){ return ptSizeScale(d.rev_count)})
        .style("fill",function(d){
          return d3.interpolateRdYlGn(0.5+ 2*(d.prod_rat-d.avg_rat)/d.prod_rat)})
        .style("opacity", .4);

    scatter_svg.selectAll("text")
        .remove()
        .transition()
        .duration(700);

    // Add X axis
    scatter_svg.append("g")
        .attr("transform", "translate(0," + scatter_height + ")")
        .call(d3.axisBottom(x));
          // text label for the x axis

    scatter_svg.append("text")
        .attr("transform",
              "translate(" + (scatter_width/2) + " ," +
                             (scatter_height + scatter_margin.bottom-8) + ")")
        .style("text-anchor", "middle")
        .text("Average Rating (All Products)");

    // Add Y axis
    scatter_svg.append("g")
      .call(d3.axisLeft(y));
      // text label for the y axis

  var left_text = scatter_svg.data([c_prod_id+" Rating"]).append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - scatter_margin.left)
      .attr("x",0 - (scatter_height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(function(d){return d;})
      .transition()
      .duration(700);

  }
