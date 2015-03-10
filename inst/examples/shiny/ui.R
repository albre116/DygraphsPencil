library(dyPencilgraphs)

shinyUI(fluidPage(
    fluidRow(
      column(2,
             sliderInput("tslevel",label = "constant to add to time series",min=0,max=1000,value = 0),
             div(strong("From: "), textOutput("from", inline = TRUE)),
             div(strong("To: "), textOutput("to", inline = TRUE)),
             actionButton("updateTable","Click to Refresh Data Table")
             ),
      column(10,
             dyPencilgraphOutput("dyPencilgraph"),
             div(strong("Data: "),dataTableOutput("datas"))
        )
    )
))