library(dyPencilgraphs)
library(datasets)
library(xts)
library(dplyr)
library(dygraphs)
library(shiny)

shinyServer(function(input, output) {
  
  ts <- ldeaths
  
  TS <- reactive({
  ts <- ts+input$tslevel  
  return(ts)
  })

  

  
  output$dynamic_plots <- renderUI({
    ts <- TS()
    # Call renderPlot for each one. Plots are only actually generated when they
    # are visible on the web page.
    for (i in 1:input$plotNum) {
      # Need local so that each item gets its own number. Without it, the value
      # of i in the renderPlot() will be the same across all instances, because
      # of when the expression is evaluated.
      local({
        my_i <- i
        plotname <- paste("plot", my_i, sep="")
        output[[plotname]] <- renderdyPencilgraph({
          dyPencilgraph(ts, "Deaths from Lung Disease (UK)") %>%  ###you can only do 1 series or it will fail
            dySeries("V1","Deaths",fillGraph=T) %>%
            dyAxis("y",valueRange=c(min(ts),max(ts))) %>% ###you must specify the y values range or it will fail
            dyRangeSelector()
        })
      })
    }
    
    plot_output_list <- lapply(1:input$plotNum, function(i) {
      plotname <- paste("plot", i, sep="")
      dyPencilgraphOutput(plotname)
    })
    # Convert the list to a tagList - this is necessary for the list of items
    # to display properly.
    do.call(tagList, plot_output_list)
  })
  
  
  
  output$dynamic_tables <- renderUI({
    # Call renderPlot for each one. Plots are only actually generated when they
    # are visible on the web page.
    for (i in 1:input$plotNum) {
      # Need local so that each item gets its own number. Without it, the value
      # of i in the renderPlot() will be the same across all instances, because
      # of when the expression is evaluated.
      local({
        my_i <- i
        plotname <- paste("plot", my_i, sep="")
        grob <- paste0(plotname,"_data_extract")
        data <- input[[grob]]
        grob <- paste0(plotname,"_data_dimension_RowCol")
        dimension <-input[[grob]]
        data <- matrix(data,nrow=dimension[[1]],ncol=dimension[[2]],byrow = T)
        plotname <- paste("table", my_i, sep="")
        output[[plotname]] <- DT::renderDataTable({
          datatable(data)

        })
      })
    }
    
    plot_output_list <- lapply(1:input$plotNum, function(i) {
      plotname <- paste("table", i, sep="")
      DT::dataTableOutput(plotname)
    })
    # Convert the list to a tagList - this is necessary for the list of items
    # to display properly.
    do.call(tagList, plot_output_list)
  })
  
  
})