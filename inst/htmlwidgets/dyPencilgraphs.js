HTMLWidgets.widget({

  name: "dyPencilgraphs",

  type: "output",

  initialize: function(el, width, height) { 
    return {};
  },

  resize: function(el, width, height, instance) {
    if (instance.dygraph)
      instance.dygraph.resize();
  },

  renderValue: function(el, x, instance) {
    //begin mark
      var isDrawing = false;
      var lastDrawRow = null; 
      var lastDrawValue = null;
      var tool = 'pencil';
      var valueRange = x.attrs.axes.y.valueRange;
      
    //end mark
    
    // reference to this for closures
    var thiz = this;
    
    // get dygraph attrs and populate file field
    var attrs = x.attrs;
    attrs.file = x.data;
        
    // resolve "auto" legend behavior
    if (x.attrs.legend == "auto") {
      if (x.data.length <= 2)
        x.attrs.legend = "onmouseover";
      else
        x.attrs.legend = "always";
    }
    
    // set appropriated function in case of fixed tz
    if ((attrs.axes.x.axisLabelFormatter === undefined) && x.fixedtz)
      attrs.axes.x.axisLabelFormatter = this.xAxisLabelFormatterFixedTZ(x.tzone);
      
    if ((attrs.axes.x.valueFormatter === undefined) && x.fixedtz)
      attrs.axes.x.valueFormatter = this.xValueFormatterFixedTZ(x.scale, x.tzone);

    if ((attrs.axes.x.ticker === undefined) && x.fixedtz)
      attrs.axes.x.ticker = this.customDateTickerFixedTZ(x.tzone);
  
    // provide an automatic x value formatter if none is already specified
    if ((attrs.axes.x.valueFormatter === undefined) && (x.fixedtz != true))
      attrs.axes.x.valueFormatter = this.xValueFormatter(x.scale);
    
    // convert time to js time
    attrs.file[0] = attrs.file[0].map(function(value) {
      return thiz.normalizeDateValue(x.scale, value);
    });
    if (attrs.dateWindow != null) {
      attrs.dateWindow = attrs.dateWindow.map(function(value) {
        var date = thiz.normalizeDateValue(x.scale, value);
        return date.getTime();
      });
    }
    
    // transpose array
    attrs.file = HTMLWidgets.transposeArray2D(attrs.file);
    
    // add drawCallback for group
    if (x.group != null)
      this.addGroupDrawCallback(x);  
      
    // add shading and event callback if necessary
    this.addShadingCallback(x);
    this.addEventCallback(x);
      
    // add default font for viewer mode
    if (this.queryVar("viewer_pane") === "1")
      document.body.style.fontFamily = "Arial, sans-serif";
    
    //if (instance.dygraph) { // update existing instance
       
    //instance.dygraph.updateOptions(attrs);
    
    //} else {  // create new instance
      
      // add shiny input for date window
      if (HTMLWidgets.shinyMode){
        this.addDateWindowShinyInput(el.id, x);
        //begin mark
        this.addDataCurveShinyInput(el.id, x);
        this.addNrowNcolShinyInput(el.id, x);
        //end mark
      }
  
      // inject css if necessary
      if (x.css != null) {
        var style = document.createElement('style');
        style.type = 'text/css';
        if (style.styleSheet) 
          style.styleSheet.cssText = x.css;
        else 
          style.appendChild(document.createTextNode(x.css));
        document.getElementsByTagName("head")[0].appendChild(style);
      }
      
      //begin mark
      var setPoint = function(event, g, context) {
        var canvasx = Dygraph.pageX(event) - Dygraph.findPosX(g.graphDiv);
        var canvasy = Dygraph.pageY(event) - Dygraph.findPosY(g.graphDiv);
        var xy = g.toDataCoords(canvasx, canvasy);
        var x = xy[0], value = xy[1];
        var rows = g.numRows();
        var closest_row = -1;
        var smallest_diff = -1;
        // TODO(danvk): binary search
        for (var row = 0; row < rows; row++) {
          var date = g.getValue(row, 0);  // millis
          var diff = Math.abs(date - x);
          if (smallest_diff < 0 || diff < smallest_diff) {
            smallest_diff = diff;
            closest_row = row;
          }
        }

        if (closest_row != -1) {
          if (lastDrawRow === null) {
            lastDrawRow = closest_row;
            lastDrawValue = value;
          }
          var coeff = (value - lastDrawValue) / (closest_row - lastDrawRow);
          if (closest_row == lastDrawRow) coeff = 0.0;
          var minRow = Math.min(lastDrawRow, closest_row);
          var maxRow = Math.max(lastDrawRow, closest_row);
          for (var row = minRow; row <= maxRow; row++) {
            if (tool == 'pencil') {
              var val = lastDrawValue + coeff * (row - lastDrawRow);
              val = Math.max(valueRange[0], Math.min(val, valueRange[1]));
              attrs.file[row][1] = val;
              if (val === null || value === undefined || isNaN(val)) {
                console.log(val);
              }
            } else if (tool == 'eraser') {
              attrs.file[row][1] = null;
            }
          }
          lastDrawRow = closest_row;
          lastDrawValue = value;
          g.updateOptions({ file: attrs.file });
          g.setSelection(closest_row);  // prevents the dot from being finnicky.
        }
      }
      
    var finishDraw = function() {
        isDrawing = false;
        lastDrawRow = null;
        lastDrawValue = null;
      }
      //end mark
      
      //begin mark
      
      attrs.interactionModel = {
              mousedown: function (event, g, context) {
                if (tool == 'zoom') {
                  Dygraph.defaultInteractionModel.mousedown(event, g, context);
                } else {
                  // prevents mouse drags from selecting page text.
                  if (event.preventDefault) {
                    event.preventDefault();  // Firefox, Chrome, etc.
                  } else {
                    event.returnValue = false;  // IE
                    event.cancelBubble = true;
                  }
                  isDrawing = true;
                  setPoint(event, g, context); 
                }
              },
              mousemove: function (event, g, context) {
                if (tool == 'zoom') {
                  Dygraph.defaultInteractionModel.mousemove(event, g, context);
                } else {
                  if (!isDrawing) return;
                  setPoint(event, g, context);
                }
              },
              mouseup: function(event, g, context) {
                if (tool == 'zoom') {
                  Dygraph.defaultInteractionModel.mouseup(event, g, context);
                } else {
                  finishDraw();
                }
              },
              mouseout: function(event, g, context) {
                if (tool == 'zoom') {
                  Dygraph.defaultInteractionModel.mouseout(event, g, context);
                }
              },
              dblclick: function(event, g, context) {
                Dygraph.defaultInteractionModel.dblclick(event, g, context);
              },
              mousewheel: function(event, g, context) {
                var normal = event.detail ? event.detail * -1 : event.wheelDelta / 40;
                var percentage = normal / 50;
                var axis = g.xAxisRange();
                var xOffset = g.toDomCoords(axis[0], null)[0];
                var x = event.offsetX - xOffset;
                var w = g.toDomCoords(axis[1], null)[0] - xOffset;
                var xPct = w === 0 ? 0 : (x / w);

                var delta = axis[1] - axis[0];
                var increment = delta * percentage;
                var foo = [increment * xPct, increment * (1 - xPct)];
                var dateWindow = [ axis[0] + foo[0], axis[1] - foo[1] ];

                g.updateOptions({
                  dateWindow: dateWindow
                });
                Dygraph.cancelEvent(event);
              }
            };
      
      //end mark
      
      
      // create the instance and add it to it's group (if any)
      instance.dygraph = new Dygraph(el, attrs.file, attrs);
      if (x.group != null)
        this.groups[x.group].push(instance.dygraph);
    //}
     
    // set annotations
    if (x.annotations != null) {
      instance.dygraph.ready(function() {
        x.annotations.map(function(annotation) {
          var date = thiz.normalizeDateValue(x.scale, annotation.x);
          annotation.x = date.getTime();
        });
        instance.dygraph.setAnnotations(x.annotations);
      }); 
    }
      
  },
  
  // set of functions needed with fixed tz
  customDateTickerFixedTZ : function(tz){
    return function(a, b, pixels, opts, dygraph, vals) {   
      var chosen = Dygraph.pickDateTickGranularity(a, b, pixels, opts);
      if (chosen >= 0) {
        var formatter = (opts("axisLabelFormatter"));
        var ticks = [];
        var t; 

        if (chosen < Dygraph.MONTHLY) {
          // Generate one tick mark for every fixed interval of time.
          var spacing = Dygraph.SHORT_SPACINGS[chosen];

          // Find a time less than start_time which occurs on a "nice" time boundary
          // for this granularity.
          var g = spacing / 1000;
          var d = moment(a);
          d.tz(tz); 
          d.millisecond(0);

          var x;
          if (g <= 60) {  // seconds 
            x = d.second();         
            d.second(x - x % g);     
          } else {
            d.second(0);
            g /= 60; 
            if (g <= 60) {  // minutes
              x = d.minute();
              d.minute(x - x % g);
            } else {
              d.minute(0);
              g /= 60;

              if (g <= 24) {  // days
                x = d.hour();
                d.hour(x - x % g);
              } else {
                d.hour(0);
                g /= 24;

                if (g == 7) {  // one week
                  d.startOf('week');
                }
              }
            }
          }
          a = d.valueOf();

          // For spacings coarser than two-hourly, we want to ignore daylight
          // savings transitions to get consistent ticks. For finer-grained ticks,
          // it's essential to show the DST transition in all its messiness.
          var start_offset_min = moment(a).tz(tz).zone();
          var check_dst = (spacing >= Dygraph.SHORT_SPACINGS[Dygraph.TWO_HOURLY]);

          for (t = a; t <= b; t += spacing) {
            d = moment(t).tz(tz);

            // This ensures that we stay on the same hourly "rhythm" across
            // daylight savings transitions. Without this, the ticks could get off
            // by an hour. See tests/daylight-savings.html or issue 147.
            if (check_dst && d.zone() != start_offset_min) {
              var delta_min = d.zone() - start_offset_min;
              t += delta_min * 60 * 1000;
              d = moment(t).tz(tz);
              start_offset_min = d.zone();

              // Check whether we've backed into the previous timezone again.
              // This can happen during a "spring forward" transition. In this case,
              // it's best to skip this tick altogether (we may be shooting for a
              // non-existent time like the 2AM that's skipped) and go to the next
              // one.
              if (moment(t + spacing).tz(tz).zone() != start_offset_min) {
                t += spacing;
                d = moment(t).tz(tz);
                start_offset_min = d.zone();
              }
            }

            ticks.push({ v:t,
                      label: formatter(d, chosen, opts, dygraph)
                    });
          }
        } else {
          // Display a tick mark on the first of a set of months of each year.
          // Years get a tick mark iff y % year_mod == 0. This is useful for
          // displaying a tick mark once every 10 years, say, on long time scales.
          var months;
          var year_mod = 1;  // e.g. to only print one point every 10 years.
          if (chosen < Dygraph.NUM_GRANULARITIES) {
            months = Dygraph.LONG_TICK_PLACEMENTS[chosen].months;
            year_mod = Dygraph.LONG_TICK_PLACEMENTS[chosen].year_mod;
          } else {
            Dygraph.warn("Span of dates is too long");
          }

          var start_year = moment(a).tz(tz).year();
          var end_year   = moment(b).tz(tz).year();
          for (var i = start_year; i <= end_year; i++) {
            if (i % year_mod !== 0) continue;
            for (var j = 0; j < months.length; j++) {
              var dt = moment.tz(new Date(i, months[j], 1), tz); 
              dt.year(i);
              t = dt.valueOf();
              if (t < a || t > b) continue;
              ticks.push({ v:t,
                        label: formatter(moment(t).tz(tz), chosen, opts, dygraph)
                      });
            }
          }
        }
        return ticks;
      }else{
      // this can happen if self.width_ is zero.
        return [];
      }
    };
  },

  xAxisLabelFormatterFixedTZ : function(tz){
  
    return function dateAxisFormatter(date, granularity){
      var mmnt = moment(date).tz(tz);
      if (granularity >= Dygraph.DECADAL){
        return mmnt.format('YYYY');
      }else{
        if(granularity >= Dygraph.MONTHLY){
          return mmnt.format('MMM YY');
        }else{
          var frac = mmnt.hour() * 3600 + mmnt.minute() * 60 + mmnt.second() + mmnt.millisecond();
            if (frac === 0 || granularity >= Dygraph.DAILY) {
              return mmnt.format('DD MMM');
            } else {
             if (mmnt.second()) {
               return mmnt.format('HH:mm:ss');
             } else {
               return mmnt.format('HH:mm');
             }
            }
         } 
                        
       }         
   }
  },
         
  xValueFormatterFixedTZ: function(scale, tz) {
                   
    return function(millis) {
      var mmnt = moment(millis).tz(tz);
        if (scale == "yearly")
          return mmnt.format('YYYY') + ' (' + mmnt.zoneAbbr() + ')';
        else if (scale == "monthly" || scale == "quarterly")
          return mmnt.format('MMMM, YYYY')+ ' (' + mmnt.zoneAbbr() + ')';
        else if (scale == "daily" || scale == "weekly")
          return mmnt.format('MMMM, DD, YYYY')+ ' (' + mmnt.zoneAbbr() + ')';
        else
          return mmnt.format('MMMM, DD, YYYY HH:mm:ss')+ ' (' + mmnt.zoneAbbr() + ')';
    }
  },
  
  xValueFormatter: function(scale) {
    
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      
    return function(millis) {
      var date = new Date(millis);
        if (scale == "yearly")
          return date.getFullYear();
        else if (scale == "monthly" || scale == "quarterly")
          return monthNames[date.getMonth()] + ' ' + date.getFullYear(); 
        else if (scale == "daily" || scale == "weekly")
          return monthNames[date.getMonth()] + ' ' + 
                           date.getDate() + ' ' + 
                           date.getFullYear();
        else
          return date.toLocaleString();
    }
  },
  
  groups: {},
  
  addGroupDrawCallback: function(x) {
    
    // get attrs
    var attrs = x.attrs;
    
    // check for an existing drawCallback
    var prevDrawCallback = attrs["drawCallback"];
    
    this.groups[x.group] = this.groups[x.group] || [];
    var group = this.groups[x.group];
    var blockRedraw = false;
    attrs.drawCallback = function(me, initial) {
      
      // call existing
      if (prevDrawCallback)
        prevDrawCallback(me, initial);
      
      // sync peers in group
      if (blockRedraw || initial) return;
      blockRedraw = true;
      var range = me.xAxisRange();
      for (var j = 0; j < group.length; j++) {
        if (group[j] == me) continue;
        group[j].updateOptions({
          dateWindow: range
        });
      }
      blockRedraw = false;
    };
  },
  
  addShadingCallback: function(x) {
    
    // bail if no shadings
    if (x.shadings.length == 0)
      return;
    
    // alias this
    var thiz = this;
    
    // get attrs
    var attrs = x.attrs;
    
    // check for an existing underlayCallback
    var prevUnderlayCallback = attrs["underlayCallback"];
    
    // install callback
    attrs.underlayCallback = function(canvas, area, g) {
      
      // call existing
      if (prevUnderlayCallback)
        prevUnderlayCallback(canvas, area, g);
        
      for (var i = 0; i < x.shadings.length; i++) {
        var shading = x.shadings[i];
        var x1 = thiz.normalizeDateValue(x.scale, shading.from).getTime();
        var x2 = thiz.normalizeDateValue(x.scale, shading.to).getTime();
        var left = g.toDomXCoord(x1);
        var right = g.toDomXCoord(x2);
        canvas.save();
        canvas.fillStyle = shading.color;
        canvas.fillRect(left, area.y, right - left, area.h);
        canvas.restore();
      }
    };
  },
  
  addEventCallback: function(x) {
    
    // bail if no evets
    if (x.events.length == 0)
      return;
    
    // alias this
    var thiz = this;
    
    // get attrs
    var attrs = x.attrs;
    
    // check for an existing underlayCallback
    var prevUnderlayCallback = attrs["underlayCallback"];
    
    // install callback
    attrs.underlayCallback = function(canvas, area, g) {
      
      // call existing
      if (prevUnderlayCallback)
        prevUnderlayCallback(canvas, area, g);
        
      for (var i = 0; i < x.events.length; i++) {
        
        // get event and x-coordinate
        var event = x.events[i];
        var xPos = thiz.normalizeDateValue(x.scale, event.date).getTime();
        xPos = g.toDomXCoord(xPos);
        
        // draw line
        canvas.save();
        canvas.strokeStyle = event.color;
        thiz.dashedLine(canvas, 
                        xPos, 
                        area.y, 
                        xPos, 
                        area.y + area.h,
                        event.strokePattern);
        canvas.restore();
        
        // draw label
        if (event.label != null) {
          canvas.save();
          thiz.setFontSize(canvas, 12);
          var size = canvas.measureText(event.label);
          var tx = xPos - 4;
          var ty;
          if (event.labelLoc == "top")
            ty = area.y + size.width + 10;
          else
            ty = area.y + area.h - 10;
          canvas.translate(tx,ty);
          canvas.rotate(3 * Math.PI / 2);
          canvas.translate(-tx,-ty);
          canvas.fillText(event.label, tx, ty);
          canvas.restore();
        }
      }
    };
  },
  
  addDateWindowShinyInput: function(id, x) {
      
    // check for an existing drawCallback
    var prevDrawCallback = x.attrs["drawCallback"];
    
    // install the callback
    x.attrs.drawCallback = function(me, initial) {
      
      // call existing
      if (prevDrawCallback)
        prevDrawCallback(me, initial);
        
      // fire input change
      var range = me.xAxisRange();
      var dateWindow = [new Date(range[0]), new Date(range[1])];
      Shiny.onInputChange(id + "_date_window", dateWindow); 
    };
  },
      addNrowNcolShinyInput: function(id, x) {
      
    // check for an existing drawCallback
    var prevDrawCallback = x.attrs["drawCallback"];
    
    // install the callback
    x.attrs.drawCallback = function(me, initial) {
      //console.log("we are here at addNrowNcolShinyInput");
      
      // call existing
      if (prevDrawCallback)
        prevDrawCallback(me, initial);
        
      // fire input change
      var ncol = me.numColumns();
      var nrow = me.numRows();
      var dimension = [nrow , ncol];
      Shiny.onInputChange(id + "_data_dimension_RowCol", dimension); 
    };
  },
  
  
    addDataCurveShinyInput: function(id, x) {
      
    // check for an existing drawCallback
    var prevDrawCallback = x.attrs["drawCallback"];
    
    // install the callback
    x.attrs.drawCallback = function(me, initial) {
      
      // call existing
      if (prevDrawCallback)
        prevDrawCallback(me, initial);
        
      // fire input change
      
      var ncol = me.numColumns();
      var nrow = me.numRows();
      var data = [];
      for (var i = 0; i<nrow; i++){
        for (var j = 0; j<ncol; j++){
          data.push(me.getValue(i,j));
        }
      }
      
      Shiny.onInputChange(id + "_data_extract", data); 
    };
  },
  
  
  // Add dashed line support to canvas rendering context
  // See: http://stackoverflow.com/questions/4576724/dotted-stroke-in-canvas
  dashedLine: function(canvas, x, y, x2, y2, dashArray) {
    canvas.beginPath();
    if (!dashArray) dashArray=[10,5];
    if (dashLength==0) dashLength = 0.001; // Hack for Safari
    var dashCount = dashArray.length;
    canvas.moveTo(x, y);
    var dx = (x2-x), dy = (y2-y);
    var slope = dx ? dy/dx : 1e15;
    var distRemaining = Math.sqrt( dx*dx + dy*dy );
    var dashIndex=0, draw=true;
    while (distRemaining>=0.1){
      var dashLength = dashArray[dashIndex++%dashCount];
      if (dashLength > distRemaining) dashLength = distRemaining;
      var xStep = Math.sqrt( dashLength*dashLength / (1 + slope*slope) );
      if (dx<0) xStep = -xStep;
      x += xStep
      y += slope*xStep;
      canvas[draw ? 'lineTo' : 'moveTo'](x,y);
      distRemaining -= dashLength;
      draw = !draw;
    }
    canvas.stroke();
  },
  
  setFontSize: function(canvas, size) {
    var cFont = canvas.font;
    var parts = cFont.split(' ');
    if (parts.length === 2)
      canvas.font = size + 'px ' + parts[1];
    else if (parts.length === 3)
      canvas.font = parts[0] + ' ' + size + 'px ' + parts[2];
  },
  
  // Returns the value of a GET variable
  queryVar: function(name) {
    return decodeURI(window.location.search.replace(
      new RegExp("^(?:.*[&\\?]" +
                 encodeURI(name).replace(/[\.\+\*]/g, "\\$&") +
                 "(?:\\=([^&]*))?)?.*$", "i"),
      "$1"));
  },
  
  // We deal exclusively in UTC dates within R, however dygraphs deals 
  // exclusively in the local time zone. Therefore, in order to plot date
  // labels that make sense to the user when we are dealing with days,
  // months or years we need to convert the UTC date value to a local time
  // value that "looks like" the equivilant UTC value. To do this we add the
  // timezone offset to the UTC date.
  normalizeDateValue: function(scale, value) {
    var date = new Date(value); 
    if (scale != "minute" && scale != "hourly") {
      var localAsUTC = date.getTime() + (date.getTimezoneOffset() * 60000);
      date = new Date(localAsUTC);
    }
    return date;
  }
  
});

