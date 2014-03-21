function buildURI(params) {
  var uri = '';
  for (key in params) 
    uri += key + '=' + params[key] + '&';
  return encodeURI(uri.substring(0, uri.length - 1));
};


function Network (div) {
  this.div = $(div).get(0);
  this.strengthScale = null;
  this.svg = null;
  this.width = null;
  this.height = null;
  this.force = null;
  this.gnodes = null;
  this.nodes = null;
  this.edges = null;
  this.host = 'http://dell0:8080/';
  this.margin = {top: 40, right: 40, bottom: 40, left: 40};
  this.params = {
    bbox: null,
    request: "GetCollocationScores",
    sql: "select tweet_text from tweets",
    id: 85,
    tokens: ["freedom", "jesus", "god", "church", "prayer",  "choice", "snowden", "obama", "leak", "sin", "android", "iphone", "ios", "apple", "google", "microsoft" ],
    //tokens: ["church", "prayer", "jesus", "hot", "sunny", "google", "apple", "android", "iphone", "ipad", "tv", "glass", "football", "basketball", "music", "concert", "satan", "soccer", "goal", "basket", "obama"],
  };

  this.dataset = {
    nodes: [ 
    {name: "Todd", color: "#900" },
    {name: "Tom", color: "#900" },
    {name: "Rita", color: "#009" },
    {name: "Alex", color: "#900" },
    {name: "Lina", color: "#009" },
    {name: "Kezia", color: "#009"},
  ],
  edges: [
   {source: 0, target: 1, strength: 0.8 },
   {source: 0, target: 2, strength: 0.3 },
   {source: 0, target: 3, strength: 0.8 },
   {source: 0, target: 4, strength: 0.2 },
   {source: 0, target: 5, strength: 0.95 },
   {source: 1, target: 2, strength: 0.85 },
   {source: 1, target: 3, strength: 0.4 },
   {source: 1, target: 4, strength: 0.2 },
   {source: 2, target: 4, strength: 0.2 }
  ]
  };

  this.init = function() {
    console.log("init");
    this.width = $(this.div).width() - this.margin.left - this.margin.right;
    this.height = $(this.div).height() - this.margin.top - this.margin.bottom;
    var strengthMax =d3.max(this.dataset.edges, function(d) {return d.strength;}); 
    this.distScale = d3.scale.linear()
      .range([150.0,0.0])
      .domain([0.0, strengthMax]); 

    this.linkWidthScale = d3.scale.linear()
      .range([0.5,5.0])
      .domain([0.0, strengthMax]);

    this.tokenSizeScale = d3.scale.linear()
      .range([14,28])
      .domain(d3.extent(this.dataset.nodes, function(d) {return d.n;}));

    var distScale = this.distScale;
    var linkWidthScale = this.linkWidthScale;
    var tokenSizeScale = this.tokenSizeScale;

    this.force = d3.layout.force()
      .nodes(this.dataset.nodes)
      .links(this.dataset.edges)
      .size([this.width, this.height])
      //.linkDistance(function(d) {console.log (d); return (20.0 - d.strength) * 20.0;})
      .linkDistance(function(d) {console.log (d.strength); console.log(distScale(d.strength)); return distScale(d.strength);})
      //.gravity(0.4)
      //.linkDistance([50])
      //.linkDistance([50])
      .charge([-60])
      .start();


    this.svg = d3.select(this.div)
      .attr("class", "network")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height);
      //.append("g")
      //.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    this.edges = this.svg.selectAll("line")
      .data(this.dataset.edges)
      .enter()
      .append("line")
      .style("stroke", "#ccc")
      .style("stroke-width", function(d) {return linkWidthScale(d.strength);});

      //.style("stroke-width", function(d) {return d.strength});

    this.gnodes = this.svg.selectAll('g.gnode')
      .data(this.dataset.nodes)
      .enter()
      .append('g')
      .classed('gnode', true)
      .call(this.force.drag);

    this.nodes = this.gnodes.append("circle")
      .attr("class", "node")
      .attr("r",30)
      //.style("fill", function(d) {return d.color;})
      .style("opacity", 0.0);
    /*
    this.nodes = this.gnodes.append("rect")
      .attr("class", "node")
      .attr("width", 20)
      .attr("height", 10)
      .style("fill", "#060")
      .style("opacity", 0.0)
      .call(this.force.drag);
    */
    this.labels = this.gnodes.append("text")
      .text(function(d) {return d.token;})
      .style("font-size", function(d) {return tokenSizeScale(d.n) + "px";})
      .attr("transform", "translate(-15,5)");
      //.call(this.force.drag);

    /*
    this.nodes = this.svg.selectAll("circle")
      .data(this.dataset.nodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .style("fill", "#f00")
      .call(this.force.drag);
    */
    /*
    this.nodes.append("title")
      .text(function(d) {return d.name;});
    */

    var gnodes = this.gnodes;
    var edges = this.edges;
    this.force.on("tick", function() {
      edges.attr("x1", function(d) {return d.source.x; })
      edges.attr("y1", function(d) {return d.source.y; })
      edges.attr("x2", function(d) {return d.target.x; })
      edges.attr("y2", function(d) {return d.target.y; })
      gnodes.attr("transform", function(d) {
          return 'translate(' + [d.x,d.y] + ')';
      });
        
      /* 
      gnodes.attr("cx", function(d) {return d.x;})
           .attr("cy", function(d) {return d.y;});
      */
  });
  };

  this.getURL = function(options) {
      var url = this.host + '?' + buildURI(this.params);
      return url;
  };

  this.reload = function(options) {
         $.getJSON(this.getURL(options)).done($.proxy(this.onLoad, this));
  };

  this.onLoad = function(data) {
    console.log(data);
    this.dataset.nodes = [];
    this.dataset.edges = [];
    //this.dataset = {};
    var numNodes = data.tokens.length;
    for (var n = 0; n < numNodes; ++n) 
      this.dataset.nodes.push({token: data.tokens[n], n: data.counts[n]});
    var i = 0;
    for (var y = 0; y < numNodes; ++y) {
      for (var x = y + 1; x < numNodes; ++x) {
        this.dataset.edges.push({source: y, target: x, strength: data.scores[i]});
        i++;
      }
    }
    console.log("initting");
    this.init();

    console.log(this.dataset);

  };

}

function init () {
  $("#networkDiv").width(1000).height(800);

  network = new Network($("#networkDiv"));
  //network.init();
  network.reload();
}


$(document).ready(init);



