const mongoose = require('mongoose');
require('dotenv').config();
// ✅ MongoDB Atlas URI - Cloud database always online
const MONGODB_URI = 'mongodb+srv://tyson170902_db_user:ewcoPFKz7gBVKCDD@cluster0.qusi1ab.mongodb.net/rdbhub4u?retryWrites=true&w=majority&appName=Cluster0';
const contentSchema = new mongoose.Schema({
  title: String,
  type: String,
  category: String,
  year: Number,
  rating: String,
  image: String,
  description: String,
  duration: String,
  language: [String],
  quality: [String],
  download: Object,
  views: Number,
  featured: Boolean,
  createdAt: Date
});

const Content = mongoose.model('Content', contentSchema);

console.log('\n🌱 Database Cleanup Script...\n');

mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');
  console.log('📊 Database:', mongoose.connection.name);
  
  const deleteResult = await Content.deleteMany({});
  console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing entries`);
  console.log('\n✨ Database cleanup complete!');
  console.log('All content has been removed.');
  
  mongoose.connection.close();
})
.catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error('💡 Check:');
  console.error('   - Internet connection');
  console.error('   - MongoDB Atlas credentials');
  console.error('   - IP whitelist settings');
  process.exit(1);
});