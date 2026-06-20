// Major Indian cities + popular pilgrimage and tourist destinations.
export const INDIAN_CITIES = [
  "Mumbai","Delhi","Bangalore","Chennai","Kolkata","Hyderabad","Pune","Ahmedabad",
  "Jaipur","Lucknow","Surat","Kochi","Chandigarh","Indore","Bhopal","Nagpur",
  "Patna","Vadodara","Coimbatore","Visakhapatnam","Agra","Nashik","Madurai",
  "Guwahati","Raipur","Jodhpur","Mysore","Kota","Rajkot","Amritsar",
  "Thiruvananthapuram","Bhubaneswar","Dehradun","Ranchi","Shillong","Imphal",
  "Aizawl","Itanagar","Kohima","Agartala","Gangtok","Panaji","Puducherry",
  "Srinagar","Jammu","Leh","Varanasi","Allahabad (Prayagraj)","Kanpur",
  "Meerut","Ludhiana","Faridabad","Ghaziabad","Noida","Gurugram","Vijayawada",
  "Tirupati","Warangal","Nellore","Guntur","Hubli-Dharwad","Belgaum","Mangalore",
  "Thrissur","Kozhikode","Kollam","Salem","Tiruchirappalli","Vellore","Erode",
  "Bareilly","Aligarh","Moradabad","Jhansi","Gwalior","Ujjain","Jabalpur",
  "Dhanbad","Jamshedpur","Bokaro","Asansol","Siliguri","Durgapur","Howrah",
  "Badrinath (Char Dham)","Kedarnath (Char Dham)","Gangotri (Char Dham)","Yamunotri (Char Dham)",
  "Vaishno Devi (Jammu)","Haridwar","Rishikesh","Puri (Jagannath)",
  "Vrindavan","Mathura","Ayodhya","Shirdi","Ujjain (Mahakaleshwar)",
  "Rameshwaram","Kanyakumari","Bodh Gaya","Sarnath","Dwarka","Somnath",
  "Pushkar","Amritsar (Golden Temple)","Madurai (Meenakshi)","Kanchipuram",
  "Shimla","Manali","Dharamshala","Ooty","Munnar","Kodaikanal","Darjeeling",
  "Nainital","Mussoorie","Mount Abu","Coorg","Lonavala",
  "Goa (North)","Goa (South)","Hampi","Khajuraho","Jaisalmer","Udaipur","Ladakh",
  "Alleppey","Wayanad","Pondicherry","Mahabaleshwar","Matheran","Spiti Valley",
  "Andaman Islands","Lakshadweep","Rann of Kutch","Khajjiar","Auli",
].sort()

// Every UN member state + a handful of widely-travelled territories —
// used for "favorite destinations" so the platform can capture interest
// in markets SafeShe hasn't launched in yet.
export const WORLD_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina",
  "Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados",
  "Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana",
  "Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon",
  "Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros",
  "Congo (Brazzaville)","Congo (DRC)","Costa Rica","Croatia","Cuba","Cyprus","Czechia",
  "Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador",
  "Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea",
  "Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya",
  "Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia",
  "Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama",
  "Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines",
  "Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia",
  "Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname",
  "Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste",
  "Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda",
  "Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
].sort()

// Combined pool for the "favorite destinations" search field — India
// first since that's the active market, then the rest of the world.
export const ALL_DESTINATIONS = [...INDIAN_CITIES, ...WORLD_COUNTRIES]
