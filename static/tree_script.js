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
      console.log(treeData);
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

  //var ts_data;
  // request.onreadystatechange = (e) => {
  //   ts_data = JSON.parse(request.responseText);
  //   console.log(ts_data);
  //   if(!ts_data["error"]){
  //     //update_ts_i(ts_data);
  //   }else{
  //     alert("Sorry!! Product Not Found");
  //   }
  // }

}

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 1260 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

var colorScale = d3.scaleLinear()
        .domain([0, 1])
    		.range(['red', 'green']);

var widthScale = d3.scaleLinear()
    		.domain([1,100])
    		.range([1, 10]);

var viewScale = d3.scaleLog()
        .domain([1,400])
        .range([9,25]);

// var ratingScale1 = d3.schemeRdYlGn();

// Define the div for the tooltip
// var div = d3.select("body").append("div")
//             .attr("class", "tooltip")
//             .style("opacity", 0);

var center = {left:width/2,height:height/2}
// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
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
            div	.html("Common User Rating: "+d.data.avg_rating+"<br/>"+
                    "Overall Rating: "+d.data.avg_rating+"<br>"+
                  "Total Reviews : "+d.data.total_revs)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
    // .on("mouseover", function(d) {
    //       var g = d3.select(this); // The node
    //       // The class is used to remove the additional text later
    //       var info = g.append('text')
    //          .classed('info', true)
    //          .attr('x', 20)
    //          .attr('y', 30)
    //          .text(function(d){ return("Total Reviews : "+d.data.total_revs+"\n"+
    //        "Common User Rating: "+d.data.avg_rating+"\n"+
    //        "Overall Rating: "+d.data.avg_rating)});
    //   })
    //   .on("mouseout", function() {
    //       // Remove the info text on mouse out.
    //       d3.select(this).select('text.info').remove();
    //     });

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
             return d.children || d._children ?  viewScale(d.data.total_revs):-viewScale(d.data.total_revs);
           }else{
               return d.children || d._children ? -viewScale(d.data.total_revs) : viewScale(d.data.total_revs);
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
      // .on("mouseover", function(d) {
      //       var g = d3.select(this); // The node
      //       // The class is used to remove the additional text later
      //       var info = g.append('text')
      //          .classed('info', true)
      //          .attr('x', 20)
      //          .attr('y', 10)
      //          .text(function(d){ return(d.data.pct+"%")})
      //   })
      //   .on("mouseout", function() {
      //       // Remove the info text on mouse out.
      //       d3.select(this).select('text.info').remove();
      //     });
      // .append("svg:title")
      // .text(function(d) { return d.data.pct; });


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
    .text(">>   After  >>")
    .style("stroke", "#5f6769");

  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", -4)//padding of 4px
    .attr("y", 14)
    .text("<<  Before   <<")
    .style("stroke", "#5f6769");
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
// d3.select("body").append("svg").attr("id","timeseriesChart")
//   .attr("width",width + margin.right + margin.left);
//
//
// var chart = bb.generate({
//     data: {
//       x: "x",
//        columns: [
//   	// ["x", "2013-01-01", "2013-01-02", "2013-01-03", "2013-01-04", "2013-01-05", "2013-01-06"],
//   	// ["data1", 30, 200, 100, 400, 150, 250],
//   	// ["data2", 130, 340, 200, 500, 250, 350]
//        ]
//     },
//     axis: {
//       x: {
//         type: "timeseries",
//         tick: {
//           rotate: 75,
//           multiline: false,
//           tooltip: true,
//           format: "%Y-%m-%d"
//         }
//       },
//       y: {
//       tick: {
//         values: [0,1,2,3,4,5]
//       }
//     }
//     },
//     bindto: "#timeseriesChart"
//   });
//
// function update_ts_i(data){
//    setTimeout(function() {
//   	chart.load(data);
//   }, 1000);
// }
  // call some API
  //chart.load( ... );
