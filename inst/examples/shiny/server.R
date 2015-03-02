library(dyPencilgraphs)
library(datasets)
library(xts)

shinyServer(function(input, output) {
  
  ts <- ldeaths
  
  output$dyPencilgraph <- renderdyPencilgraph({
    dyPencilgraph(ts, "Deaths from Lung Disease (UK)") %>%  ###you can only do 1 series or it will fail
      dySeries("V1","Deaths") %>%
      dyAxis("y",valueRange=c(min(ts),max(ts))) %>% ###you must specify the y values range or it will fail
      dyRangeSelector()
    
    
  })
  
  output$from <- renderText({
    if (!is.null(input$dyPencilgraph_date_window))
      strftime(input$dyPencilgraph_date_window[[1]], "%d %b %Y")      
  })
  
  output$to <- renderText({
    if (!is.null(input$dyPencilgraph_date_window))
      strftime(input$dyPencilgraph_date_window[[2]], "%d %b %Y")
  })
  
  output$datas <- renderDataTable({
    if(input$updateTable==0){
      p <- as.numeric(time(ts))
      pp <- as.numeric(ts)
      out <- data.frame("V1"=as.POSIXct(p,format="%Y",origin = "1970-01-01"),"V2"=pp)
      return(out)
    }
    raw <- isolate(input$dyPencilgraph_data_extract)
    dimension <- isolate(input$dyPencilgraph_data_dimension_RowCol)
    out <- matrix(raw,nrow=dimension[[1]],ncol=dimension[[2]],byrow = T)
    out <- as.data.frame(out)
    return(out)
    
  })
  
})