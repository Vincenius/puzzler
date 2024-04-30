// // import { parse } from 'csv-parse/sync';
// // import fs from 'fs';
// import { MongoClient } from 'mongodb';

// export default async function handler(req, res) {
//   const client = new MongoClient(process.env.MONGODB_URI);

//   try {
//     await client.connect();
//     console.log('Connected to MongoDB server');

//     const db = client.db(process.env.MONGODB_DB);
//     const puzzlesCollection = db.collection('puzzles');

//     await puzzlesCollection.updateMany(
//       { date: { $exists: true } },
//       { $set: { solved: {}, date: undefined } }
//     );
//   } catch (error) {
//     console.error('Error resetting puzzles:', error);
//   } finally {
//     // Close the connection
//     client.close();
//   }

//   res.status(200).json({ name: "OK" });

// }
