# CameraScrapper

This project is a scrapper, to store and aggregate all camera informations we can find, from different sources :  
  - Camerci : https://camerci.fr
  - The arcgis project for Paris police prefecture : https://arcg.is/08y0y10
  - The "sous surveillance" project : https://www.sous-surveillance.net

## Execute commandes

You can execute commands with the console.js like this:  
  node console.js [action] [param1] [param2]

## How to scrap datas

To scrap datas, you have to execute 'export' command, with the scrapper has argument :  
  node console.js export camerci|parisPoliceArcgis|sousSourveillanceNet

Then, a CSV file will be created in the CSVs/ folder.

## Aggregate datas

Currently, the aggregation part is not yet developped.
We will use a mongo database, to aggretate all cameras with them coordinates and additionnal datas.

To not store a same camera many time (if it's stored in several CSV files), we will check, when adding a camera to mongodb, if another camera is less than 1m away in database, if yes, we don't store the new camera, except if his source is "Paris Sous surveillance" (because they have more informations)

## Map

Later, we will create an openstreetmap, with all aggregated cameras
