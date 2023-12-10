export let MAPS: number[][][] = [];
async function fetchMapData() {
  try {
    const response = await fetch('/maps.txt'); // Relative path

    if (!response.ok) {
      throw new Error(`Failed to fetch map data: ${response.statusText}`);
    }

    const text = await response.text();
    const mapsData = text.trim().split('\n\n');

    MAPS = mapsData.map((map, index) => {
      const lines = map.split('\n');
      const mapArray = lines.map(line => line.trim().split(' ').map(Number));
      // Log the map in a readable format
      console.log(`Map ${index + 1}:`);
      mapArray.forEach(row => console.log(row.join(' ')));
      return mapArray;
    });
  } catch (error) {
    console.error('Error fetching or parsing map data:', error);
  }
}

fetchMapData();