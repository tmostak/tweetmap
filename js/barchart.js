var BarChart = 
{
  x: null,
  y: null,
  width: null,
  height: null,
  margin: null,
  xAxis: null,
  yAxis: null,
  series: [],
  brush: null,
  data: null,
  barCallback: null,
  elems: {
    container: null,
    svg: null,
    info: null,
  },

  init: function(container, bottomMargin, barCallback) {
    this.elems.container = $(container).get(0);
    this.barCallback = barCallback;
    //console.log(this.elems.container);
    this.margin = {top: 10, right: 5, bottom: bottomMargin, left: 45};
        //width = 400 - this.margin.left - this.margin.right,
    //var cont =  $($(this.elems.container).get(0));
    this.width = $(this.elems.container).width() - this.margin.left - this.margin.right;
        //this.width = cont.width() - cont.offset().left - this.margin.left - this.margin.right;
     this.height = $(this.elems.container).height() - this.margin.top - this.margin.bottom;

    /*
    this.x = o3.scale.scale().range([0, this.width]);
    this.y = d3.scale.linear().range([this.height, 0]);

    this.xAxis = d3.svg.axis()
        .scale(this.x)
        .orient("bottom")
        .tickPadding(6);

    this.yAxis = d3.svg.axis()
        .scale(this.y)
        .orient("left")
        .tickSize(-this.width)
        .tickPadding(6);
    */
    var svg = d3.select(this.elems.container)
        .attr("class", "barchart")
         .append("svg")
        .attr("width", this.width + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom);
        //.append("g")
        //.attr("transform", "translate(" + 60 + "," + this.margin.top + ")");
       //.attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
        //.attr("this.margin-left", this.margin.left);
    this.elems.svg = svg;
    /*
    svg.append("g")
        .attr("class", "y axis");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")");

    svg.append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("x", this.x(0))
        .attr("y", this.y(1))
        .attr("width", this.x(1) - this.x(0))
        .attr("height", this.y(0) - this.y(1));

    var self = this;
    */

  },

  addData: function(dataset, numQueryTerms, dataNums) { 
    var self = this;
    var w = this.width;
    var h = this.height;
    var barPadding = 10;
    var abbrFormat = d3.format(".1s");
    if (dataNums == "Percents") {
      /*this.data = $.map(dataset.tokens, function(e1, idx) {
          return {"label": e1, "val":dataset.sums[idx]/(dataset.counts[idx] + 0.01)};
      */
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") 
              return {"label": e1, "val":dataset.percents[idx]};
      }).slice(numQueryTerms);
      abbrFormat = d3.format(".2%"); 
    }
    else if (dataNums == "Trends") {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") 
              return {"label": e1, "val":dataset.zScores[idx]};
      }).slice(numQueryTerms);
      abbrFormat = d3.format(".2s"); 
    }
    else {
      this.data = $.map(dataset.tokens, function(e1, idx) {
          if (e1 != "") 
              return {"label": e1, "val":dataset.counts[idx]};
      }).slice(numQueryTerms);
    }
    //console.log(this.data);
    /*
    var data = dataset.vals;
    var labels = dataset.labels;
    console.log(labels);
    */
    var xScale = d3.scale.ordinal()
        .domain(this.data.map(function(d) {return d.label;}))
        .rangeRoundBands([this.margin.left, w], 0.05);

    var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
    var yScale = d3.scale.linear()
    .domain([0, d3.max(this.data, function(d) {return d.val;})])
    .range([h,20]);

    var yAxis = d3.svg.axis().scale(yScale).orient("left")
    .ticks(7);
    
    yAxis.tickFormat(abbrFormat);


    /*
    this.elems.svg.selectAll("rect")
      .data(this.data)
      .enter()
      .append("rect")
      .attr({
        x: function(d, i) { return i * (w / dataset.length); },
        y: function(d) { return h - (d * 4); },
        width: w/dataset.length - barPadding,
        height: function(d) {return d * 4; },
        fill : "rgb(0,0,255)" 
        });
    */
    this.elems.svg.selectAll("rect")
      .data(this.data)
      .enter()
      .append("rect")
      .attr("class", "bar") 
      .attr("x", function(d, i) {
        return xScale(d.label);
      })
      .attr("y", function(d) {
        return yScale(d.val);
      })
      .attr("width", xScale.rangeBand())
      .attr("height", function(d) {
        return h - yScale(d.val)
       })
       .attr("fill", "rgb(51,102,204)");
       
     this.elems.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + h + ")")
        .call(xAxis)
        .selectAll("text")
            .attr("class", "bar-label")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)"
            });

     this.elems.svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + this.margin.left + ",0)")
        .call(yAxis);
     /*
     this.elems.svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("y", 6)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90-)")
      .text("Z Scores");
    */

    $(".bar-label").click($.proxy(function(e) {
        var token = e.target.textContent;
        this.barCallback(token);
    }, this));

     $(".bar").click($.proxy(function(e) {
        var token = this.data[$(e.target).index()].label;
        this.barCallback(token);
    }, this));

        /*
        x: function(d, i) { return i * (w / data.length); },
        y: function(d) { return h - (d * 4); },
        width: w/data.length - barPadding,
        height: function(d) {return d * 4; },
        fill : "rgb(0,0,255)" 
        });
        */
    /*
    this.elems.svg.selectAll("text")
        .data(labels)
        .enter()
        .append("text")
        .text(function(d) {
            return d;
        })
        .attr("x", function(d, i) { return i * (w / labels.length); })
        .attr("y", function(d) { console.log(h); console.log(d); return h - (40 * 4); });
        */
    }
    


  }





