const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ MongoDB Atlas URI - Cloud database always online
// CHANGE THIS LINE - Add your MongoDB Atlas connection string here
const MONGODB_URI = 'mongodb+srv://tyson170902_db_user:ewcoPFKz7gBVKCDD@cluster0.qusi1ab.mongodb.net/rdbhub4u?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔧 Configuration:');
console.log('📊 Database URI:', MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB');
console.log('🚀 Port:', PORT);
console.log('🌐 Environment:', process.env.NODE_ENV || 'development');

// ✅ CORS Configuration - Allow all origins
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('Public'));

// ✅ Content Schema with ZIP Downloads
const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true, enum: ['movie', 'anime', 'webseries'] },
  category: String,
  year: Number,
  rating: String,
  image: { type: String, required: true },
  description: String,
  duration: String,
  language: [String],
  quality: [String],
  videoUrl: String,
  download: {
    '480p': String,
    '720p': String,
    '1080p': String,
    '4k': String
  },
  zipDownload: {
    '480p': { link: String, size: String },
    '720p': { link: String, size: String },
    '1080p': { link: String, size: String },
    '4k': { link: String, size: String },
    seasonWise: mongoose.Schema.Types.Mixed,
    completeSeries: mongoose.Schema.Types.Mixed
  },
  episodes: [{
    episodeNumber: Number,
    title: String,
    duration: String,
    download: {
      '480p': String,
      '720p': String,
      '1080p': String
    },
    zipDownload: {
      '480p': { link: String, size: String },
      '720p': { link: String, size: String }
    }
  }],
  seasons: { type: Number, default: 1 },
  totalEpisodes: Number,
  batchDownload: {
    '480p': String,
    '720p': String,
    '1080p': String
  },
  views: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Content = mongoose.model('Content', contentSchema);

// ✅ MongoDB Atlas Connection - Optimized for 24/7 Uptime
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Atlas Connection Error:', error.message);
    
    // Auto-retry logic for production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      console.error('💡 Development Tips:');
      console.error('   1. Check your internet connection');
      console.error('   2. Verify MONGODB_URI in .env file');
      console.error('   3. Make sure IP is whitelisted in Atlas');
      console.error('   4. Check MongoDB Atlas cluster status');
      process.exit(1);
    }
  }
};

// MongoDB Event Listeners for better monitoring
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB Atlas');
  console.log('📈 Connection Status: Active');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB Atlas');
  console.log('🔄 Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ Mongoose reconnected to MongoDB Atlas');
});

// ========== ADMIN API ROUTES ==========

// Get Dashboard Stats
app.get('/api/stats', async (req, res) => {
  try {
    // Check database connection first
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database temporarily unavailable',
        message: 'Reconnecting to MongoDB Atlas...'
      });
    }

    const [movies, anime, webseries, totalContent] = await Promise.all([
      Content.countDocuments({ type: 'movie' }),
      Content.countDocuments({ type: 'anime' }),
      Content.countDocuments({ type: 'webseries' }),
      Content.countDocuments({})
    ]);

    res.json({
      success: true,
      movies,
      anime,
      webseries,
      totalContent,
      database: 'MongoDB Atlas (24/7 Cloud)'
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      tip: 'Check MongoDB Atlas connection'
    });
  }
});

// Debug Endpoint with Atlas Info
app.get('/api/debug', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const allContent = await Content.find().limit(5);
    
    res.json({
      success: true,
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      database: {
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        connectionType: MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud - 24/7 Online)' : 'Local MongoDB',
        connectionState: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        collections: collections.map(c => c.name)
      },
      counts: {
        movies: await Content.countDocuments({ type: 'movie' }),
        anime: await Content.countDocuments({ type: 'anime' }),
        webseries: await Content.countDocuments({ type: 'webseries' })
      },
      sampleData: allContent
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      databaseStatus: mongoose.connection.readyState
    });
  }
});

// ========== CONTENT ROUTES (MAIN ROUTES) ==========

// ✅ FIXED: ये सही endpoint है - /api/contents (plural)
// Get All Contents with Pagination
app.get('/api/contents', async (req, res) => {
  try {
    const { page = 1, limit = 100, type, category, search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (category) {
      // Support comma-separated categories
      query.category = { $regex: category, $options: 'i' };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const contents = await Content.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Content.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 Contents API: Found ${contents.length} items (page ${page}/${totalPages})`);

    res.json({
      success: true,
      contents,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Contents error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ FIXED: ये भी सही है - /api/content/:id (singular)
// Get Single Content by ID
app.get('/api/content/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ 
        success: false, 
        error: 'Content not found' 
      });
    }

    // Increment views
    content.views += 1;
    await content.save();

    console.log(`👁️ Content viewed: ${content.title} (${content.views} views)`);

    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== CATEGORY SPECIFIC ROUTES ==========

// Get All Movies
app.get('/api/movies', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const movies = await Content.find({ type: 'movie' })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Content.countDocuments({ type: 'movie' });
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📊 Found ${movies.length} movies (page ${page}/${totalPages})`);
    
    res.json({
      success: true,
      count: movies.length,
      movies: movies,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Single Movie
app.get('/api/movies/:id', async (req, res) => {
  try {
    const movie = await Content.findOne({ 
      _id: req.params.id, 
      type: 'movie' 
    });
    
    if (!movie) {
      return res.status(404).json({ 
        success: false, 
        error: 'Movie not found' 
      });
    }
    
    // Increment views
    movie.views += 1;
    await movie.save();
    
    res.json({
      success: true,
      movie: movie
    });
  } catch (error) {
    console.error('Get movie error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add Movie
app.post('/api/movies', async (req, res) => {
  try {
    console.log('📝 Adding movie:', req.body.title);
    const newMovie = new Content({
      ...req.body,
      type: 'movie'
    });
    await newMovie.save();
    console.log('✅ Movie added successfully:', newMovie.title);
    res.json({
      success: true,
      message: 'Movie added successfully',
      movie: newMovie
    });
  } catch (error) {
    console.error('❌ Add movie error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update Movie
app.put('/api/movies/:id', async (req, res) => {
  try {
    console.log('📝 Updating movie:', req.params.id);
    const movie = await Content.findByIdAndUpdate(
      req.params.id,
      { ...req.body, type: 'movie' },
      { new: true, runValidators: true }
    );
    
    if (!movie) {
      return res.status(404).json({ 
        success: false, 
        error: 'Movie not found' 
      });
    }
    
    console.log('✅ Movie updated:', movie.title);
    res.json({
      success: true,
      message: 'Movie updated successfully',
      movie: movie
    });
  } catch (error) {
    console.error('❌ Update movie error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Movie
app.delete('/api/movies/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting movie:', req.params.id);
    const movie = await Content.findByIdAndDelete(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ 
        success: false, 
        error: 'Movie not found' 
      });
    }
    
    console.log('✅ Movie deleted:', movie.title);
    res.json({ 
      success: true, 
      message: 'Movie deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete movie error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get All Anime
app.get('/api/anime', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const anime = await Content.find({ type: 'anime' })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Content.countDocuments({ type: 'anime' });
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📊 Found ${anime.length} anime (page ${page}/${totalPages})`);
    
    res.json({
      success: true,
      count: anime.length,
      anime: anime,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get anime error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Single Anime
app.get('/api/anime/:id', async (req, res) => {
  try {
    const anime = await Content.findOne({ 
      _id: req.params.id, 
      type: 'anime' 
    });
    
    if (!anime) {
      return res.status(404).json({ 
        success: false, 
        error: 'Anime not found' 
      });
    }
    
    // Increment views
    anime.views += 1;
    await anime.save();
    
    res.json({
      success: true,
      anime: anime
    });
  } catch (error) {
    console.error('Get anime error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add Anime
app.post('/api/anime', async (req, res) => {
  try {
    console.log('📝 Adding anime:', req.body.title);
    const newAnime = new Content({
      ...req.body,
      type: 'anime'
    });
    await newAnime.save();
    console.log('✅ Anime added successfully:', newAnime.title);
    res.json({
      success: true,
      message: 'Anime added successfully',
      anime: newAnime
    });
  } catch (error) {
    console.error('❌ Add anime error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update Anime
app.put('/api/anime/:id', async (req, res) => {
  try {
    console.log('📝 Updating anime:', req.params.id);
    const anime = await Content.findByIdAndUpdate(
      req.params.id,
      { ...req.body, type: 'anime' },
      { new: true, runValidators: true }
    );
    
    if (!anime) {
      return res.status(404).json({ 
        success: false, 
        error: 'Anime not found' 
      });
    }
    
    console.log('✅ Anime updated:', anime.title);
    res.json({
      success: true,
      message: 'Anime updated successfully',
      anime: anime
    });
  } catch (error) {
    console.error('❌ Update anime error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Anime
app.delete('/api/anime/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting anime:', req.params.id);
    const anime = await Content.findByIdAndDelete(req.params.id);
    
    if (!anime) {
      return res.status(404).json({ 
        success: false, 
        error: 'Anime not found' 
      });
    }
    
    console.log('✅ Anime deleted:', anime.title);
    res.json({ 
      success: true, 
      message: 'Anime deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete anime error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get All WebSeries
app.get('/api/webseries', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const webseries = await Content.find({ type: 'webseries' })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Content.countDocuments({ type: 'webseries' });
    const totalPages = Math.ceil(total / limit);
    
    console.log(`📊 Found ${webseries.length} webseries (page ${page}/${totalPages})`);
    
    res.json({
      success: true,
      count: webseries.length,
      webseries: webseries,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get webseries error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Single WebSeries
app.get('/api/webseries/:id', async (req, res) => {
  try {
    const webseries = await Content.findOne({ 
      _id: req.params.id, 
      type: 'webseries' 
    });
    
    if (!webseries) {
      return res.status(404).json({ 
        success: false, 
        error: 'WebSeries not found' 
      });
    }
    
    // Increment views
    webseries.views += 1;
    await webseries.save();
    
    res.json({
      success: true,
      webseries: webseries
    });
  } catch (error) {
    console.error('Get webseries error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add WebSeries
app.post('/api/webseries', async (req, res) => {
  try {
    console.log('📝 Adding webseries:', req.body.title);
    const newWebSeries = new Content({
      ...req.body,
      type: 'webseries'
    });
    await newWebSeries.save();
    console.log('✅ WebSeries added successfully:', newWebSeries.title);
    res.json({
      success: true,
      message: 'WebSeries added successfully',
      webseries: newWebSeries
    });
  } catch (error) {
    console.error('❌ Add webseries error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update WebSeries
app.put('/api/webseries/:id', async (req, res) => {
  try {
    console.log('📝 Updating webseries:', req.params.id);
    const webseries = await Content.findByIdAndUpdate(
      req.params.id,
      { ...req.body, type: 'webseries' },
      { new: true, runValidators: true }
    );
    
    if (!webseries) {
      return res.status(404).json({ 
        success: false, 
        error: 'WebSeries not found' 
      });
    }
    
    console.log('✅ WebSeries updated:', webseries.title);
    res.json({
      success: true,
      message: 'WebSeries updated successfully',
      webseries: webseries
    });
  } catch (error) {
    console.error('❌ Update webseries error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete WebSeries
app.delete('/api/webseries/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting webseries:', req.params.id);
    const webseries = await Content.findByIdAndDelete(req.params.id);
    
    if (!webseries) {
      return res.status(404).json({ 
        success: false, 
        error: 'WebSeries not found' 
      });
    }
    
    console.log('✅ WebSeries deleted:', webseries.title);
    res.json({ 
      success: true, 
      message: 'WebSeries deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete webseries error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== FRONTEND API ROUTES ==========

// Get Featured Content
app.get('/api/featured', async (req, res) => {
  try {
    const { type } = req.query;
    const query = { featured: true };
    if (type) query.type = type;

    const contents = await Content.find(query).limit(6).sort({ views: -1 });

    res.json({
      success: true,
      count: contents.length,
      contents
    });
  } catch (error) {
    console.error('Featured error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Trending Content
app.get('/api/trending', async (req, res) => {
  try {
    const { type } = req.query;
    const query = {};
    if (type) query.type = type;

    const contents = await Content.find(query).limit(6).sort({ views: -1 });

    res.json({
      success: true,
      count: contents.length,
      contents
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ REMOVED: पुराना /api/content endpoint (यह confuse कर रहा था)
// इसकी जगह /api/contents का use करें

// Search Content
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query required' 
      });
    }

    const contents = await Content.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { language: { $regex: q, $options: 'i' } }
      ]
    }).limit(20).sort({ views: -1 });

    console.log(`🔍 Search for "${q}" found ${contents.length} results`);

    res.json({
      success: true,
      count: contents.length,
      query: q,
      contents
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== SERVE HTML FILES ==========

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

app.get('/movies.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'movies.html'));
});

app.get('/anime.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'anime.html'));
});

app.get('/webseries.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'webseries.html'));
});

app.get('/category.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'category.html'));
});

app.get('/detail.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'detail.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'admin.html'));
});

// Health Check with detailed info
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    status: 'OK',
    server: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    },
    database: {
      status: statusMap[dbStatus] || 'Unknown',
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      type: MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas (24/7 Cloud)' : 'Local'
    },
    system: {
      memory: process.memoryUsage(),
      nodeVersion: process.version
    }
  });
});

// Simple status check for load balancers
app.get('/status', (req, res) => {
  res.json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n⚠️ Shutting down gracefully...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB Atlas connection closed');
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

let server;

// Start server only after DB connection is successful
const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║          🎬 StreamHub Server Running 🎬              ║
  ╠══════════════════════════════════════════════════════╣
  ║  Server:     http://localhost:${PORT}                   ║
  ║  Admin:      http://localhost:${PORT}/admin.html       ║
  ║  Debug:      http://localhost:${PORT}/api/debug        ║
  ║  Health:     http://localhost:${PORT}/health          ║
  ║  Status:     http://localhost:${PORT}/status          ║
  ║                                                      ║
  ║  Main API:   http://localhost:${PORT}/api/contents     ║
  ║  Movies:     http://localhost:${PORT}/api/movies      ║
  ║  Anime:      http://localhost:${PORT}/api/anime       ║
  ║  WebSeries:  http://localhost:${PORT}/api/webseries   ║
  ║                                                      ║
  ║  Database:   MongoDB Atlas (24/7 Cloud)              ║
  ║  Status:     ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}        ║
  ╚══════════════════════════════════════════════════════╝
    `);
    
    // Log server info
    console.log(`\n📊 Server Information:`);
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Database: ${MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    console.log(`   Public Directory: ${path.join(__dirname, 'Public')}`);
  });
};

startServer();