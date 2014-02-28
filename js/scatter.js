function Scatter (div) {
  this.mapd = MapD;
  this.div =  $(div).get(0);
  this.svg = null;
  this.width = null;
  this.height = null;
  this.xScale = null;
  this.yScale = null;
  this.rScale = null;
  this.cScale = null; 
  this.colorVar = null;
  this.margin = {top: 20, right: 40, bottom: 40, left: 40};
  this.joinParams = {
    "Country": {jointable: "country_data", joinvar: "name", joinattrs: "pst045212,iso_a2", pop_var: "pst045212", map_key: "ISO2", data_key: "iso_a2", data_col: "country"},
    "State": {jointable: "state_data", joinvar: "name", joinattrs: "pst045212", pop_var: "pst045212", map_key: "abbr", data_key: "label", data_col: "contributor_state"},
    "County": {jointable: "county_data", joinvar: "fips", joinattrs: "pst045212,fips", pop_var: "pst045212", map_key: "id", data_key: "label", data_col: "contributor_county_fips"}
  },
  this.format = null;
  this.data = null;
  this.selectedVar = "pst045212";
  this.dataSource = "State";
  this.varPicker = null;
  this.curJoinParams = null;
  this.params = {
    bbox: null,
    request: "GroupByToken",
    jointable: "state_data",
    joinvar: "name",
    joinattrs: "pst045212",
    sort: false,
    sql: null,
    k: 10000

  };

  this.init = function() {
    this.width = $(this.div).width() - this.margin.left - this.margin.right;
    this.height = $(this.div).height() - this.margin.top - this.margin.bottom;
    this.svg = d3.select(this.div)
      .attr("class", "scatterplot")
      .append("svg")
      .attr("width", this.width + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.xScale = d3.scale.linear().range([0,this.width]);
    this.yScale = d3.scale.linear().range([this.height,0]); 
    this.rScale = d3.scale.linear().range([2,5]);
    this.cScale = d3.scale.category10();
    this.xAxis = d3.svg.axis().scale(this.xScale).orient("bottom").ticks(5);
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left").ticks(5);

     this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis);
     this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height  +")")
        .call(this.xAxis);
        //$(this.varPicker).appendTo($(this.elems.container));
  },

  this.reload = function(options) {
    if ($(this.div).dialog("isOpen")) {
      $.getJSON(this.getURL(options)).done($.proxy(this.addData, this));
    }
  };

  this.getURL = function(options) {
      this.params.bbox = this.mapd.map.getExtent().toBBOX();
      if (this.colorVar != null)
          this.params.joinattrs = this.curJoinParams.pop_var + "," + this.selectedVar + "," + this.colorVar;
      else
          this.params.joinattrs = this.curJoinParams.pop_var + "," + this.selectedVar;
      this.params.sql = "select " + this.curJoinParams.data_col + ", amount from " + this.mapd.table + this.mapd.getWhere(options);
      var url = this.mapd.host + '?' + buildURI(this.params);
      return url;
  };

  this.addData = function(dataset) { 
    this.svg.selectAll("circle")
    .data([])
    .exit()
    .remove();
    console.log("adddata");
    //var minN = this.minTweets;
    this.data = dataset.results;
    var data = this.data;
    var numVals = this.data.length;
    var popVar = this.curJoinParams.pop_var;
    var selectedVar = this.selectedVar;
    switch (MapD.dataView) {
      case "counts":
        this.format = d3.format(".2s"); 
        for (var i = 0; i < numVals; i++)
           data[i].val = data[i].n / data[i][popVar];
      break;
      case "dollars":
        this.format = d3.format("$,.2s"); 
         for (var i = 0; i < numVals; i++)
             data[i].val = data[i].y * data[i].n / data[i][popVar];
         break;
      case "dollsperdon":
         for (var i = 0; i < numVals; i++)
             data[i].val = data[i].y;
         break;
    }     

    this.yAxis.tickFormat(this.format);
    if (this.selectedVar.search("inc") != -1)
        this.xAxis.tickFormat(d3.format("$,.2s"));
    else
      this.xAxis.tickFormat(d3.format(".2s"));

    this.xScale
      .domain([d3.min(this.data, function(d) {return d[selectedVar];}), d3.max(this.data, function(d) {return d[selectedVar];})]);
    this.getYScale();
    /*this.yScale
      .domain([d3.min(this.data, function(d) {return d.val;}), d3.max(this.data, function(d) {return d.val;})]);
      */

    var xScale = this.xScale;
    var yScale = this.yScale;
    var rScale = this.rScale;
    var cScale = this.cScale;
    var colorVar = this.colorVar;

    this.svg.selectAll("circle")
        .data(this.data)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d[selectedVar]);
          })
        .attr("cy", function(d) {
            return yScale(d.val);
          })
        .attr("r", 2)
        .style("fill", function(d) {
          return cScale(d[colorVar]);
        })
        .append("svg:title")
        .text(function (d) {
          return d.label; 
        });
        this.svg.select("g.x.axis")
        .call(this.xAxis);
        this.svg.select("g.y.axis")
        .call(this.yAxis);



      $(this).trigger('loadend');
    };

  this.getYScale = function() {
    var dataArray =  new Array;
    for (var o in this.data) {
       dataArray.push(this.data[o].val);
    }
    dataArray.sort(d3.ascending);
    var minQuantile = d3.quantile(dataArray, 0.05);
    if (minQuantile == 0) {
      for (var o in this.data) {
        if (data[o].val > 0) {
          minQuantile = data[o].val;
          break;
        }
      }
    }
    var maxQuantile = d3.quantile(dataArray, 0.95);
    this.yScale.domain([minQuantile,maxQuantile]);
  };





  this.setDataset = function(dataSource) {
    this.dataSource = dataSource;
    this.curJoinParams = this.joinParams[this.dataSource];
    this.params.jointable = this.curJoinParams.jointable;
    this.params.joinattrs = this.curJoinParams.pop_var;
    this.params.joinvar = this.curJoinParams.joinvar;

    //this.dataSource = dataSource.toLowerCase(); 
    $.getJSON(this.getScatterVarsURL()).done($.proxy(this.onScatterVarsLoad, this));
  };

  this.getScatterVarsURL = function() {
    var scatterParams = {};
    scatterParams.request = "GetTableCols";
    scatterParams.table = this.params.jointable;
    var url = this.mapd.host + '?' + buildURI(scatterParams);
    console.log(url);
    return url;
  };

  this.onScatterVarsLoad = function(json) {
    this.setVars(json);
    //this.reload();
  }

  this.setVars = function(vars) {
    $(this.varPicker).remove();
    console.log(vars);
    this.varPicker = $("<select></select>").attr("id", "scatterXVarSelect").appendTo($(this.div));
    this.vars = $.map(vars.columns, function (c, idx) {
      if (c.tag == "null" || c.tag.search(":") == -1)
        return null;
      return c;
    });
    var defaultIndex = -1;
    var defaultVar = null;
    var selectedVarFoundIndex = -1;
    var colorIndex = -1;
    $(this.vars).each($.proxy(function(index, element) {
      if ((element.tag) == "color:") {
        this.colorVar = element.name;
        colorIndex = index;
        return true;
      }
      if (element.name == this.selectedVar)
        selectedVarFoundIndex = index;
      var tag = element.tag.substring(1,element.tag.length-1)      
      var elemArray = tag.split(':');
      if (elemArray[0].substring(0,3) == "pct")
        elemArray[1] = "% " + elemArray[1];
      if (elemArray[0].search("default") != -1) {
        defaultIndex = index;
        console.log("default: " + element.name);
        defaultVar = element.name; 
      }
      $(this.varPicker).append('<option Value="' + element.name +'">'+elemArray[1]+'</option>')
    }, this));

      if (selectedVarFoundIndex >= 0) {
        if (colorIndex != -1 && colorIndex < selectedVarFoundIndex)
          selectedVarFoundIndex--;
        $(this.varPicker).children().eq(selectedVarFoundIndex).prop('selected', true);
      }
      else if (defaultIndex >= 0) {
        if (colorIndex != -1 && colorIndex < defaultIndex)
          defaultIndex--;
        this.selectedVar = defaultVar;
        console.log("this selected var: " + this.selectedVar);
        $(this.varPicker).children().eq(defaultIndex).prop('selected', true);
      }
      $(this.varPicker).change($.proxy(this.scatterVarChange, this));
    };

    this.scatterVarChange = function() {
      console.log(this);
      this.selectedVar = $(this.varPicker).find("option:selected").get(0).value;
      console.log(this.selectedVar);
      this.reload();
    
  };
  }

