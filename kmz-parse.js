
        async function initMap() {
            var map = new google.maps.Map(document.getElementById('map'), {
                zoom: 10,
                center: { lat: 0, lng: 0 }
            });

            let styles = {};
            let styleMaps = {};

            function kmlColorToCss(kmlColor) {
                if (kmlColor && kmlColor.length === 8) {
                    let a = kmlColor.substr(0, 2);
                    let b = kmlColor.substr(2, 2);
                    let g = kmlColor.substr(4, 2);
                    let r = kmlColor.substr(6, 2);
                    return `#${r}${g}${b}`;
                }
                return '#000000';
            }

            let folderPlacemarks = {};

            try {
                let response = await fetch('doc.kml');
                let text = await response.text();
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(text, "text/xml");

                // Extract styles
                let styleTags = xmlDoc.getElementsByTagName('Style');
                for (let style of styleTags) {
                    let id = style.getAttribute('id');
                    let iconTag = style.getElementsByTagName('Icon');
                    let lineStyleTag = style.getElementsByTagName('LineStyle');
                    if (iconTag.length > 0) {
                        let hrefTag = iconTag[0].getElementsByTagName('href');
                        styles[id] = {
                            icon: hrefTag[0].textContent
                        };
                    }
                    if (lineStyleTag.length > 0) {
                        let colorTag = lineStyleTag[0].getElementsByTagName('color');
                        let widthTag = lineStyleTag[0].getElementsByTagName('width');
                        styles[id] = {
                            color: kmlColorToCss(colorTag[0].textContent),
                            width: widthTag[0] ? parseFloat(widthTag[0].textContent) : 1
                        };
                    }
                }

                // Extract style maps
                let styleMapTags = xmlDoc.getElementsByTagName('StyleMap');
                for (let styleMap of styleMapTags) {
                    let id = styleMap.getAttribute('id');
                    let pairTags = styleMap.getElementsByTagName('Pair');
                    for (let pair of pairTags) {
                        let keyTag = pair.getElementsByTagName('key')[0];
                        if (keyTag.textContent === 'normal') {
                            let styleUrlTag = pair.getElementsByTagName('styleUrl')[0];
                            styleMaps[id] = styleUrlTag.textContent.replace("#", "");
                        }
                    }
                }

                // Extract folders and placemarks within them
                let folders = xmlDoc.getElementsByTagName('Folder');
                for (let folder of folders) {
                    let folderNameTag = folder.getElementsByTagName('name')[0];
                    let folderName = folderNameTag.textContent;

                    let placemarksForFolder = [];
                    let folderPlacemarkTags = folder.getElementsByTagName('Placemark');

                    for (let placemark of folderPlacemarkTags) {
                        let nameTag = placemark.getElementsByTagName('name')[0];
                        let styleUrlTag = placemark.getElementsByTagName('styleUrl')[0];
                        let coordinatesTag = placemark.getElementsByTagName('coordinates')[0];

                        let name = nameTag ? nameTag.textContent : 'No Name';
                        let styleUrl = styleUrlTag ? styleUrlTag.textContent.replace("#", "") : null;
                        let resolvedStyle = styleUrl ? (styleMaps[styleUrl] || styleUrl) : null;

                        if (!resolvedStyle) {
                            console.error("Style not found for placemark", name);
                            continue;
                        }

                        let coordsText = coordinatesTag.textContent.trim();

                        // Insert parsed details to the details table
                        let detailsTable = document.getElementById('detailsTable').getElementsByTagName('tbody')[0];
                        let detailsRow = detailsTable.insertRow();
                        let detailsNameCell = detailsRow.insertCell(0);
                        let detailsTypeCell = detailsRow.insertCell(1);
                        let detailsCoordsCell = detailsRow.insertCell(2);

                        detailsNameCell.textContent = name;

                        if (coordsText.includes('\n')) { // LineString
                            let coordinatesArray = coordsText.split('\n').map(coord => {
                                let [lng, lat] = coord.trim().split(',').map(parseFloat);
                                return { lat, lng };
                            });

                            let lineStyle = styles[resolvedStyle] || {};
                            let linePath = new google.maps.Polyline({
                                path: coordinatesArray,
                                geodesic: true,
                                strokeColor: lineStyle.color || '#000',
                                strokeOpacity: 1.0,
                                strokeWeight: lineStyle.width || 1
                            });

                            linePath.setMap(map);
                            placemarksForFolder.push({ type: 'line', element: linePath });

                            detailsTypeCell.textContent = 'Line';
                            detailsCoordsCell.textContent = coordsText.replace('\n', '; ');
                        } else { // Point (Marker)
                            let [lng, lat] = coordsText.split(',').map(parseFloat);
                            let markerStyle = styles[resolvedStyle] || {};
                            let marker = new google.maps.Marker({
                                position: { lat, lng },
                                map: map,
                                title: name,
                                icon: markerStyle.icon
                            });

                            placemarksForFolder.push({ type: 'marker', element: marker });

                            detailsTypeCell.textContent = 'Marker';
                            detailsCoordsCell.textContent = `${lat}, ${lng}`;
                        }
                    }

                    folderPlacemarks[folderName] = placemarksForFolder;

                    // Add folder name with checkbox to the table
                    let table = document.getElementById('placemarkTable').getElementsByTagName('tbody')[0];
                    let row = table.insertRow();
                    let checkboxCell = row.insertCell(0);
                    let nameCell = row.insertCell(1);

                    let checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = true; // default to visible
                    checkbox.addEventListener('change', function() {
                        for (let placemark of folderPlacemarks[folderName]) {
                            placemark.element.setVisible(checkbox.checked);
                        }
                    });

                    checkboxCell.appendChild(checkbox);
                    nameCell.textContent = folderName;
                }
            } catch (error) {
                console.error("Error processing KML", error);
            }
        }

        window.onload = initMap;
