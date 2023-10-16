# kmz-kml-parser
tool to parse and display kml files or more specifically extracted kmz files.
right now it is just an html file that shows a map and table showing praced data using with javascript but i might make it into a library someday.

kml file is named dat.kml because that is what an extracted kmz file defaults as.
images for marker icons are located in /images folder

why this exist: google maps has a great tool called google my maps. you can build wonderful maps but the problem is when you export to a kml or kmz the javascript google maps api KML-LAYERS does not support folders (layers) or editing anything in the kml layer. so best solution i could come up with was a javascript parser. Alternatively you could not use the my maps tool and make your own mini database and kinda do a reverse parse but that equally as frustrating being the my maps tool is nice.

working: including styles
markers
lines
parsing folders

Not included yet:
3d anything 
whatever other features don't work

special thanks to chat GPT-4 for doing most the heavy work.

