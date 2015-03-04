### dyPencilgraphs for R

The dyPencilgraphs extends the dygraphs package to do a simple function whereby you can input a curve using a pencil drawing tool.  This also binds the values of the curve to the input$variable of your shiny application.  The dygraphs javascript example from which this was constructed can be found under the [dygraphs gallery](http://dygraphs.com/gallery/)

#### Installation

The dyPencilgraphs package depends on the dygraphs package and the development version of the [htmlwidgets](https://github.com/ramnathv/htmlwidgets) package so you need to install both packages. You can do this using the **devtools** package as follows:

```S
devtools::install_github(c("ramnathv/htmlwidgets", "rstudio/dygraphs","albre116/DygraphsPencil"))
```

#### Usage

If you have an xts-compatible time-series object creating an interactive plot where you can drag the mouse to alter the data is as simple as this:

```S
dyPencilgraph(ts, "Deaths from Lung Disease (UK)")
```

You can also further customize axes and series display as well as add interacitve features like a range selector.  As a note, with dyPencilGraphs you can only plot 1 series:

```S
    dyPencilgraph(ts, "Deaths from Lung Disease (UK)") %>%  ###you can only do 1 series or it will fail
      dySeries("V1","Deaths",fillGraph=T) %>%
      dyAxis("y",valueRange=c(min(ts),max(ts))) %>% ###you must specify the y values range or it will fail
      dyRangeSelector()
```

See the [dygraphs gallery](http://dygraphs.com/gallery/) for the dygraphs package for additional details and examples.









