library(dyPencilgraphs)
library(datasets)
library(xts)
library(dplyr)
library(dygraphs)

ts <- ldeaths

dyPencilgraph(ts, "Deaths from Lung Disease (UK)") %>%  ###you can only do 1 series or it will fail
  dySeries("V1","Deaths",fillGraph=T) %>%
  dyAxis("y",valueRange=c(min(ts),max(ts))) %>% ###you must specify the y values range or it will fail
  dyRangeSelector()