# Cameras Scrapper

This project is a scrapper, to store and aggregate all camera informations we can find, from different sources.  
It is also a website who serve stored cameras on an interactive map.

The different sources are :
  - **camerci**, public and "official" site : https://camerci.fr
  - **parisPoliceArcgis**, for Paris police prefecture, public and "official" site : https://arcg.is/08y0y10
  - **sousSurveillanceNet**, free filled by users : https://www.sous-surveillance.net
  - **surveillanceUnderSurveillance**, free filled by users, through Open Street Map : https://sunders.uber.space
  - **allOverpassOsm**, scrap cameras from Open Street Map, using overpass (an OSM query system). It returns same cameras as **SurveillanceUnderSurveillance**, but it's slower.
  - **umapAngers**, it is an umap instance which mention cameras in Angers in France (filled by users) : https://umap.openstreetmap.fr/fr/map/publicites-angers_1109346#12/47.4563/-0.5581


"scrapped" or "exported" cameras from existing sites, and cameras dumps aggregateds by Cameras Scrapper, are availables in [this repo](https://github.com/anonymous-cucumber/cameras-csvs).
You can aggregate and import them in your Cameras Scrapper instance, by using commands described bellow.


## How to use

At the first time, you have to install dependencies :
```
cd project
npm install
```
or
```
docker-compose run project npm install
docker-compose down
```

Then, you have to copy the env.example file into .env file. You also can edit this file to change database login/password  

Then, you have to run the project :
```
docker-compose up -d
```

You can now run the commands described below in the "How it works" section, and access to the web interface on http://localhost:8000

## Goals

The goal of this project is to centralize as many surveillance cameras positions as possible, in an autonomous database.  
Theses centralized cameras positions are served on a map, on a little website, which can be easily hosted, deployed, and redeployed if necessary.

## Why ?

### More complete and reliable cameras database

At first, we want to centralize surveillance cameras positions to have a more reliable and complete cameras positions database, to better anticipate them on the ground.

At this time, several sites exist, to localize many surveillance cameras.  
Some sites are filled by authorities, with only "official" public cameras, and other sites are free filled by users on internet, from cameras they see in the street.  

Some cameras are present on some sites, but not on other. Official public cameras sites don't show non-official cameras.  
Free filled cameras sites don't have all existing cameras, because of users who fill are not perfect.  

By centralizing these uncomplete cameras databases, we have a more complete and reliable cameras database to better anticipate them.

### More resilience

All of these existing cameras websites are hosted by other than us, with no possibility to redeploy them by ourself.  
If websites are down, closed by autorithies, or simply not accessible, we will have no longer access to cameras positions.  
With camera scrapper, we have an autonomous tool, easily redeployable, and easy hostable cameras database.  

## How it works

### Commands

#### Scrapping

The first feature of this tool is the scrapping.  
We can scrap cameras from the differents sources (listed above), in CSV files.  

The command to do that :
```
docker-compose exec project node console.js scrap <source> [additionnal params]
```
**< source >** : Mandatory, what source we want to scrap. Existing sources are enumerated at the beginning of this file.  
**[additional params]** : Optionnal, it's a simple string. This params is only mandatory for 'surveillanceUnderSurveillance' to specify what zone to scrap.

All scrapped datas are stored in the `project/CSVs_scraps/` folder

#### Aggregating

Once datas scrapped, we want to "aggregate" them in the database  
The differents scrapped .csv files, can be imported/aggregated in the database.  

The command to do that :
```
docker-compose exec project node console.js aggregate [sources] [datetime] [additionalParams]
```

**[sources]** : Optionnal, sources we want to aggregate in the database, it's can be one source, several separated by commas, or 'all' to get all sources. Existing sources are enumerated at the beginning of this file  
**[datetime]** : Optionnal, from what datetime we want to aggregate .csv files. If we type '2024-05', we take all may 2024 files. if we type '2024-05-12Z14', we take all 12 may 2024 between 14 hours and 15 hours files. We also can type 'all'.  
**[additionalParams]** : Optionnal, what specific params we want to take. For surveillanceUnderSurveillance we can type 'paris' ou 'france' to aggregate 'paris' or 'france'. If we type 'nothing', it will only aggregate csv with no additional param. If no fill this params, we take all wanted files.  

#### Dumping

We can export and import database dumps, through CSV files.  
All dumps are stored in the folder `project/CSVs_dumps/`  

**To export** database dump to a CSV file, type this command :
```
docker-compose exec project node console.js dump export [part_size]
```
**[part_size]** : The part size is an optionnal argument, that specify how many cameras export by part. By default, command export cameras asynchronously, by packets of 10 000. Default value: 10_000  


**To import** database dump from a CSV file, type this command :
```
docker-compose exec project node console.js dump import [file_date] [part_size]
```
**[file_date]** : If there is only one file in folder, this file will be imported. If there is many files, you have to type a piece of date or datetime, to select file to import.  
**[part_size]** : How many cameras to import simultaneously. Default value: 50  

#### Remote dumping

We also can export and import database remotely, between CSV local file and a remote camera scrapper instance.  
It works like normal export and import, but with API calls between local and a remote instance of camera scrapper (example: local and preprod or prod)  

**To export** database remote dump to a local CSV file, type this command :
```
docker-compose exec project node console.js remote dump export [part_size]
```
**[part_size]** : The part size is an optionnal argument, that specify how many cameras export by part. By default, command export cameras asynchronously, by packets of 1000. Default value: 1000  


**To import** database remote dump from a local CSV file, type this command :
```
docker-compose exec project node console.js remote dump import [file_date] [part_size]
```
**[file_date]** : If there is only one file in folder, this file will be imported. If there is many files, you have to type a piece of date or datetime, to select file to import.  
**[part_size]** : How many cameras to import simultaneously. Default value: 50  

Of course, these commands have to be executed from your local instance.  

##### Remote dumping configuration

To make remote dumping configuration, you have to configure the .env file by specifying address, and admin password of API to call.  

**In your local .env file** :
```
REMOTE_PROJECT=<The remote address>
CLIENT_SIDE_ADMIN_API_TOKEN=<Your admin API key>
```

**In your remote .env file (on the remote server)** :
```
SERVER_SIDE_ADMIN_API_TOKEN=<Your admin API key>
```

#### Wipe cameras

Be careful ! This command is dangerous, if you type this, all cameras in the database will be deleted.   
Before typing this command, we recommand you to export database in a CSV file.  

The command :
```
docker-compose exec project node console.js wipe cameras
```

### Web interface

When we launch the project, a web server is exposed on the port 8000.  
This web interface is a map, to show aggregated cameras, with filters.
