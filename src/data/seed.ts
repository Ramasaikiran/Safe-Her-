export const GUIDES = [
  {
    id: 'g1', name: 'Priya Sharma', city: 'Bangalore', rating: 4.9, reviews: 127,
    languages: ['English', 'Hindi', 'Kannada'], price_per_hour: 499,
    specialties: ['Heritage Walks', 'Food Tours', 'Night Markets'],
    bio: 'Born and raised in Bangalore. I\'ve been guiding solo women travelers for 4 years. I know every safe route, great café, and hidden gem this city has.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=ffd5dc',
    verified: true, available: true, trips_completed: 127
  },
  {
    id: 'g2', name: 'Meera Nair', city: 'Goa', rating: 4.8, reviews: 89,
    languages: ['English', 'Hindi', 'Konkani', 'Malayalam'],
    price_per_hour: 599,
    specialties: ['Beach Safety', 'Local Culture', 'Spice Farms'],
    bio: 'Goa local with 5 years of experience. I make sure solo women have an amazing AND safe Goa experience — real Goa, not tourist traps.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=meera&backgroundColor=c0e5c8',
    verified: true, available: true, trips_completed: 89
  },
  {
    id: 'g3', name: 'Ananya Gupta', city: 'Jaipur', rating: 4.9, reviews: 203,
    languages: ['English', 'Hindi', 'Rajasthani'],
    price_per_hour: 449,
    specialties: ['Palace Tours', 'Textile Shopping', 'Photography Spots'],
    bio: 'Art historian turned guide. Jaipur\'s forts, bazaars, and stories — I bring them alive. Safe routes, verified dhabas, always.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya&backgroundColor=ffecd2',
    verified: true, available: false, trips_completed: 203
  },
  {
    id: 'g4', name: 'Kavitha Reddy', city: 'Mumbai', rating: 4.7, reviews: 156,
    languages: ['English', 'Hindi', 'Marathi', 'Telugu'],
    price_per_hour: 699,
    specialties: ['Street Food Tours', 'Dharavi Walk', 'Marine Drive'],
    bio: 'Mumbai local for 28 years. I know this city\'s pulse. I\'ll show you the real Mumbai — Dharavi, Versova, Sassoon Dock — safely.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=kavitha&backgroundColor=d5e8d4',
    verified: true, available: true, trips_completed: 156
  },
  {
    id: 'g5', name: 'Ritu Verma', city: 'Bangalore', rating: 4.8, reviews: 74,
    languages: ['English', 'Hindi', 'Kannada'],
    price_per_hour: 549,
    specialties: ['Craft Breweries', 'Startup Culture', 'Namma Metro Tour'],
    bio: 'Former startup founder turned guide. I show Bangalore\'s modern side — tech parks, microbreweries, art galleries. Safe and fun.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ritu&backgroundColor=ffe6cc',
    verified: true, available: true, trips_completed: 74
  },
  {
    id: 'g6', name: 'Deepa Krishnan', city: 'Goa', rating: 5.0, reviews: 41,
    languages: ['English', 'Konkani', 'Portuguese'],
    price_per_hour: 649,
    specialties: ['Old Goa Churches', 'Portuguese Heritage', 'Sunset Spots'],
    bio: 'Goa heritage expert. I speak Portuguese and have deep knowledge of Goa\'s 450-year colonial history. Safe, scholarly, and fun.',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=deepa&backgroundColor=e8d5f5',
    verified: true, available: true, trips_completed: 41
  }
]

export const HOSTELS = [
  {
    id: 'h1', name: "The Wanderer's Nest", city: 'Bangalore', rating: 4.8, reviews: 312,
    price_per_night: 599, women_only: true, available_rooms: 4,
    amenities: ['WiFi', 'Lockers', '24/7 CCTV', 'Female Staff Only', 'Common Kitchen', 'Rooftop Café'],
    address: 'Koramangala 5th Block, Bangalore',
    image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    verified: true
  },
  {
    id: 'h2', name: 'She Stays Goa', city: 'Goa', rating: 4.9, reviews: 187,
    price_per_night: 849, women_only: true, available_rooms: 2,
    amenities: ['Pool', 'WiFi', 'Lockers', '24/7 Security', 'Yoga Deck', 'Beach Shuttle'],
    address: 'Arambol Beach Road, North Goa',
    image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
    verified: true
  },
  {
    id: 'h3', name: 'Pink City Stays', city: 'Jaipur', rating: 4.7, reviews: 245,
    price_per_night: 499, women_only: false, available_rooms: 6,
    amenities: ['WiFi', 'Rooftop', '24/7 CCTV', 'Female Floor', 'Travel Desk'],
    address: 'MI Road, Near Ajmeri Gate, Jaipur',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    verified: true
  },
  {
    id: 'h4', name: 'Mumbai Sisterhood Hub', city: 'Mumbai', rating: 4.6, reviews: 428,
    price_per_night: 799, women_only: true, available_rooms: 0,
    amenities: ['WiFi', 'AC', 'Lockers', 'Female Staff', 'Metro Access', 'Security Guard'],
    address: 'Bandra West, Mumbai',
    image_url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80',
    verified: true
  },
  {
    id: 'h5', name: 'Bloom Hostel', city: 'Bangalore', rating: 4.5, reviews: 167,
    price_per_night: 449, women_only: false, available_rooms: 8,
    amenities: ['WiFi', 'Lockers', 'CCTV', 'Co-working Space', 'Café'],
    address: 'Indiranagar, Bangalore',
    image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&q=80',
    verified: true
  },
  {
    id: 'h6', name: 'Anjuna Sisters', city: 'Goa', rating: 4.8, reviews: 93,
    price_per_night: 699, women_only: true, available_rooms: 3,
    amenities: ['Pool', 'WiFi', 'Yoga', 'Female Only', 'Hammocks', 'Organic Kitchen'],
    address: 'Anjuna Beach, Goa',
    image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
    verified: true
  }
]

export const CITIES = [
  { name: 'Bangalore', emoji: '🌿', status: 'live', guides: 12, hostels: 8 },
  { name: 'Goa', emoji: '🏖️', status: 'live', guides: 9, hostels: 11 },
  { name: 'Jaipur', emoji: '🕌', status: 'live', guides: 7, hostels: 6 },
  { name: 'Mumbai', emoji: '🌊', status: 'live', guides: 15, hostels: 9 },
  { name: 'Manali', emoji: '🏔️', status: 'coming', guides: 0, hostels: 0 },
  { name: 'Varanasi', emoji: '🛕', status: 'coming', guides: 0, hostels: 0 },
  { name: 'Kochi', emoji: '🌺', status: 'coming', guides: 0, hostels: 0 },
  { name: 'Delhi', emoji: '🏯', status: 'coming', guides: 0, hostels: 0 },
]
