import fs from "node:fs";

const data = JSON.parse(fs.readFileSync("data/site.json", "utf8"));
data.about.descriptionWordLimit = 20;
data.about.readMoreColor = "#dc2626";
data.amenities.items[0].iconImage = "/globe.svg";
data.location.connectivityGroupColor = "#facc15";
data.location.connectivityItemColor = "#a7f3d0";
data.location.connectivityTimeColor = "#f472b6";
data.location.connectivityIconColor = "#38bdf8";
data.location.connectivityBackgroundColor = "#1e1b4b";
data.virtualTourSection.playIconColor = "#dc2626";
data.virtualTourSection.playButtonColor = "#ffffff";
data.virtualTourSection.playButtonBorderColor = "#facc15";
data.virtualTourSection.headingColor = "#facc15";
fs.writeFileSync("data/site.json", JSON.stringify(data, null, 2));
console.log("test values applied");
