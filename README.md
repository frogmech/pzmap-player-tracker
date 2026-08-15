# pzmap-player-tracker
Tool to add live player tracking functionality to map.projectzomboid.com

# Instructions

### Requirements
<code>Python >3</code><br>
<code>[PZ Map mod](https://steamcommunity.com/sharedfiles/filedetails/?id=3770149036)</code><br>
<code>Tampermonkey [(Chrome)](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) [(Firefox)](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or another userscript manager</code>

### Setup
Ensure that [PZ Map](https://steamcommunity.com/sharedfiles/filedetails/?id=3770149036) is installed and enabled on your Zomboid save<br><br>
Install the userscript by clicking [here](https://raw.githubusercontent.com/frogmech/pzmap-player-tracker/refs/heads/main/pzmap-player-tracker.user.js) **OR** copy and paste the code from pzmap-player-tracker.user.js into Tampermonkey<br><br><br>
**Run the web server:**<br><br>
Download [pzmap-bridge-server.py]()<br><br>
Open a new terminal/command prompt window in the same directory as <code>pzmap-bridge-server.py</code><br>
In that window, run <code>python pzmap-bridge-server.py</code><br><br>

Start your Project Zomboid save, go to the [map](map.projectzomboid.com) and click follow player on the top left to immediately go to your player marker!
