library(dyPencilgraphs)

ts <- ldeaths

dyPencilgraph(ts, "Deaths from Lung Disease (UK)") %>%
  dySeries("V1", label = "Deaths")

