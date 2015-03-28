library(dyPencilgraphs)
library(shiny)
library(DT)

shinyUI(fluidPage(
    fluidRow(
      column(2,
             sliderInput("tslevel",label = "constant to add to time series",min=0,max=1000,value = 0),
             sliderInput("plotNum","Number of Plots",2,step=1,max=5,min=1)
             ),
      column(5,
             uiOutput("dynamic_plots")
        ),
      column(5,
             uiOutput("dynamic_tables")
      )
    )
))